import React, { useEffect, useState } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";

function Doctor() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [appointments, setAppointments] = useState([]);
  const [revenue, setRevenue] = useState(0);

  // 🔐 Protect route (doctor only)
  useEffect(() => {
    if (!token) {
      navigate("/");
      return;
    }

    try {
      const decoded = jwtDecode(token);

      if (decoded.role !== "doctor") {
        navigate("/");
      }
    } catch {
      localStorage.removeItem("token");
      navigate("/");
    }
  }, [token, navigate]);

  useEffect(() => {
    fetchAppointments();
    fetchRevenue();
  }, []);

  const fetchAppointments = async () => {
    try {
      const res = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/doctor/appointments`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setAppointments(res.data);
    } catch (err) {
      console.error("Error fetching appointments", err);
    }
  };

  const fetchRevenue = async () => {
    try {
      const res = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/doctor/revenue`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setRevenue(res.data.totalRevenue || 0);
    } catch (err) {
      console.error("Error fetching revenue", err);
    }
  };

  const markCompleted = async (appointmentId) => {
    try {
      await axios.post(
        `${process.env.REACT_APP_API_URL}/api/doctor/complete`,
        { appointmentId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      fetchAppointments();
    } catch (err) {
      alert("Failed to update appointment");
    }
  };

  return (
    <>
      <Navbar />

      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 p-8 pt-24">
        <div className="max-w-7xl mx-auto">
          <header className="mb-10 flex flex-col md:flex-row items-center justify-between">
            <div>
              <h1 className="text-4xl font-extrabold text-gray-800 tracking-tight">
                Doctor's Dashboard 🩺
              </h1>
              <p className="text-gray-500 mt-2">Overview of your appointments and earnings.</p>
            </div>
          </header>

          {/* Revenue Card */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
            <div className="bg-white shadow-xl rounded-2xl p-6 border-l-4 border-emerald-500 transform hover:scale-105 transition-transform duration-300 flex items-center justify-between">
              <div>
                <h2 className="text-gray-500 font-bold uppercase tracking-wider text-xs">Total Revenue</h2>
                <p className="text-4xl font-bold text-gray-800 mt-2">
                  ₹ {revenue.toLocaleString()}
                </p>
              </div>
              <div className="bg-emerald-100 p-4 rounded-full text-3xl">
                💰
              </div>
            </div>

             <div className="bg-white shadow-xl rounded-2xl p-6 border-l-4 border-blue-500 transform hover:scale-105 transition-transform duration-300 flex items-center justify-between">
              <div>
                <h2 className="text-gray-500 font-bold uppercase tracking-wider text-xs">Total Appointments</h2>
                <p className="text-4xl font-bold text-gray-800 mt-2">
                  {appointments.length}
                </p>
              </div>
              <div className="bg-blue-100 p-4 rounded-full text-3xl">
                📅
              </div>
            </div>
          </div>

          {/* Appointments */}
          <div className="bg-white shadow-2xl rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-4">
              Scheduled Appointments
            </h2>

            {appointments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                <span className="text-6xl mb-4">📭</span>
                <p className="text-lg font-medium">No appointments scheduled.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-100 text-gray-600 uppercase text-xs tracking-wider">
                      <th className="py-4 px-6 font-bold rounded-tl-lg">Date</th>
                      <th className="py-4 px-6 font-bold">Time</th>
                      <th className="py-4 px-6 font-bold">Amount</th>
                      <th className="py-4 px-6 font-bold">Status</th>
                      <th className="py-4 px-6 font-bold rounded-tr-lg text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-700 text-sm">
                    {appointments.map((appt) => (
                      <tr key={appt._id} className="border-b border-gray-100 hover:bg-gray-50 transition duration-150">
                        <td className="py-4 px-6 font-medium">{appt.date}</td>
                        <td className="py-4 px-6">
                            <span className="bg-blue-100 text-blue-800 py-1 px-3 rounded-full font-bold shadow-sm">
                                {appt.slotTime}
                            </span>
                        </td>
                        <td className="py-4 px-6 font-bold text-emerald-600">₹ {appt.amount}</td>
                        <td className="py-4 px-6">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${
                              appt.status === "Completed"
                                ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                                : "bg-yellow-100 text-yellow-700 border-yellow-200"
                            }`}
                          >
                            {appt.status}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-center">
                          {appt.status !== "Completed" && (
                            <button
                              onClick={() => markCompleted(appt._id)}
                              className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-xs font-semibold hover:bg-indigo-700 shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5"
                            >
                              ✓ Mark Completed
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default Doctor;
