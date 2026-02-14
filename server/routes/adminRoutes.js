const express = require("express");
const router = express.Router();

const {
  getTotalRevenue,
  getPaymentStats,
  getMonthlyRevenue,
  getMostBookedDoctor,
  registerDoctor,
  adminCreateAvailability,
} = require("../controllers/adminController");

const { protect, authorize } = require("../middleware/authMiddleware");

router.get("/total-revenue", protect, authorize("admin"), getTotalRevenue);
router.get("/payment-stats", protect, authorize("admin"), getPaymentStats);
router.get("/monthly-revenue", protect, authorize("admin"), getMonthlyRevenue);
router.get("/top-doctor", protect, authorize("admin"), getMostBookedDoctor);

router.post("/register-doctor", protect, authorize("admin"), registerDoctor);
router.post("/create-availability", protect, authorize("admin"), adminCreateAvailability);

module.exports = router;
