const razorpay = require("../config/razorpay");
const crypto = require("crypto");
const Appointment = require("../models/Appointment");
const Availability = require("../models/Availability");

// Create order
exports.createOrder = async (req, res) => {
  try {
    const { appointmentId, amount } = req.body;

    const options = {
      amount: amount * 100, // Razorpay works in paise
      currency: "INR",
      receipt: appointmentId,
    };

    const order = await razorpay.orders.create(options);

    res.json(order);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Verify payment
exports.verifyPayment = async (req, res) => {
  try {
    const { appointmentId } = req.body;

    await Appointment.findByIdAndUpdate(appointmentId, {
      paymentStatus: "Paid"
    });

    res.json({ message: "Payment marked as Paid (Test Mode)" });

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
