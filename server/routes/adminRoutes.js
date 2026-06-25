const express = require("express");
const router = express.Router();

const {
  getTotalRevenue,
  getPaymentStats,
  getMonthlyRevenue,
  getTopDoctors,
  getUserGrowth,
  getAllAppointments,
  registerDoctor,
  adminCreateAvailability,
} = require("../controllers/adminController");

const { protect, authorize } = require("../middleware/authMiddleware");

router.get("/total-revenue", protect, authorize("admin"), getTotalRevenue);
router.get("/payment-stats", protect, authorize("admin"), getPaymentStats);
router.get("/monthly-revenue", protect, authorize("admin"), getMonthlyRevenue);
router.get("/top-doctors", protect, authorize("admin"), getTopDoctors);
router.get("/user-growth", protect, authorize("admin"), getUserGrowth);
router.get("/all-appointments", protect, authorize("admin"), getAllAppointments);

router.post("/register-doctor", protect, authorize("admin"), registerDoctor);
router.post("/create-availability", protect, authorize("admin"), adminCreateAvailability);

module.exports = router;
