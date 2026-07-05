const razorpay = require("../config/razorpay");
const crypto = require("crypto");
const Appointment = require("../models/Appointment");
const Availability = require("../models/Availability");

// Create order
exports.createOrder = async (req, res) => {
  try {
    const { appointmentId, amount } = req.body;

    // Verify the appointment exists and belongs to the requesting user
    const appointment = await Appointment.findOne({
      _id: appointmentId,
      patientId: req.user.id,
    });

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found or not authorized" });
    }

    if (appointment.paymentStatus === "Paid") {
      return res.status(400).json({ message: "Appointment is already paid" });
    }

    const options = {
      amount: amount * 100, // Razorpay works in paise
      currency: "INR",
      receipt: appointmentId,
    };

    const order = await razorpay.orders.create(options);

    // Store the Razorpay order ID on the appointment for reconciliation
    appointment.razorpayOrderId = order.id;
    await appointment.save();

    res.json(order);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Verify payment — cryptographically validates the Razorpay signature
exports.verifyPayment = async (req, res) => {
  try {
    const { appointmentId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    // Validate required fields
    if (!appointmentId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ message: "Missing required payment verification fields" });
    }

    // Verify the appointment exists and belongs to the requesting user
    const appointment = await Appointment.findOne({
      _id: appointmentId,
      patientId: req.user.id,
    });

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found or not authorized" });
    }

    if (appointment.paymentStatus === "Paid") {
      return res.status(400).json({ message: "Payment already verified" });
    }

    // Verify that the order ID matches what we stored
    if (appointment.razorpayOrderId && appointment.razorpayOrderId !== razorpay_order_id) {
      return res.status(400).json({ message: "Order ID mismatch" });
    }

    // Cryptographically verify the Razorpay signature
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ message: "Payment verification failed — invalid signature" });
    }

    // Signature is valid — mark as paid
    await Appointment.findByIdAndUpdate(appointmentId, {
      paymentStatus: "Paid"
    });

    res.json({ message: "Payment verified and confirmed successfully" });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Revert booking when payment fails or is dismissed
exports.revertBooking = async (req, res) => {
  try {
    const { appointmentId } = req.body;

    const appointment = await Appointment.findById(appointmentId);

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    // Authorization: only the patient who booked can revert
    if (appointment.patientId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to revert this booking" });
    }

    // Only revert if payment is still Pending
    if (appointment.paymentStatus === "Paid") {
      return res.status(400).json({ message: "Cannot revert a paid appointment" });
    }

    // Free the slot back
    await Availability.findOneAndUpdate(
      {
        doctorId: appointment.doctorId,
        date: appointment.date,
        "slots.time": appointment.slotTime,
      },
      {
        $set: { "slots.$.isBooked": false },
      }
    );

    // Delete the unpaid appointment
    await Appointment.findByIdAndDelete(appointmentId);

    res.json({ message: "Booking reverted successfully" });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
