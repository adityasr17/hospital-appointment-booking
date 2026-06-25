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
  LineElement,
  PointElement,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";

import { Bar, Doughnut, Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  LineElement,
  PointElement,
  Tooltip,
  Legend,
  Filler
);

function Admin() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [activeTab, setActiveTab] = useState("dashboard");

  // Dashboard state
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [monthlyRevenue, setMonthlyRevenue] = useState([]);
  const [appointmentStats, setAppointmentStats] = useState([]);
  const [topDoctors, setTopDoctors] = useState([]);
  const [userGrowth, setUserGrowth] = useState([]);
  const [allAppointments, setAllAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  // Register Doctor form state
  const [doctorName, setDoctorName] = useState("");
  const [doctorEmail, setDoctorEmail] = useState("");
  const [doctorPassword, setDoctorPassword] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [consultationFee, setConsultationFee] = useState("");
  const [doctorMsg, setDoctorMsg] = useState({ type: "", text: "" });

  // Create Availability form state
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
      const headers = { Authorization: `Bearer ${token}` };

      const [revenueRes, monthlyRes, statsRes, topDocRes, growthRes, allApptRes] = await Promise.all([
        axios.get("http://localhost:5000/api/admin/total-revenue", { headers }),
        axios.get("http://localhost:5000/api/admin/monthly-revenue", { headers }),
        axios.get("http://localhost:5000/api/admin/payment-stats", { headers }),
        axios.get("http://localhost:5000/api/admin/top-doctors", { headers }),
        axios.get("http://localhost:5000/api/admin/user-growth", { headers }),
        axios.get("http://localhost:5000/api/admin/all-appointments", { headers }),
      ]);

      setTotalRevenue(revenueRes.data.totalRevenue || 0);
      setMonthlyRevenue(monthlyRes.data || []);
      setAppointmentStats(statsRes.data || []);
      setTopDoctors(topDocRes.data || []);
      setUserGrowth(growthRes.data || []);
      setAllAppointments(allApptRes.data || []);
    } catch (err) {
      console.error("Analytics fetch failed", err);
    }
  };

  const fetchDoctors = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/auth/doctors");
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
        "http://localhost:5000/api/admin/register-doctor",
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
        "http://localhost:5000/api/admin/create-availability",
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
    "", "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];

  // Monthly Revenue Chart Data
  const monthlyData = {
    labels: monthlyRevenue.map((item) => monthNames[item._id] || `M${item._id}`),
    datasets: [
      {
        label: "Revenue (₹)",
        data: monthlyRevenue.map((item) => item.totalRevenue),
        backgroundColor: "rgba(99, 102, 241, 0.8)",
        borderColor: "rgba(99, 102, 241, 1)",
        borderWidth: 2,
        borderRadius: 8,
        borderSkipped: false,
      },
    ],
  };

  // Appointment Status Doughnut
  const statusColors = {
    Paid: "#22c55e",
    Pending: "#f59e0b",
    Cancelled: "#ef4444",
  };

  const appointmentData = {
    labels: appointmentStats.map((item) => item._id),
    datasets: [
      {
        data: appointmentStats.map((item) => item.count),
        backgroundColor: appointmentStats.map((item) => statusColors[item._id] || "#8b5cf6"),
        borderWidth: 0,
        hoverOffset: 8,
      },
    ],
  };

  // Top Doctors Bar Chart
  const topDoctorsData = {
    labels: topDoctors.map((d) => d.doctorName || "Unknown"),
    datasets: [
      {
        label: "Appointments",
        data: topDoctors.map((d) => d.totalAppointments),
        backgroundColor: [
          "rgba(59, 130, 246, 0.8)",
          "rgba(16, 185, 129, 0.8)",
          "rgba(245, 158, 11, 0.8)",
          "rgba(239, 68, 68, 0.8)",
          "rgba(139, 92, 246, 0.8)",
        ],
        borderRadius: 8,
        borderSkipped: false,
      },
    ],
  };

  // User Growth Line Chart
  const userGrowthData = {
    labels: userGrowth.map((item) => `${monthNames[item._id.month]} ${item._id.year}`),
    datasets: [
      {
        label: "New Patients",
        data: userGrowth.map((item) => item.count),
        borderColor: "rgba(16, 185, 129, 1)",
        backgroundColor: "rgba(16, 185, 129, 0.1)",
        fill: true,
        tension: 0.4,
        pointBackgroundColor: "rgba(16, 185, 129, 1)",
        pointBorderColor: "#fff",
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7,
      },
    ],
  };

  // Filter appointments for table
  const filteredAppointments = allAppointments.filter((appt) => {
    const matchesSearch =
      searchTerm === "" ||
      (appt.patientId?.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (appt.doctorId?.name || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "All" || appt.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalBookings = appointmentStats.reduce((acc, curr) => acc + curr.count, 0);
  const totalDoctorsCount = doctors.length;

  const tabs = [
    { key: "dashboard", label: "📊 Analytics", icon: "📊" },
    { key: "appointments", label: "📋 Appointments", icon: "📋" },
    { key: "register-doctor", label: "👨‍⚕️ Register Doctor", icon: "👨‍⚕️" },
    { key: "create-availability", label: "📅 Availability", icon: "📅" },
  ];

  const inputClass =
    "w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition bg-gray-50 hover:bg-white";

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: "rgba(17, 24, 39, 0.9)",
        titleFont: { size: 13, weight: "bold" },
        bodyFont: { size: 12 },
        padding: 12,
        cornerRadius: 8,
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { size: 11, weight: "600" }, color: "#6b7280" },
      },
      y: {
        grid: { color: "rgba(243, 244, 246, 1)" },
        ticks: { font: { size: 11 }, color: "#9ca3af" },
        beginAtZero: true,
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "65%",
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          padding: 20,
          usePointStyle: true,
          pointStyleWidth: 10,
          font: { size: 12, weight: "600" },
        },
      },
    },
  };

  const lineOptions = {
    ...chartOptions,
    plugins: {
      ...chartOptions.plugins,
      legend: { display: false },
    },
  };

  const getStatusBadge = (status) => {
    const styles = {
      Booked: "bg-blue-50 text-blue-700 border-blue-200",
      Completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
      Cancelled: "bg-red-50 text-red-700 border-red-200",
      "No Show": "bg-amber-50 text-amber-700 border-amber-200",
    };
    return `px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${styles[status] || "bg-gray-100 text-gray-600 border-gray-200"}`;
  };

  const getPaymentBadge = (status) => {
    return status === "Paid"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : "bg-amber-50 text-amber-700 border-amber-200";
  };

  return (
    <>
      <Navbar />

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-indigo-50 p-6 pt-24">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <header className="mb-8">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white text-lg shadow-lg shadow-indigo-200">
                ⚡
              </div>
              <div>
                <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                  Admin Dashboard
                </h1>
                <p className="text-gray-500 text-sm mt-0.5">
                  Platform analytics, management & insights
                </p>
              </div>
            </div>
          </header>

          {/* Tab Navigation */}
          <div className="flex gap-1.5 mb-8 bg-white/60 backdrop-blur-sm p-1.5 rounded-2xl shadow-sm border border-gray-100 w-fit">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 ${
                  activeTab === tab.key
                    ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-200"
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* ==================== ANALYTICS TAB ==================== */}
          {activeTab === "dashboard" && (
            <>
              {/* KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300 group">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Revenue</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">
                        ₹{totalRevenue.toLocaleString()}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-emerald-500 rounded-xl flex items-center justify-center text-white text-xl shadow-lg shadow-emerald-100 group-hover:scale-110 transition-transform">
                      💰
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300 group">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Bookings</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">{totalBookings}</p>
                    </div>
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-500 rounded-xl flex items-center justify-center text-white text-xl shadow-lg shadow-blue-100 group-hover:scale-110 transition-transform">
                      📑
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300 group">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Registered Doctors</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">{totalDoctorsCount}</p>
                    </div>
                    <div className="w-12 h-12 bg-gradient-to-br from-violet-400 to-violet-500 rounded-xl flex items-center justify-center text-white text-xl shadow-lg shadow-violet-100 group-hover:scale-110 transition-transform">
                      🩺
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-5 shadow-lg shadow-indigo-200 text-white group hover:shadow-xl transition-shadow duration-300">
                  <h2 className="font-bold text-sm opacity-80">System Status</h2>
                  <div className="flex items-center gap-2 mt-3">
                    <span className="w-2.5 h-2.5 bg-green-300 rounded-full animate-pulse"></span>
                    <span className="font-semibold text-sm">All Systems Operational</span>
                  </div>
                </div>
              </div>

              {/* Charts Grid */}
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                {/* Monthly Revenue */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-2 mb-5">
                    <span className="w-2 h-6 bg-indigo-500 rounded-full"></span>
                    <h2 className="text-lg font-bold text-gray-800">Monthly Revenue</h2>
                  </div>
                  <div className="h-64">
                    {monthlyRevenue.length > 0 ? (
                      <Bar data={monthlyData} options={chartOptions} />
                    ) : (
                      <div className="h-full flex items-center justify-center text-gray-400">
                        <div className="text-center">
                          <span className="text-4xl block mb-2">📊</span>
                          <p className="text-sm">No revenue data yet</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Payment Status */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-2 mb-5">
                    <span className="w-2 h-6 bg-emerald-500 rounded-full"></span>
                    <h2 className="text-lg font-bold text-gray-800">Payment Distribution</h2>
                  </div>
                  <div className="h-64 flex justify-center">
                    {appointmentStats.length > 0 ? (
                      <Doughnut data={appointmentData} options={doughnutOptions} />
                    ) : (
                      <div className="h-full flex items-center justify-center text-gray-400">
                        <div className="text-center">
                          <span className="text-4xl block mb-2">🍩</span>
                          <p className="text-sm">No payment data yet</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Top Doctors */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-2 mb-5">
                    <span className="w-2 h-6 bg-blue-500 rounded-full"></span>
                    <h2 className="text-lg font-bold text-gray-800">Most Booked Doctors</h2>
                  </div>
                  <div className="h-64">
                    {topDoctors.length > 0 ? (
                      <Bar data={topDoctorsData} options={chartOptions} />
                    ) : (
                      <div className="h-full flex items-center justify-center text-gray-400">
                        <div className="text-center">
                          <span className="text-4xl block mb-2">👨‍⚕️</span>
                          <p className="text-sm">No booking data yet</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* User Growth */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-2 mb-5">
                    <span className="w-2 h-6 bg-teal-500 rounded-full"></span>
                    <h2 className="text-lg font-bold text-gray-800">Patient Growth</h2>
                  </div>
                  <div className="h-64">
                    {userGrowth.length > 0 ? (
                      <Line data={userGrowthData} options={lineOptions} />
                    ) : (
                      <div className="h-full flex items-center justify-center text-gray-400">
                        <div className="text-center">
                          <span className="text-4xl block mb-2">📈</span>
                          <p className="text-sm">No growth data yet</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ==================== APPOINTMENTS TAB ==================== */}
          {activeTab === "appointments" && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center gap-2 mb-4">
                  <span className="w-2 h-6 bg-indigo-500 rounded-full"></span>
                  <h2 className="text-lg font-bold text-gray-800">All Appointments</h2>
                  <span className="ml-2 text-xs font-semibold bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded-full">
                    {filteredAppointments.length} records
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
                    <input
                      type="text"
                      placeholder="Search by patient or doctor name..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-gray-50 text-sm"
                    />
                  </div>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-gray-50 text-sm font-medium"
                  >
                    <option value="All">All Status</option>
                    <option value="Booked">Booked</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                    <option value="No Show">No Show</option>
                  </select>
                </div>
              </div>

              {filteredAppointments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                  <span className="text-5xl mb-3">📭</span>
                  <p className="font-medium">No appointments found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-gray-50/80 text-gray-500 uppercase text-xs tracking-wider">
                        <th className="py-3.5 px-6 font-semibold">Patient</th>
                        <th className="py-3.5 px-6 font-semibold">Doctor</th>
                        <th className="py-3.5 px-6 font-semibold">Date</th>
                        <th className="py-3.5 px-6 font-semibold">Time</th>
                        <th className="py-3.5 px-6 font-semibold">Amount</th>
                        <th className="py-3.5 px-6 font-semibold">Status</th>
                        <th className="py-3.5 px-6 font-semibold">Payment</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm">
                      {filteredAppointments.map((appt) => (
                        <tr key={appt._id} className="border-b border-gray-50 hover:bg-gray-50/50 transition">
                          <td className="py-3.5 px-6">
                            <div className="font-semibold text-gray-800">{appt.patientId?.name || "N/A"}</div>
                            <div className="text-xs text-gray-400">{appt.patientId?.email || ""}</div>
                          </td>
                          <td className="py-3.5 px-6">
                            <div className="font-semibold text-gray-800">{appt.doctorId?.name || "N/A"}</div>
                            <div className="text-xs text-gray-400">{appt.doctorId?.specialization || ""}</div>
                          </td>
                          <td className="py-3.5 px-6 font-medium text-gray-700">{appt.date}</td>
                          <td className="py-3.5 px-6">
                            <span className="bg-indigo-50 text-indigo-700 py-1 px-2.5 rounded-lg font-semibold text-xs">
                              {appt.slotTime}
                            </span>
                          </td>
                          <td className="py-3.5 px-6 font-bold text-emerald-600">₹{appt.amount}</td>
                          <td className="py-3.5 px-6">
                            <span className={getStatusBadge(appt.status)}>{appt.status}</span>
                          </td>
                          <td className="py-3.5 px-6">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getPaymentBadge(appt.paymentStatus)}`}>
                              {appt.paymentStatus}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ==================== REGISTER DOCTOR TAB ==================== */}
          {activeTab === "register-doctor" && (
            <div className="bg-white shadow-sm rounded-2xl p-8 max-w-2xl mx-auto border border-gray-100">
              <div className="flex items-center gap-2 mb-6">
                <span className="w-2 h-6 bg-purple-500 rounded-full"></span>
                <h2 className="text-xl font-bold text-gray-800">Register New Doctor</h2>
              </div>

              {doctorMsg.text && (
                <div
                  className={`px-4 py-3 rounded-xl mb-5 text-sm font-medium ${
                    doctorMsg.type === "success"
                      ? "bg-emerald-50 border border-emerald-200 text-emerald-700"
                      : "bg-red-50 border border-red-200 text-red-700"
                  }`}
                >
                  {doctorMsg.text}
                </div>
              )}

              <form onSubmit={handleRegisterDoctor} className="space-y-4">
                <div>
                  <label className="block text-gray-600 text-sm font-semibold mb-1.5">
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
                  <label className="block text-gray-600 text-sm font-semibold mb-1.5">
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
                  <label className="block text-gray-600 text-sm font-semibold mb-1.5">
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
                  <label className="block text-gray-600 text-sm font-semibold mb-1.5">
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
                  <label className="block text-gray-600 text-sm font-semibold mb-1.5">
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
                  className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-indigo-200 hover:shadow-xl transition-all transform hover:-translate-y-0.5"
                >
                  Register Doctor
                </button>
              </form>
            </div>
          )}

          {/* ==================== CREATE AVAILABILITY TAB ==================== */}
          {activeTab === "create-availability" && (
            <div className="bg-white shadow-sm rounded-2xl p-8 max-w-2xl mx-auto border border-gray-100">
              <div className="flex items-center gap-2 mb-6">
                <span className="w-2 h-6 bg-blue-500 rounded-full"></span>
                <h2 className="text-xl font-bold text-gray-800">Create Doctor Availability</h2>
              </div>

              {availMsg.text && (
                <div
                  className={`px-4 py-3 rounded-xl mb-5 text-sm font-medium ${
                    availMsg.type === "success"
                      ? "bg-emerald-50 border border-emerald-200 text-emerald-700"
                      : "bg-red-50 border border-red-200 text-red-700"
                  }`}
                >
                  {availMsg.text}
                </div>
              )}

              <form onSubmit={handleCreateAvailability} className="space-y-4">
                <div>
                  <label className="block text-gray-600 text-sm font-semibold mb-1.5">
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
                  <label className="block text-gray-600 text-sm font-semibold mb-1.5">
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
                    <label className="block text-gray-600 text-sm font-semibold mb-1.5">
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
                    <label className="block text-gray-600 text-sm font-semibold mb-1.5">
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
                    <label className="block text-gray-600 text-sm font-semibold mb-1.5">
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
                    <label className="block text-gray-600 text-sm font-semibold mb-1.5">
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
                  className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-200 hover:shadow-xl transition-all transform hover:-translate-y-0.5"
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
