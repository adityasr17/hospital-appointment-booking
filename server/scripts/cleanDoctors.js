const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');

const cleanUp = async () => {
    try {
        console.log('Using MONGO_URI:', process.env.MONGO_URI);
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);

        // Find doctors to check names first
        const doctors = await User.find({ role: 'doctor' });
        console.log('Found doctors:', doctors.map(d => d.name));

        const result = await User.deleteMany({ 
            role: 'doctor', 
            name: { $ne: 'Mr. Sharma' } 
        });

        console.log(`Deleted ${result.deletedCount} doctors.`);
        
        const remaining = await User.find({ role: 'doctor' });
        console.log('Remaining doctors:', remaining.map(d => d.name));
        
        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

cleanUp();
