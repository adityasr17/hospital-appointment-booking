# 🏥 Hospital Appointment Booking System (MERN Stack)

A comprehensive, production-ready Hospital Appointment Booking System built using the MERN stack (MongoDB, Express.js, React, Node.js). This application enables patients to search for doctors, book appointments, and manage their health records, while allowing doctors to manage their schedules and appointments. It also includes an admin dashboard for overall system management.

This project demonstrates advanced concepts like atomic database operations for booking, real-time updates using Socket.io, and secure payment integration with Razorpay.

---

## 🚀 Features

### 👨‍⚕️ Doctor Features

- **Dashboard:** View upcoming appointments and patient details.
- **Schedule Management:** Set available working hours and break times.
- **Availability:** Automatic slot generation (15/30 mins) based on working hours.
- **Profile Management:** Update specialization, fees, and contact info.

### 👤 Patient Features

- **Doctor Search:** Filter doctors by specialization and availability.
- **Appointment Booking:** Real-time slot selection and booking.
- **Payments:** Secure online payments via Razorpay.
- **History:** View past and upcoming appointments.
- **Cancellations:** Cancel appointments with automatic refund processing (business logic).

### 🛡 Admin Features

- **User Management:** Manage doctors and patients.
- **System Overview:** View total bookings, revenue, and active users.

### ⚙️ Technical Highlights

- **Atomic Booking:** Prevents double-booking using MongoDB transactions/atomic operators.
- **Real-time Updates:** Socket.io for instant notifications on booking status.
- **Security:** JWT Authentication, HttpOnly cookies, and Role-Based Access Control (RBAC).
- **Payment Gateway:** Razorpay integration for seamless transactions.

---

## 🛠 Tech Stack

### Frontend (Client)

- **React.js** (v19)
- **Tailwind CSS** (Styling)
- **Framer Motion** (Animations)
- **React Router DOM** (Navigation)
- **Axios** (API Requests)
- **Socket.io Client** (Real-time communication)
- **Chart.js** (Data visualization)

### Backend (Server)

- **Node.js & Express.js**
- **MongoDB Atlas** (Database)
- **Mongoose** (ODM)
- **JWT** (Authentication)
- **Razorpay** (Payments)
- **Socket.io** (WebSockets)

---

## 🏗 Authorization & Roles

The system uses three levels of authorization:

1. **Admin:** Full access to managing users and system settings.
2. **Doctor:** Can manage their own schedule and view their appointments.
3. **Patient:** Can search doctors and book/manage their own appointments.

---

## ⚙️ Installation & Setup Guide

### 1. Prerequisites

Ensure you have the following installed:

- [Node.js](https://nodejs.org/) (v14 or higher)
- [MongoDB](https://www.mongodb.com/) (Local or Atlas)
- [Git](https://git-scm.com/)

### 2. Clone the Repository

```bash
git clone <repository-url>
cd hospital-booking
```

### 3. Backend Setup (Server)

Navigate to the server directory and install dependencies:

```bash
cd server
npm install
```

#### Create Environment Variables

Create a `.env` file in the `server/` directory and add the following keys:

```env
# Server Configuration
PORT=5000

# Database Configuration
MONGO_URI=mongodb+srv://<your-username>:<your-password>@cluster0.mongodb.net/hospital-db?retryWrites=true&w=majority

# JWT Authentication
JWT_SECRET=your_super_secret_jwt_key_here

# Razorpay Payment Gateway (Get these from Razorpay Dashboard)
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
```

#### Run the Server

```bash
# Development mode (with nodemon)
npm run dev

# Production mode
npm start
```

_The server should now be running on `http://localhost:5000`_

### 4. Frontend Setup (Client)

Open a new terminal, navigate to the client directory, and install dependencies:

```bash
cd client
npm install
```

#### Create Environment Variables

Create a `.env` file in the `client/` directory and add the following keys:

```env
# Razorpay Key for Frontend
REACT_APP_RAZORPAY_KEY_ID=your_razorpay_key_id
```

_(Note: This key must match the Key ID used in the server .env)_

#### Run the Client

```bash
npm start
```

_The application should open automatically at `http://localhost:3000`_

---

## 📂 Folder Structure

### Backend (`/server`)

- `config/` - Database and 3rd party service configurations.
- `controllers/` - Logic for handling API requests.
- `models/` - Mongoose schemas (User, Appointment, Doctor).
- `routes/` - API endpoints definition.
- `middleware/` - Auth and error handling middleware.
- `utils/` - Helper functions (e.g., slot generator).

### Frontend (`/client`)

- `src/components/` - Reusable UI components.
- `src/pages/` - Main views (Login, Dashboard, Booking).
- `src/context/` - React Context APIs for state management.
- `src/hooks/` - Custom React hooks.

---

## 🧪 Seeding Data (Optional)

If you need to create initial dummy doctor data with slots, you can use the script provided in `server/scripts/`.

```bash
# From the server directory:
node scripts/seedDoctor.js
```

---

## 🤝 Contributing

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License.

## 👨‍💻 Author

Aditya Singh Rathaur  
MERN Stack Developer
