# 🏥 Hospital Appointment Booking System (MERN Stack)

A production-style Hospital Appointment Booking System built using the MERN stack (MongoDB, Express.js, React, Node.js). This application allows patients to book appointments with doctors, automatically generates time slots, prevents double booking using atomic database operations, and supports appointment cancellation with slot restoration.

This project demonstrates real-world backend architecture and advanced MongoDB concepts.

---

## 🚀 Project Overview

This system simulates a real hospital booking platform similar to modern healthcare apps.

### 👨‍⚕️ Doctor Features
- Define working hours (e.g., 9AM – 5PM)
- Automatic 15-minute slot generation
- Optional break time exclusion
- Manage availability

### 👤 Patient Features
- View available slots
- Book appointment
- Prevent double booking (atomic logic)
- Cancel appointment
- Slot automatically freed after cancellation

### 🔒 Security
- JWT Authentication
- Role-based access control (Doctor / Patient / Admin)
- Protected API routes

---

## 🧠 Backend Concepts Implemented

- MongoDB `$elemMatch` for atomic booking
- Positional `$` operator for updating nested array elements
- Compound indexing to prevent duplicate availability
- Role-based middleware
- RESTful API design
- Clean MVC folder structure

---

## 🛠 Tech Stack

### Backend
- Node.js
- Express.js
- MongoDB Atlas
- Mongoose
- JWT (Authentication)
- bcrypt (Password hashing)
- Nodemon

### Database
- MongoDB (Cloud - Atlas)

---

## 📡 API Endpoints

### 🔐 Authentication

- `POST /api/auth/register` → Register user
- `POST /api/auth/login` → Login user

### 🩺 Doctor Availability

- `POST /api/availability` → Create availability (Doctor only)
- `GET /api/availability/:doctorId/:date` → Get available slots

### 📅 Appointment Management

- `POST /api/availability/book` → Book appointment (Patient only)
- `POST /api/availability/cancel` → Cancel appointment

---

## 📂 Project Structure

server/
├── config/
├── controllers/
├── middleware/
├── models/
├── routes/
├── utils/
├── server.js
└── .env


---

## ⚙️ How To Run Locally

### 1️⃣ Clone the repository

git clone https://github.com/adityasr17/hospital-appointment-booking.git

### 2️⃣ Install dependencies

cd server
npm install

### 3️⃣ Create a `.env` file inside `/server`

Add:
MONGO_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_secret_key
PORT=5000

### 4️⃣ Run the server

npm run dev
Server runs on: http://localhost:5000


---

## 🧪 Testing

Use Postman to test API endpoints.

---

## 🎯 Future Enhancements

- Payment Integration (Razorpay / Stripe)
- Real-time slot locking (Socket.io)
- Doctor dashboard
- Admin analytics (MongoDB aggregation pipeline)
- Email notifications
- Deployment (Render / AWS)

---

## 👨‍💻 Author

Aditya Singh Rathaur  
MERN Stack Developer
