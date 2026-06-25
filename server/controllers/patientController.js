const Appointment = require("../models/Appointment");
const Availability = require("../models/Availability");
const User = require("../models/User");

// 1️⃣ Get upcoming appointments for the logged-in patient
exports.getUpcomingAppointments = async (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];

    const appointments = await Appointment.find({
      patientId: req.user.id,
      status: "Booked",
      date: { $gte: today }
    })
      .populate("doctorId", "name specialization consultationFee")
      .sort({ date: 1, slotTime: 1 });

    res.json(appointments);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 2️⃣ Get past appointment history
exports.getPastAppointments = async (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];

    const appointments = await Appointment.find({
      patientId: req.user.id,
      $or: [
        { date: { $lt: today } },
        { status: { $in: ["Completed", "Cancelled", "No Show"] } }
      ]
    })
      .populate("doctorId", "name specialization consultationFee")
      .sort({ date: -1, slotTime: -1 });

    res.json(appointments);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 3️⃣ Get invoice data for a specific appointment
exports.getInvoice = async (req, res) => {
  try {
    const { appointmentId } = req.params;

    const appointment = await Appointment.findOne({
      _id: appointmentId,
      patientId: req.user.id
    })
      .populate("doctorId", "name specialization consultationFee")
      .populate("patientId", "name email");

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    res.json({
      invoiceId: `INV-${appointment._id.toString().slice(-8).toUpperCase()}`,
      patientName: appointment.patientId.name,
      patientEmail: appointment.patientId.email,
      doctorName: appointment.doctorId.name,
      specialization: appointment.doctorId.specialization,
      date: appointment.date,
      slotTime: appointment.slotTime,
      amount: appointment.amount,
      paymentStatus: appointment.paymentStatus,
      status: appointment.status,
      createdAt: appointment.createdAt
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 4️⃣ Reschedule an appointment
exports.rescheduleAppointment = async (req, res) => {
  try {
    const { appointmentId, newDate, newSlotTime } = req.body;

    const appointment = await Appointment.findOne({
      _id: appointmentId,
      patientId: req.user.id,
      status: "Booked"
    });

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found or not eligible for rescheduling" });
    }

    // Free the old slot
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

    // Book the new slot atomically
    const updatedAvailability = await Availability.findOneAndUpdate(
      {
        doctorId: appointment.doctorId,
        date: newDate,
        slots: {
          $elemMatch: {
            time: newSlotTime,
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
      // Re-book the old slot since new one failed
      await Availability.findOneAndUpdate(
        {
          doctorId: appointment.doctorId,
          date: appointment.date,
          "slots.time": appointment.slotTime,
        },
        {
          $set: { "slots.$.isBooked": true },
        }
      );
      return res.status(400).json({ message: "New slot is not available" });
    }

    // Update the appointment record
    appointment.date = newDate;
    appointment.slotTime = newSlotTime;
    await appointment.save();

    res.json({ message: "Appointment rescheduled successfully", appointment });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
