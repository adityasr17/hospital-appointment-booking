const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/authMiddleware");
const { createAvailability, getAvailability , bookAppointment , cancelAppointment} = require("../controllers/availabilityController");



router.post(
  "/",
  protect,
  authorize("doctor"),
  createAvailability
);

router.get("/:doctorId/:date", getAvailability);

router.post(
  "/book",
  protect,
  authorize("patient"),
  bookAppointment
);

router.post(
  "/cancel",
  protect,
  authorize("patient"),
  cancelAppointment
);

module.exports = router;
