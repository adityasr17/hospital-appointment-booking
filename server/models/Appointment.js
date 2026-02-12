const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  date: String,
  slotTime: String,
  status: {
    type: String,
    enum: ["Booked", "Cancelled", "Completed"],
    default: "Booked",
  },
  paymentStatus: {
    type: String,
    enum: ["Pending", "Paid"],
    default: "Pending",
  },
}, { timestamps: true });

module.exports = mongoose.model("Appointment", appointmentSchema);
