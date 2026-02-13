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
        "http://localhost:5000/api/doctor/appointments",
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
        "http://localhost:5000/api/doctor/revenue",
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
        "http://localhost:5000/api/doctor/complete",
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

      <div className="min-h-screen bg-gray-100 p-10">
        <div className="max-w-5xl mx-auto">

          <h1 className="text-3xl font-bold mb-6">
            👨‍⚕️ Doctor Dashboard
          </h1>

          {/* Revenue Card */}
          <div className="bg-white shadow-lg rounded-2xl p-6 mb-8">
            <h2 className="text-xl font-semibold mb-2">Total Revenue</h2>
            <p className="text-3xl font-bold text-green-600">
              ₹ {revenue}
            </p>
          </div>

          {/* Appointments */}
          <div className="bg-white shadow-lg rounded-2xl p-6">
            <h2 className="text-xl font-semibold mb-4">
              Appointments
            </h2>

            {appointments.length === 0 ? (
              <p className="text-gray-500">
                No appointments found.
              </p>
            ) : (
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Date</th>
                    <th className="text-left py-2">Time</th>
                    <th className="text-left py-2">Amount</th>
                    <th className="text-left py-2">Status</th>
                    <th className="text-left py-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.map((appt) => (
                    <tr key={appt._id} className="border-b">
                      <td className="py-2">{appt.date}</td>
                      <td className="py-2">{appt.slotTime}</td>
                      <td className="py-2">₹ {appt.amount}</td>
                      <td className="py-2">{appt.status}</td>
                      <td className="py-2">
                        {appt.status !== "Completed" && (
                          <button
                            onClick={() => markCompleted(appt._id)}
                            className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                          >
                            Mark Completed
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

        </div>
      </div>
    </>
  );
}

export default Doctor;
