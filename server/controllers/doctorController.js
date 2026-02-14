const mongoose = require("mongoose");
const Appointment = require("../models/Appointment");

// 1️⃣ Get all appointments for logged-in doctor
exports.getDoctorAppointments = async (req, res) => {
  try {
    console.log("getDoctorAppointments called for doctorId:", req.user.id);

    const appointments = await Appointment.find({
      doctorId: req.user.id
    }).sort({ createdAt: -1 });

    console.log(`Found ${appointments.length} appointments for doctor ${req.user.id}`);

    res.json(appointments);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 2️⃣ Get doctor's total revenue
exports.getDoctorRevenue = async (req, res) => {
  try {
    const result = await Appointment.aggregate([
      {
        $match: {
          doctorId: new mongoose.Types.ObjectId(req.user.id),
          paymentStatus: "Paid"
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$amount" }
        }
      }
    ]);

    res.json(result[0] || { totalRevenue: 0 });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 3️⃣ Mark appointment as completed
exports.completeAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.body;

    const appointment = await Appointment.findOneAndUpdate(
      {
        _id: appointmentId,
        doctorId: req.user.id
      },
      {
        status: "Completed"
      },
      { new: true }
    );

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    res.json({ message: "Appointment marked as completed", appointment });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
