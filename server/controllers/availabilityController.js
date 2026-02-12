const Availability = require("../models/Availability");
const generateSlots = require("../utils/slotGenerator");

exports.createAvailability = async (req, res) => {
  try {
    const { date, startTime, endTime, breakStart, breakEnd } = req.body;

    const slots = generateSlots(startTime, endTime, breakStart, breakEnd);

    const availability = await Availability.create({
      doctorId: req.user.id,
      date,
      slots,
    });

    res.status(201).json(availability);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getAvailability = async (req, res) => {
  try {
    const { doctorId, date } = req.params;

    const availability = await Availability.findOne({
      doctorId,
      date,
    });

    if (!availability) {
      return res.status(404).json({ message: "No availability found" });
    }

    const availableSlots = availability.slots.filter(
      (slot) => !slot.isBooked
    );

    res.json(availableSlots);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const Appointment = require("../models/Appointment");

exports.bookAppointment = async (req, res) => {
  try {
    const { doctorId, date, slotTime } = req.body;

    const updatedAvailability = await Availability.findOneAndUpdate(
      {
        doctorId,
        date,
        slots: {
          $elemMatch: {
            time: slotTime,
            isBooked: false,
          },
        },
      },
      {
        $set: { "slots.$.isBooked": true },
      },
      { new: true }
    );

    if (!updatedAvailability) {
      return res.status(400).json({ message: "Slot already booked" });
    }

    const appointment = await Appointment.create({
      patientId: req.user.id,
      doctorId,
      date,
      slotTime,
    });

    res.status(201).json({
      message: "Appointment booked successfully",
      appointment,
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.cancelAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.body;

    const appointment = await Appointment.findById(appointmentId);

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    // Only the patient who booked can cancel
    if (appointment.patientId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to cancel" });
    }

    if (appointment.status === "Cancelled") {
      return res.status(400).json({ message: "Already cancelled" });
    }

    // Free the slot atomically
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

    appointment.status = "Cancelled";
    await appointment.save();

    res.json({ message: "Appointment cancelled successfully" });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
