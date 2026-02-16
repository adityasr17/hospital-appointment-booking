const Appointment = require("../models/Appointment");
const User = require("../models/User");
const Availability = require("../models/Availability");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const generateSlots = require("../utils/slotGenerator");

// 1️⃣ Total Revenue
exports.getTotalRevenue = async (req, res) => {
  try {
    const result = await Appointment.aggregate([
      { $match: { paymentStatus: "Paid" } },
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

// 2️⃣ Paid vs Pending
exports.getPaymentStats = async (req, res) => {
  try {
    const result = await Appointment.aggregate([
      {
        $group: {
          _id: "$paymentStatus",
          count: { $sum: 1 }
        }
      }
    ]);

    res.json(result);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 3️⃣ Monthly Revenue
exports.getMonthlyRevenue = async (req, res) => {
  try {
    const result = await Appointment.aggregate([
      { $match: { paymentStatus: "Paid" } },
      {
        $group: {
          _id: { $month: "$createdAt" },
          totalRevenue: { $sum: "$amount" }
        }
      },
      { $sort: { "_id": 1 } }
    ]);

    res.json(result);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 4️⃣ Most Booked Doctor
exports.getMostBookedDoctor = async (req, res) => {
  try {
    const result = await Appointment.aggregate([
      {
        $group: {
          _id: "$doctorId",
          totalAppointments: { $sum: 1 }
        }
      },
      { $sort: { totalAppointments: -1 } },
      { $limit: 1 }
    ]);

    res.json(result[0] || {});

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 5️⃣ Register a new doctor (admin only)
exports.registerDoctor = async (req, res) => {
  try {
    const { name, email, password, specialization, consultationFee } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "A user with this email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const doctor = await User.create({
      name,
      email,
      password: hashedPassword,
      role: "doctor",
      specialization,
      consultationFee,
    });

    res.status(201).json({
      message: "Doctor registered successfully",
      doctor: {
        _id: doctor._id,
        name: doctor.name,
        email: doctor.email,
        specialization: doctor.specialization,
        consultationFee: doctor.consultationFee,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 6️⃣ Create availability for a doctor (admin only)
exports.adminCreateAvailability = async (req, res) => {
  try {
    const { doctorId, date, startTime, endTime, breakStart, breakEnd } = req.body;

    if (!doctorId || !date || !startTime || !endTime) {
      return res.status(400).json({ message: "doctorId, date, startTime, and endTime are required" });
    }

    const doctor = await User.findOne({ _id: doctorId, role: "doctor" });
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    const slots = generateSlots(startTime, endTime, breakStart, breakEnd);
    
    if (slots.length === 0) {
      return res.status(400).json({ message: "No slots created. Check start/end times." });
    }

    const availability = await Availability.create({
      doctorId,
      date,
      slots,
    });

    res.status(201).json({
      message: "Availability created successfully",
      availability,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "Availability already exists for this doctor on this date" });
    }
    res.status(400).json({ message: error.message });
  }
};
