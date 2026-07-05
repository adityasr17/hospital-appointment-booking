require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const { lockSlot, releaseSlot, getLock, setIO } = require("./utils/slotLocks");


connectDB();

const PORT = process.env.PORT || 5000;
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

app.set("io", io);
setIO(io);

io.on("connection", (socket) => {
  socket.on("lockSlot", ({ doctorId, date, slotTime, userId }) => {
    const key = `${doctorId}_${date}_${slotTime}`;

    if (getLock(key)) {
      socket.emit("lockFailed", { message: "Slot already locked" });
      return;
    }

    const locked = lockSlot(key, userId);

    if (!locked) {
      socket.emit("lockFailed", { message: "Slot already locked" });
      return;
    }

    io.emit("slotLocked", { doctorId, date, slotTime });

    socket.emit("lockSuccess", { message: "Slot locked for 2 minutes" });
  });
});



app.use(cors());
app.use(express.json());

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/availability", require("./routes/availabilityRoutes"));
app.use("/api/payment", require("./routes/paymentRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));
app.use("/api/doctor", require("./routes/doctorRoutes"));
app.use("/api/patient", require("./routes/patientRoutes"));

// Global error-handling middleware (must be last)
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err.stack || err.message);
  res.status(err.status || 500).json({
    message: err.message || "Internal Server Error",
  });
});

server.listen(PORT, () =>
  console.log(`Server running on port ${PORT}`)
);




