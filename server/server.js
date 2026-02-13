require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const { lockSlot, releaseSlot, getLock } = require("./utils/slotLocks");


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

io.on("connection", (socket) => {
  socket.on("lockSlot", ({ doctorId, date, slotTime, userId }) => {
    const key = `${doctorId}_${date}_${slotTime}`;

    if (getLock(key)) {
      socket.emit("lockFailed", { message: "Slot already locked" });
      return;
    }

    lockSlot(key, userId);

    io.emit("slotLocked", { doctorId, date, slotTime });

    socket.emit("lockSuccess", { message: "Slot locked for 2 minutes" });
  });
});



server.listen(PORT, () =>
  console.log(`Server running on port ${PORT}`)
);


app.use(cors());
app.use(express.json());

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/availability", require("./routes/availabilityRoutes"));
app.use("/api/payment", require("./routes/paymentRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));
app.use("/api/doctor", require("./routes/doctorRoutes"));




