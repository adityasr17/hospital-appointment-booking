const mongoose = require("mongoose");

const slotSchema = new mongoose.Schema({
  time: String,
  isBooked: {
    type: Boolean,
    default: false,
  },
});

const availabilitySchema = new mongoose.Schema({
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  date: {
    type: String, // "2026-02-15"
    required: true,
  },
  slots: [slotSchema],
});

availabilitySchema.index({ doctorId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("Availability", availabilitySchema);
