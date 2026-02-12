const razorpay = require("../config/razorpay");
const crypto = require("crypto");
const Appointment = require("../models/Appointment");

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
