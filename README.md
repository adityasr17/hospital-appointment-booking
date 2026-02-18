# 🏥 MedBook — Hospital Appointment Booking System

A full-stack Hospital Appointment Booking System built with the **MERN stack** (MongoDB, Express.js, React, Node.js). Patients can browse doctors, book time-slots in real time, and pay online. Doctors manage their schedules, and admins oversee the entire platform through an analytics dashboard.

Key technical highlights include **real-time slot locking** via Socket.io, **atomic booking** with MongoDB, **Razorpay payment integration** with automatic booking revert on failure, and **role-based access control** (Patient / Doctor / Admin).

---

## ✨ Features

### Patient

- Browse doctors by specialization and consultation fee.
- Pick a date, view available slots in real time, and lock a slot while completing payment.
- Pay securely via Razorpay — booking is **automatically reverted** if payment fails or is dismissed.
- Cancel upcoming appointments (slot is freed).

### Doctor

- View all upcoming and past appointments.
- Mark appointments as completed.
- Track personal revenue.
- Set working hours and break times; the system auto-generates 15-min slots.

### Admin

- **Dashboard** — total revenue, monthly revenue bar chart, paid/pending doughnut chart, top doctor.
- **Register Doctor** — create doctor accounts with specialization and consultation fee.
- **Create Availability** — set schedule for any doctor (date, hours, break).

### Technical

| Concern        | Implementation                                                         |
| -------------- | ---------------------------------------------------------------------- |
| Authentication | JWT Bearer tokens, role-based middleware (`protect`, `authorize`)      |
| Real-time      | Socket.io — slot lock/release events broadcast to all clients          |
| Payments       | Razorpay order → checkout → verify; auto-revert on failure             |
| Atomic booking | MongoDB `findOneAndUpdate` with `$elemMatch` to prevent double-booking |
| Charts         | Chart.js (Bar + Doughnut) in the admin dashboard                       |
| Animations     | Framer Motion throughout the UI                                        |

---

## 🛠 Tech Stack

### Frontend

- **React 19** + React Router DOM v7
- **Tailwind CSS** — utility-first styling
- **Framer Motion** — page and slot animations
- **Axios** — HTTP client
- **Socket.io Client** — real-time slot locking
- **Chart.js / react-chartjs-2** — admin analytics charts
- **react-datepicker** — date selection
- **jwt-decode** — client-side token inspection

### Backend

- **Node.js** + **Express 5**
- **MongoDB** (Atlas or local) via **Mongoose 9**
- **JSON Web Tokens** (jsonwebtoken)
- **Razorpay SDK** — payment orders and verification
- **Socket.io** — WebSocket server
- **bcryptjs** — password hashing
- **dotenv** — environment config
- **nodemon** — dev auto-restart

---

## 📂 Project Structure

```
hospital-booking/
├── client/                     # React frontend
│   ├── public/
│   └── src/
│       ├── components/
│       │   └── Navbar.js       # Shared nav with role-aware routing
│       ├── pages/
│       │   ├── Login.js        # Patient / Doctor / Admin login
│       │   ├── Register.js     # Patient registration
│       │   ├── Booking.js      # Slot selection, locking & payment
│       │   ├── Doctor.js       # Doctor dashboard
│       │   └── Admin.js        # Admin dashboard (tabs)
│       ├── App.js              # Route definitions
│       └── index.js
│
├── server/                     # Express backend
│   ├── config/
│   │   ├── db.js               # MongoDB connection
│   │   └── razorpay.js         # Razorpay instance
│   ├── controllers/
│   │   ├── authController.js   # Register / Login / List doctors
│   │   ├── availabilityController.js  # Slots CRUD, book, cancel
│   │   ├── paymentController.js       # Create order, verify, revert
│   │   ├── adminController.js  # Revenue, stats, register doctor
│   │   └── doctorController.js # Appointments, revenue, complete
│   ├── middleware/
│   │   └── authMiddleware.js   # protect & authorize
│   ├── models/
│   │   ├── User.js             # name, email, password, role, specialization, fee
│   │   ├── Appointment.js      # patient, doctor, date, slot, amount, status, paymentStatus
│   │   └── Availability.js     # doctor, date, slots[{time, isBooked}]
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── availabilityRoutes.js
│   │   ├── paymentRoutes.js
│   │   ├── adminRoutes.js
│   │   └── doctorRoutes.js
│   ├── scripts/
│   │   ├── seedDoctor.js       # Seed sample doctor data
│   │   └── cleanDoctors.js
│   ├── utils/
│   │   ├── slotGenerator.js    # Generate time slots from hours/breaks
│   │   └── slotLocks.js        # In-memory slot lock store
│   └── server.js               # App entry — Express + Socket.io
│
└── package.json
```

---

## 🔌 API Reference

### Auth — `/api/auth`

| Method | Endpoint    | Access | Description            |
| ------ | ----------- | ------ | ---------------------- |
| POST   | `/register` | Public | Register a new patient |
| POST   | `/login`    | Public | Login (returns JWT)    |
| GET    | `/doctors`  | Public | List all doctors       |

### Availability — `/api/availability`

| Method | Endpoint           | Access  | Description                               |
| ------ | ------------------ | ------- | ----------------------------------------- |
| POST   | `/`                | Doctor  | Create availability (date, hours, breaks) |
| GET    | `/:doctorId/:date` | Public  | Get available slots                       |
| POST   | `/book`            | Patient | Book a slot                               |
| POST   | `/cancel`          | Patient | Cancel an appointment                     |

### Payment — `/api/payment`

| Method | Endpoint        | Access | Description                       |
| ------ | --------------- | ------ | --------------------------------- |
| POST   | `/create-order` | Auth   | Create a Razorpay order           |
| POST   | `/verify`       | Auth   | Mark payment as Paid              |
| POST   | `/revert`       | Auth   | Revert booking on payment failure |

### Admin — `/api/admin`

| Method | Endpoint               | Access | Description                  |
| ------ | ---------------------- | ------ | ---------------------------- |
| GET    | `/total-revenue`       | Admin  | Sum of all paid appointments |
| GET    | `/payment-stats`       | Admin  | Paid vs Pending counts       |
| GET    | `/monthly-revenue`     | Admin  | Revenue grouped by month     |
| GET    | `/top-doctor`          | Admin  | Most booked doctor           |
| POST   | `/register-doctor`     | Admin  | Create a doctor account      |
| POST   | `/create-availability` | Admin  | Create slots for a doctor    |

### Doctor — `/api/doctor`

| Method | Endpoint        | Access | Description                   |
| ------ | --------------- | ------ | ----------------------------- |
| GET    | `/appointments` | Doctor | List doctor's appointments    |
| GET    | `/revenue`      | Doctor | Doctor's total revenue        |
| POST   | `/complete`     | Doctor | Mark appointment as completed |

---

## ⚙️ Setup & Installation

### Prerequisites

- [Node.js](https://nodejs.org/) v16+
- [MongoDB](https://www.mongodb.com/) (local or Atlas)
- [Razorpay account](https://razorpay.com/) (for payment keys)

### 1. Clone the repository

```bash
git clone <repository-url>
cd hospital-booking
```

### 2. Server

```bash
cd server
npm install
```

Create **`server/.env`**:

```env
PORT=5000
MONGO_URI=mongodb+srv://<user>:<password>@cluster0.mongodb.net/hospital-db?retryWrites=true&w=majority
JWT_SECRET=your_jwt_secret
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
```

```bash
npm run dev          # development (nodemon)
# or
npm start            # production
```

Server runs at **http://localhost:5000**.

### 3. Client

```bash
cd client
npm install
```

Create **`client/.env`**:

```env
REACT_APP_RAZORPAY_KEY_ID=your_razorpay_key_id
```

```bash
npm start
```

App opens at **http://localhost:3000**.

### 4. Seed data (optional)

```bash
cd server
node scripts/seedDoctor.js
```

---

## 🔐 Roles & Authorization

| Role        | Default route | Capabilities                                           |
| ----------- | ------------- | ------------------------------------------------------ |
| **Patient** | `/booking`    | Book / cancel appointments, pay online                 |
| **Doctor**  | `/doctor`     | View appointments, mark complete, track revenue        |
| **Admin**   | `/admin`      | Full platform management, analytics, doctor onboarding |

---

## 💳 Payment Flow

```
Patient selects slot
  → Slot locked (Socket.io)
  → Appointment created (status: Pending)
  → Razorpay order created
  → Razorpay checkout opens
      ├─ Payment succeeds → /verify → paymentStatus: Paid ✅
      ├─ Payment fails    → /revert → appointment deleted, slot freed 🔄
      └─ Modal dismissed  → /revert → appointment deleted, slot freed 🔄
```

---

## 🤝 Contributing

1. Fork the project
2. Create your feature branch (`git checkout -b feature/YourFeature`)
3. Commit your changes (`git commit -m 'Add YourFeature'`)
4. Push to the branch (`git push origin feature/YourFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License.

## 👨‍💻 Author

**Aditya Singh Rathaur**
MERN Stack Developer
