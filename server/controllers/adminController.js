const Appointment = require("../models/Appointment");
const mongoose = require("mongoose");

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
