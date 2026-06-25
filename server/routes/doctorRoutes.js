const express = require("express");
const router = express.Router();

const {
  getDoctorAppointments,
  getDoctorRevenue,
  completeAppointment,
  getDoctorScheduleByDate,
  markNoShow
} = require("../controllers/doctorController");

const { protect, authorize } = require("../middleware/authMiddleware");

router.get("/appointments", protect, authorize("doctor"), getDoctorAppointments);
router.get("/revenue", protect, authorize("doctor"), getDoctorRevenue);
router.get("/schedule", protect, authorize("doctor"), getDoctorScheduleByDate);
router.post("/complete", protect, authorize("doctor"), completeAppointment);
router.post("/no-show", protect, authorize("doctor"), markNoShow);

module.exports = router;
