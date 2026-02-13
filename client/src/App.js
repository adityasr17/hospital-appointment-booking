import React, { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import axios from "axios";
import { io } from "socket.io-client";

const socket = io("http://localhost:5000");

function App() {
  const doctorId = "698dce150270c6adc43ae5da";
  const date = "2026-02-16";

  const [slots, setSlots] = useState([]);
  const [lockedSlots, setLockedSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);

  const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5OGRkMWMxYzc2MzZiNjIzMmRkNThkYSIsInJvbGUiOiJwYXRpZW50IiwiaWF0IjoxNzcwOTk4MjkyLCJleHAiOjE3NzEwODQ2OTJ9.grZeDUIMdFR4Rbk9eCkbo0zwW40KgWS8jeQj8CQAQUY";

  useEffect(() => {
    fetchSlots();

    socket.on("slotLocked", ({ doctorId: d, date: dt, slotTime }) => {
      if (d === doctorId && dt === date) {
        setLockedSlots((prev) => [...prev, slotTime]);
      }
    });

    socket.on("slotReleased", ({ doctorId: d, date: dt, slotTime }) => {
      if (d === doctorId && dt === date) {
        setLockedSlots((prev) => prev.filter((s) => s !== slotTime));
      }
    });

    return () => {
      socket.off("slotLocked");
      socket.off("slotReleased");
    };
  }, []);

  const fetchSlots = async () => {
    const res = await axios.get(
      `http://localhost:5000/api/availability/${doctorId}/${date}`
    );
    setSlots(res.data);
  };

  const lockSlot = (slotTime) => {
  const decoded = jwtDecode(token);

  socket.emit("lockSlot", {
    doctorId,
    date,
    slotTime,
    userId: decoded.id
  });

  setSelectedSlot(slotTime);
  };



  const bookSlot = async () => {
    if (!selectedSlot) return;

    try {
      await axios.post(
        "http://localhost:5000/api/availability/book",
        {
          doctorId,
          date,
          slotTime: selectedSlot
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      alert("Appointment booked!");
      fetchSlots();
      setSelectedSlot(null);

    } catch (error) {
      alert(error.response?.data?.message || "Booking failed");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center p-10">
      <div className="bg-white shadow-xl rounded-2xl p-8 w-full max-w-3xl">
        <h1 className="text-3xl font-bold text-center mb-6">
          🏥 Doctor Appointment Booking
        </h1>

        <h2 className="text-lg text-gray-600 mb-4 text-center">
          Select a Time Slot
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {slots.map((slot) => {
            const isLocked = lockedSlots.includes(slot.time);

            return (
              <button
                key={slot.time}
                onClick={() => lockSlot(slot.time)}
                disabled={isLocked}
                className={`py-2 rounded-xl font-semibold transition-all duration-200 ${
                  isLocked
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-green-500 hover:bg-green-600 text-white"
                }`}
              >
                {slot.time}
                {isLocked && " 🔒"}
              </button>
            );
          })}
        </div>

        {selectedSlot && (
          <div className="mt-6 text-center">
            <p className="text-lg mb-4">
              Selected Slot: <span className="font-bold">{selectedSlot}</span>
            </p>

            <button
              onClick={bookSlot}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-xl font-semibold"
            >
              Confirm Booking
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
