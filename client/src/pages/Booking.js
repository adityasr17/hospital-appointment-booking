import React, { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import axios from "axios";
import { io } from "socket.io-client";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { motion } from "framer-motion";

const socket = io("http://localhost:5000");

function Booking() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [slots, setSlots] = useState([]);
  const [lockedSlots, setLockedSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);

  const formattedDate = selectedDate.toISOString().split("T")[0];

  // 🔐 Protect Route
  useEffect(() => {
    if (!token) {
      navigate("/");
      return;
    }

    try {
      const decoded = jwtDecode(token);
      if (decoded.role !== "patient") {
        navigate("/");
      }
    } catch {
      localStorage.removeItem("token");
      navigate("/");
    }
  }, [token, navigate]);

  // 👨‍⚕️ Fetch Doctors
  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/auth/doctors");
      setDoctors(res.data);
    } catch (err) {
      console.error("Failed to fetch doctors");
    }
  };

  // 🔄 Fetch Slots when doctor/date changes
  useEffect(() => {
    if (selectedDoctor) {
      fetchSlots();
      setSelectedSlot(null);
      setLockedSlots([]);
    }
  }, [selectedDoctor, selectedDate]);

  const fetchSlots = async () => {
    try {
      const res = await axios.get(
        `http://localhost:5000/api/availability/${selectedDoctor}/${formattedDate}`
      );
      setSlots(res.data);
    } catch {
      setSlots([]);
    }
  };

  // 🔌 Socket listeners
  useEffect(() => {
    socket.on("slotLocked", ({ doctorId, date, slotTime }) => {
      if (doctorId === selectedDoctor && date === formattedDate) {
        setLockedSlots((prev) => [...prev, slotTime]);
      }
    });

    socket.on("slotReleased", ({ doctorId, date, slotTime }) => {
      if (doctorId === selectedDoctor && date === formattedDate) {
        setLockedSlots((prev) =>
          prev.filter((s) => s !== slotTime)
        );
      }
    });

    return () => {
      socket.off("slotLocked");
      socket.off("slotReleased");
    };
  }, [selectedDoctor, formattedDate]);

  const lockSlot = (slotTime) => {
    const decoded = jwtDecode(token);

    socket.emit("lockSlot", {
      doctorId: selectedDoctor,
      date: formattedDate,
      slotTime,
      userId: decoded.id,
    });

    setSelectedSlot(slotTime);
  };

  const bookSlot = async () => {
    if (!selectedSlot) return;

    await axios.post(
      "http://localhost:5000/api/availability/book",
      {
        doctorId: selectedDoctor,
        date: formattedDate,
        slotTime: selectedSlot,
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    fetchSlots();
    setSelectedSlot(null);
  };

  return (
    <>
      <Navbar />

      <div className="min-h-screen bg-gray-100 p-10 flex justify-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white shadow-xl rounded-2xl p-8 w-full max-w-4xl"
        >
          <h1 className="text-3xl font-bold text-center mb-6">
            🏥 Book Appointment
          </h1>

          {/* Doctor Dropdown */}
          <div className="mb-4">
            <label className="font-semibold">Select Doctor</label>
            <select
              value={selectedDoctor}
              onChange={(e) => setSelectedDoctor(e.target.value)}
              className="w-full border p-2 rounded mt-2"
            >
              <option value="">Choose a doctor</option>
              {doctors.map((doc) => (
                <option key={doc._id} value={doc._id}>
                  {doc.name}
                </option>
              ))}
            </select>
          </div>

          {/* Calendar */}
          <div className="mb-6">
            <label className="font-semibold">Select Date</label>
            <DatePicker
              selected={selectedDate}
              onChange={(date) => setSelectedDate(date)}
              minDate={new Date()}
              className="border p-2 rounded mt-2 w-full"
              dateFormat="yyyy-MM-dd"
            />
          </div>

          {/* Animated Slots */}
          <motion.div layout className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {slots.map((slot) => {
              const isLocked = lockedSlots.includes(slot.time);

              return (
                <motion.button
                  key={slot.time}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  disabled={isLocked}
                  onClick={() => lockSlot(slot.time)}
                  className={`py-2 rounded-xl font-semibold transition ${
                    isLocked
                      ? "bg-gray-400"
                      : "bg-green-500 hover:bg-green-600 text-white"
                  }`}
                >
                  {slot.time}
                </motion.button>
              );
            })}
          </motion.div>

          {selectedSlot && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-6 text-center"
            >
              <p className="mb-4 font-semibold">
                Selected Slot: {selectedSlot}
              </p>
              <button
                onClick={bookSlot}
                className="bg-blue-500 text-white px-6 py-2 rounded-xl"
              >
                Confirm Booking
              </button>
            </motion.div>
          )}
        </motion.div>
      </div>
    </>
  );
}

export default Booking;
