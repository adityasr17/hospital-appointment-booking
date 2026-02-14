const express = require("express");
const router = express.Router();
const User = require("../models/User");
const { register, login } = require("../controllers/authController");

router.post("/register", register);

router.post("/login", login);

router.get("/doctors", async (req, res) => {
  const doctors = await User.find({ role: "doctor" }).select("name _id consultationFee specialization");
  res.json(doctors);
});

module.exports = router;
