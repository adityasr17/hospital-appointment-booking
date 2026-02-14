const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

const seed = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB Connected`);

        const email = "sharma@example.com"; // Default email
        const password = "password123";
        const hashedPassword = await bcrypt.hash(password, 10);

        const doctor = new User({
            name: "Dr. Sharma",
            email: email,
            password: hashedPassword,
            role: "doctor",
            specialization: "General Physician",
            consultationFee: 500
        });

        await doctor.save();
        console.log("Dr. Sharma created successfully!");
        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

seed();
