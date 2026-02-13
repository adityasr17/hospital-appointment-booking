const express = require("express");
const router = express.Router();

const {
  getDoctorAppointments,
  getDoctorRevenue,
  completeAppointment
} = require("../controllers/doctorController");

const { protect, authorize } = require("../middleware/authMiddleware");

router.get("/appointments", protect, authorize("doctor"), getDoctorAppointments);
router.get("/revenue", protect, authorize("doctor"), getDoctorRevenue);
router.post("/complete", protect, authorize("doctor"), completeAppointment);

module.exports = router;
