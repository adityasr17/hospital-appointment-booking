const express = require("express");
const router = express.Router();

const {
  getUpcomingAppointments,
  getPastAppointments,
  getInvoice,
  rescheduleAppointment
} = require("../controllers/patientController");

const { protect, authorize } = require("../middleware/authMiddleware");

router.get("/upcoming", protect, authorize("patient"), getUpcomingAppointments);
router.get("/history", protect, authorize("patient"), getPastAppointments);
router.get("/invoice/:appointmentId", protect, authorize("patient"), getInvoice);
router.post("/reschedule", protect, authorize("patient"), rescheduleAppointment);

module.exports = router;
