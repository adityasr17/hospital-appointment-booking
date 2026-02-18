import React, { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import axios from "axios";
import { io } from "socket.io-client";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { motion } from "framer-motion";

const socket = io(process.env.REACT_APP_API_URL);

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
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/auth/doctors`);
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
        `${process.env.REACT_APP_API_URL}/api/availability/${selectedDoctor}/${formattedDate}`
      );
      setSlots(res.data);
    } catch (err) {
      console.error("Failed to fetch slots:", err.response?.data || err.message);
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

    let createdAppointmentId = null;

    try {
      // 1. Book the appointment (creates it with paymentStatus: "Pending")
      const bookingRes = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/availability/book`,
        {
          doctorId: selectedDoctor,
          date: formattedDate,
          slotTime: selectedSlot,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const { appointment } = bookingRes.data;
      createdAppointmentId = appointment._id;

      // 2. Create a Razorpay order
      const orderRes = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/payment/create-order`,
        {
          appointmentId: appointment._id,
          amount: appointment.amount,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const order = orderRes.data;

      // Helper to revert the booking if payment is not completed
      const revertBooking = async () => {
        try {
          await axios.post(
            `${process.env.REACT_APP_API_URL}/api/payment/revert`,
            { appointmentId: createdAppointmentId },
            { headers: { Authorization: `Bearer ${token}` } }
          );
        } catch (revertErr) {
          console.error("Failed to revert booking:", revertErr);
        }
        fetchSlots();
      };

      // 3. Open Razorpay checkout
      const options = {
        key: process.env.REACT_APP_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: "Hospital Booking",
        description: `Appointment on ${formattedDate} at ${selectedSlot}`,
        order_id: order.id,
        handler: async function (response) {
          try {
            // 4. Verify payment on backend
            await axios.post(
              `${process.env.REACT_APP_API_URL}/api/payment/verify`,
              {
                appointmentId: appointment._id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              },
              {
                headers: { Authorization: `Bearer ${token}` },
              }
            );

            alert("Payment successful! Appointment confirmed.");
            fetchSlots();
          } catch (err) {
            alert("Payment verification failed. Booking has been cancelled.");
            await revertBooking();
          }
        },
        prefill: {
          name: jwtDecode(token).name || "",
          email: jwtDecode(token).email || "",
        },
        theme: {
          color: "#2563EB",
        },
        modal: {
          ondismiss: async function () {
            alert("Payment was not completed. Booking has been cancelled.");
            await revertBooking();
          },
        },
      };

      const rzp = new window.Razorpay(options);

      rzp.on("payment.failed", async function () {
        alert("Payment failed. Booking has been cancelled.");
        await revertBooking();
      });

      rzp.open();

      setSelectedSlot(null);
    } catch (err) {
      // If booking was created but order creation failed, revert it
      if (createdAppointmentId) {
        try {
          await axios.post(
            `${process.env.REACT_APP_API_URL}/api/payment/revert`,
            { appointmentId: createdAppointmentId },
            { headers: { Authorization: `Bearer ${token}` } }
          );
        } catch (revertErr) {
          console.error("Failed to revert booking:", revertErr);
        }
        fetchSlots();
      }
      alert("Booking failed. Please try again.");
    }
  };

  return (
    <>
      <Navbar />

      <div className="min-h-screen bg-gradient-to-r from-blue-50 to-indigo-100 p-8 flex justify-center items-start pt-24">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="bg-white shadow-2xl rounded-3xl p-8 w-full max-w-5xl border border-gray-100"
        >
          <h1 className="text-4xl font-extrabold text-center mb-8 text-gray-800">
            🏥 Book Your Visit
          </h1>

          <div className="grid md:grid-cols-2 gap-8 mb-8">
            {/* Doctor Dropdown */}
            <div>
              <label className="block text-gray-700 font-bold mb-2">Select Doctor</label>
              <div className="relative">
                <select
                  value={selectedDoctor}
                  onChange={(e) => setSelectedDoctor(e.target.value)}
                  className="w-full appearance-none bg-gray-50 border border-gray-300 text-gray-700 py-3 px-4 pr-8 rounded-xl leading-tight focus:outline-none focus:bg-white focus:border-blue-500 transition shadow-sm"
                >
                  <option value="">Choose a specialist...</option>
                  {doctors.map((doc) => (
                    <option key={doc._id} value={doc._id}>
                      {doc.name} {doc.consultationFee ? `- ₹${doc.consultationFee}` : ""}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-700">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                </div>
              </div>
            </div>

            {/* Calendar */}
            <div>
              <label className="block text-gray-700 font-bold mb-2">Select Date</label>
              <div className="relative">
                <DatePicker
                  selected={selectedDate}
                  onChange={(date) => setSelectedDate(date)}
                  minDate={new Date()}
                  className="w-full bg-gray-50 border border-gray-300 text-gray-700 py-3 px-4 rounded-xl focus:outline-none focus:bg-white focus:border-blue-500 transition shadow-sm"
                  dateFormat="yyyy-MM-dd"
                  wrapperClassName="w-full"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 my-6"></div>

          {/* Animated Slots */}
          {!selectedDoctor ? (
            <div className="text-center text-gray-400 py-10">
              <span className="text-5xl block mb-2">👨‍⚕️</span>
              Select a doctor to view available slots
            </div>
          ) : slots.length === 0 ? (
            <div className="text-center text-gray-400 py-10">
               <span className="text-5xl block mb-2">📅</span>
               No slots available for this date.
            </div>
          ) : (
             <>
                <h3 className="text-lg font-semibold text-gray-700 mb-4">Available Slots</h3>
                <motion.div layout className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                  {slots.map((slot) => {
                    const isLocked = lockedSlots.includes(slot.time);
                    const isSelected = selectedSlot === slot.time;

                    return (
                      <motion.button
                        key={slot.time}
                        whileHover={!isLocked ? { scale: 1.05, translateY: -2 } : {}}
                        whileTap={!isLocked ? { scale: 0.95 } : {}}
                        disabled={isLocked}
                        onClick={() => lockSlot(slot.time)}
                        className={`py-3 px-2 rounded-xl font-bold text-sm shadow-sm transition-all duration-200 border-2 ${
                          isLocked
                            ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                            : isSelected
                            ? "bg-blue-600 text-white border-blue-600 ring-2 ring-blue-300 ring-offset-2"
                            : "bg-white text-gray-700 border-gray-200 hover:border-blue-400 hover:text-blue-600"
                        }`}
                      >
                        {slot.time}
                      </motion.button>
                    );
                  })}
                </motion.div>
             </>
          )}

          {selectedSlot && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-10 p-6 bg-blue-50 rounded-2xl border border-blue-100 flex flex-col md:flex-row items-center justify-between shadow-inner"
            >
              <div className="mb-4 md:mb-0 text-center md:text-left">
                <p className="text-gray-500 text-sm font-semibold uppercase tracking-wide">Selected Slot</p>
                <p className="text-2xl font-bold text-blue-800">
                  {selectedSlot} <span className="text-lg font-normal text-gray-600">on {formattedDate}</span>
                </p>
                {selectedDoctor && (() => {
                  const doc = doctors.find(d => d._id === selectedDoctor);
                  const fee = doc?.consultationFee || 500;
                  return (
                    <p className="text-sm text-gray-500 mt-1">
                      Consultation Fee: <span className="font-bold text-green-700">&#8377;{fee}</span>
                    </p>
                  );
                })()}
              </div>
              <button
                onClick={bookSlot}
                className="bg-green-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:bg-green-700 hover:shadow-xl transition-all transform hover:-translate-y-1 w-full md:w-auto"
              >
                Pay & Confirm Booking
              </button>
            </motion.div>
          )}
        </motion.div>
      </div>
    </>
  );
}

export default Booking;
