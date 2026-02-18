import React, { useEffect, useState } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";

import { Bar, Doughnut } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend
);

function Admin() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [activeTab, setActiveTab] = useState("dashboard");

  // Dashboard state
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [monthlyRevenue, setMonthlyRevenue] = useState([]);
  const [appointmentStats, setAppointmentStats] = useState([]);

  // Register Doctor form state
  const [doctorName, setDoctorName] = useState("");
  const [doctorEmail, setDoctorEmail] = useState("");
  const [doctorPassword, setDoctorPassword] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [consultationFee, setConsultationFee] = useState("");
  const [doctorMsg, setDoctorMsg] = useState({ type: "", text: "" });

  // Create Availability form state
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [availDate, setAvailDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [breakStart, setBreakStart] = useState("");
  const [breakEnd, setBreakEnd] = useState("");
  const [availMsg, setAvailMsg] = useState({ type: "", text: "" });

  useEffect(() => {
    if (!token) {
      navigate("/");
      return;
    }

    try {
      const decoded = jwtDecode(token);
      if (decoded.role !== "admin") {
        navigate("/");
      }
    } catch {
      localStorage.removeItem("token");
      navigate("/");
    }
  }, [token, navigate]);

  useEffect(() => {
    fetchAnalytics();
    fetchDoctors();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const revenueRes = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/admin/total-revenue`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const monthlyRes = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/admin/monthly-revenue`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const statsRes = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/admin/payment-stats`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setTotalRevenue(revenueRes.data.totalRevenue || 0);
      setMonthlyRevenue(monthlyRes.data || []);
      setAppointmentStats(statsRes.data || []);
    } catch (err) {
      console.error("Analytics fetch failed", err);
    }
  };

  const fetchDoctors = async () => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/auth/doctors`);
      setDoctors(res.data);
    } catch (err) {
      console.error("Failed to fetch doctors", err);
    }
  };

  const handleRegisterDoctor = async (e) => {
    e.preventDefault();
    setDoctorMsg({ type: "", text: "" });
    try {
      const res = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/admin/register-doctor`,
        {
          name: doctorName,
          email: doctorEmail,
          password: doctorPassword,
          specialization,
          consultationFee: Number(consultationFee),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setDoctorMsg({ type: "success", text: res.data.message });
      setDoctorName("");
      setDoctorEmail("");
      setDoctorPassword("");
      setSpecialization("");
      setConsultationFee("");
      fetchDoctors();
    } catch (err) {
      setDoctorMsg({
        type: "error",
        text: err.response?.data?.message || "Registration failed",
      });
    }
  };

  const handleCreateAvailability = async (e) => {
    e.preventDefault();
    setAvailMsg({ type: "", text: "" });
    try {
      const res = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/admin/create-availability`,
        {
          doctorId: selectedDoctor,
          date: availDate,
          startTime,
          endTime,
          breakStart: breakStart || undefined,
          breakEnd: breakEnd || undefined,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAvailMsg({ type: "success", text: res.data.message });
      setSelectedDoctor("");
      setAvailDate("");
      setStartTime("");
      setEndTime("");
      setBreakStart("");
      setBreakEnd("");
    } catch (err) {
      setAvailMsg({
        type: "error",
        text: err.response?.data?.message || "Failed to create availability",
      });
    }
  };

  const monthNames = [
    "", "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const monthlyData = {
    labels: monthlyRevenue.map((item) => monthNames[item._id] || `Month ${item._id}`),
    datasets: [
      {
        label: "Monthly Revenue",
        data: monthlyRevenue.map((item) => item.totalRevenue),
        backgroundColor: "#3b82f6",
      },
    ],
  };

  const appointmentData = {
    labels: appointmentStats.map((item) => item._id),
    datasets: [
      {
        data: appointmentStats.map((item) => item.count),
        backgroundColor: ["#22c55e", "#f59e0b", "#ef4444"],
      },
    ],
  };

  const tabs = [
    { key: "dashboard", label: "Dashboard" },
    { key: "register-doctor", label: "Register Doctor" },
    { key: "create-availability", label: "Create Availability" },
  ];

  const inputClass =
    "w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 transition";

  return (
    <>
      <Navbar />

      <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 p-8 pt-24">
        <div className="max-w-7xl mx-auto">
          <header className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-extrabold text-gray-800 tracking-tight">
                Admin Dashboard
              </h1>
              <p className="text-gray-500 mt-2">
                Platform analytics and management.
              </p>
            </div>
          </header>

          {/* Tab Navigation */}
          <div className="flex gap-2 mb-8">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-6 py-3 rounded-xl font-bold text-sm transition-all duration-200 ${
                  activeTab === tab.key
                    ? "bg-indigo-600 text-white shadow-lg"
                    : "bg-white text-gray-600 hover:bg-gray-50 shadow"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* ==================== DASHBOARD TAB ==================== */}
          {activeTab === "dashboard" && (
            <>
              {/* KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white shadow-xl rounded-2xl p-6 border-l-4 border-green-500 flex items-center justify-between transform hover:scale-105 transition-transform duration-300">
                  <div>
                    <h2 className="text-gray-500 font-bold uppercase tracking-wider text-xs">
                      Total Revenue
                    </h2>
                    <p className="text-3xl font-bold text-gray-800 mt-1">
                      ₹ {totalRevenue.toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-green-100 p-3 rounded-full text-2xl">
                    💰
                  </div>
                </div>

                <div className="bg-white shadow-xl rounded-2xl p-6 border-l-4 border-blue-500 flex items-center justify-between transform hover:scale-105 transition-transform duration-300">
                  <div>
                    <h2 className="text-gray-500 font-bold uppercase tracking-wider text-xs">
                      Total Bookings
                    </h2>
                    <p className="text-3xl font-bold text-gray-800 mt-1">
                      {appointmentStats.reduce(
                        (acc, curr) => acc + curr.count,
                        0
                      )}
                    </p>
                  </div>
                  <div className="bg-blue-100 p-3 rounded-full text-2xl">
                    📑
                  </div>
                </div>

                <div className="bg-indigo-600 shadow-xl rounded-2xl p-6 text-white flex flex-col justify-center transform hover:scale-105 transition-transform duration-300">
                  <h2 className="font-bold text-lg">System Status</h2>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></span>
                    <span className="font-medium">Operational</span>
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                {/* Monthly Revenue Chart */}
                <div className="bg-white shadow-xl rounded-2xl p-8 transform transition hover:shadow-2xl">
                  <h2 className="text-xl font-bold text-gray-800 mb-6 border-b pb-2">
                    Monthly Revenue Trend
                  </h2>
                  <div className="h-64">
                    <Bar
                      data={monthlyData}
                      options={{ maintainAspectRatio: false }}
                    />
                  </div>
                </div>

                {/* Appointment Status Chart */}
                <div className="bg-white shadow-xl rounded-2xl p-8 transform transition hover:shadow-2xl">
                  <h2 className="text-xl font-bold text-gray-800 mb-6 border-b pb-2">
                    Appointment Status Distribution
                  </h2>
                  <div className="h-64 flex justify-center">
                    <Doughnut
                      data={appointmentData}
                      options={{ maintainAspectRatio: false }}
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ==================== REGISTER DOCTOR TAB ==================== */}
          {activeTab === "register-doctor" && (
            <div className="bg-white shadow-xl rounded-2xl p-8 max-w-2xl mx-auto">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-4">
                Register New Doctor
              </h2>

              {doctorMsg.text && (
                <div
                  className={`px-4 py-3 rounded-lg mb-4 ${
                    doctorMsg.type === "success"
                      ? "bg-green-100 border border-green-400 text-green-700"
                      : "bg-red-100 border border-red-400 text-red-700"
                  }`}
                >
                  {doctorMsg.text}
                </div>
              )}

              <form onSubmit={handleRegisterDoctor} className="space-y-4">
                <div>
                  <label className="block text-gray-600 text-sm font-semibold mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={doctorName}
                    onChange={(e) => setDoctorName(e.target.value)}
                    placeholder="Dr. John Doe"
                    required
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="block text-gray-600 text-sm font-semibold mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={doctorEmail}
                    onChange={(e) => setDoctorEmail(e.target.value)}
                    placeholder="doctor@example.com"
                    required
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="block text-gray-600 text-sm font-semibold mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    value={doctorPassword}
                    onChange={(e) => setDoctorPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="block text-gray-600 text-sm font-semibold mb-1">
                    Specialization
                  </label>
                  <input
                    type="text"
                    value={specialization}
                    onChange={(e) => setSpecialization(e.target.value)}
                    placeholder="e.g. General Physician, Cardiologist"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="block text-gray-600 text-sm font-semibold mb-1">
                    Consultation Fee (₹)
                  </label>
                  <input
                    type="number"
                    value={consultationFee}
                    onChange={(e) => setConsultationFee(e.target.value)}
                    placeholder="500"
                    min="0"
                    className={inputClass}
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-bold py-3 rounded-lg shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1"
                >
                  Register Doctor
                </button>
              </form>
            </div>
          )}

          {/* ==================== CREATE AVAILABILITY TAB ==================== */}
          {activeTab === "create-availability" && (
            <div className="bg-white shadow-xl rounded-2xl p-8 max-w-2xl mx-auto">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-4">
                Create Doctor Availability
              </h2>

              {availMsg.text && (
                <div
                  className={`px-4 py-3 rounded-lg mb-4 ${
                    availMsg.type === "success"
                      ? "bg-green-100 border border-green-400 text-green-700"
                      : "bg-red-100 border border-red-400 text-red-700"
                  }`}
                >
                  {availMsg.text}
                </div>
              )}

              <form onSubmit={handleCreateAvailability} className="space-y-4">
                <div>
                  <label className="block text-gray-600 text-sm font-semibold mb-1">
                    Select Doctor
                  </label>
                  <select
                    value={selectedDoctor}
                    onChange={(e) => setSelectedDoctor(e.target.value)}
                    required
                    className={inputClass}
                  >
                    <option value="">Choose a doctor...</option>
                    {doctors.map((doc) => (
                      <option key={doc._id} value={doc._id}>
                        {doc.name}{" "}
                        {doc.specialization ? `(${doc.specialization})` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-gray-600 text-sm font-semibold mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    value={availDate}
                    onChange={(e) => setAvailDate(e.target.value)}
                    required
                    className={inputClass}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-600 text-sm font-semibold mb-1">
                      Start Time
                    </label>
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      required
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="block text-gray-600 text-sm font-semibold mb-1">
                      End Time
                    </label>
                    <input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      required
                      className={inputClass}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-600 text-sm font-semibold mb-1">
                      Break Start{" "}
                      <span className="text-gray-400 font-normal">
                        (optional)
                      </span>
                    </label>
                    <input
                      type="time"
                      value={breakStart}
                      onChange={(e) => setBreakStart(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="block text-gray-600 text-sm font-semibold mb-1">
                      Break End{" "}
                      <span className="text-gray-400 font-normal">
                        (optional)
                      </span>
                    </label>
                    <input
                      type="time"
                      value={breakEnd}
                      onChange={(e) => setBreakEnd(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-bold py-3 rounded-lg shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1"
                >
                  Create Availability
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default Admin;
