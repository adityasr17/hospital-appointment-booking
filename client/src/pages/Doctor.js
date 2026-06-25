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
  Tooltip,
  Legend,
} from "chart.js";

import { Bar } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

function Doctor() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [activeTab, setActiveTab] = useState("schedule");
  const [appointments, setAppointments] = useState([]);
  const [scheduleAppointments, setScheduleAppointments] = useState([]);
  const [revenue, setRevenue] = useState(0);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [statusFilter, setStatusFilter] = useState("All");
  const [loading, setLoading] = useState(false);

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

  useEffect(() => {
    if (selectedDate) {
      fetchSchedule(selectedDate);
    }
  }, [selectedDate]);

  const fetchAppointments = async () => {
    try {
      const res = await axios.get(
        "http://localhost:5000/api/doctor/appointments",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setAppointments(res.data);
    } catch (err) {
      console.error("Error fetching appointments", err);
    }
  };

  const fetchSchedule = async (date) => {
    setLoading(true);
    try {
      const res = await axios.get(
        `http://localhost:5000/api/doctor/schedule?date=${date}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setScheduleAppointments(res.data);
    } catch (err) {
      console.error("Error fetching schedule", err);
      setScheduleAppointments([]);
    }
    setLoading(false);
  };

  const fetchRevenue = async () => {
    try {
      const res = await axios.get(
        "http://localhost:5000/api/doctor/revenue",
        {
          headers: { Authorization: `Bearer ${token}` },
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
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchAppointments();
      fetchSchedule(selectedDate);
      fetchRevenue();
    } catch (err) {
      alert("Failed to update appointment");
    }
  };

  const markNoShow = async (appointmentId) => {
    try {
      await axios.post(
        "http://localhost:5000/api/doctor/no-show",
        { appointmentId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchAppointments();
      fetchSchedule(selectedDate);
    } catch (err) {
      alert("Failed to mark as No Show");
    }
  };

  // Filter appointments for All Appointments tab
  const filteredAppointments =
    statusFilter === "All"
      ? appointments
      : appointments.filter((a) => a.status === statusFilter);

  // Stats
  const completedCount = appointments.filter((a) => a.status === "Completed").length;
  const bookedCount = appointments.filter((a) => a.status === "Booked").length;
  const noShowCount = appointments.filter((a) => a.status === "No Show").length;

  // Monthly revenue data for chart (aggregate from appointments)
  const monthlyRevenueMap = {};
  const monthNames = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  appointments.forEach((appt) => {
    if (appt.paymentStatus === "Paid" && appt.createdAt) {
      const month = new Date(appt.createdAt).getMonth() + 1;
      monthlyRevenueMap[month] = (monthlyRevenueMap[month] || 0) + appt.amount;
    }
  });

  const sortedMonths = Object.keys(monthlyRevenueMap)
    .map(Number)
    .sort((a, b) => a - b);

  const revenueChartData = {
    labels: sortedMonths.map((m) => monthNames[m]),
    datasets: [
      {
        label: "Revenue (₹)",
        data: sortedMonths.map((m) => monthlyRevenueMap[m]),
        backgroundColor: "rgba(16, 185, 129, 0.8)",
        borderColor: "rgba(16, 185, 129, 1)",
        borderWidth: 2,
        borderRadius: 8,
        borderSkipped: false,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "rgba(17, 24, 39, 0.9)",
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

  const getStatusBadge = (status) => {
    const styles = {
      Booked: "bg-blue-50 text-blue-700 border-blue-200",
      Completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
      Cancelled: "bg-red-50 text-red-700 border-red-200",
      "No Show": "bg-amber-50 text-amber-700 border-amber-200",
    };
    return `px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${styles[status] || "bg-gray-100 text-gray-600 border-gray-200"}`;
  };

  const getStatusIcon = (status) => {
    const icons = { Booked: "🔵", Completed: "✅", Cancelled: "❌", "No Show": "⚠️" };
    return icons[status] || "⬜";
  };

  const tabs = [
    { key: "schedule", label: "📅 Today's Schedule" },
    { key: "appointments", label: "📋 All Appointments" },
    { key: "revenue", label: "💰 Revenue" },
  ];

  const formatDateDisplay = (dateStr) => {
    const date = new Date(dateStr + "T00:00:00");
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <>
      <Navbar />

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6 pt-24">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <header className="mb-8">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white text-lg shadow-lg shadow-blue-200">
                🩺
              </div>
              <div>
                <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                  Doctor's Dashboard
                </h1>
                <p className="text-gray-500 text-sm mt-0.5">
                  Manage your schedule, patients & earnings
                </p>
              </div>
            </div>
          </header>

          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow group">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Revenue</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">₹{revenue.toLocaleString()}</p>
                </div>
                <div className="w-11 h-11 bg-gradient-to-br from-emerald-400 to-emerald-500 rounded-xl flex items-center justify-center text-white text-lg shadow-lg shadow-emerald-100 group-hover:scale-110 transition-transform">
                  💰
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow group">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{appointments.length}</p>
                </div>
                <div className="w-11 h-11 bg-gradient-to-br from-blue-400 to-blue-500 rounded-xl flex items-center justify-center text-white text-lg shadow-lg shadow-blue-100 group-hover:scale-110 transition-transform">
                  📋
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow group">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Completed</p>
                  <p className="text-2xl font-bold text-emerald-600 mt-1">{completedCount}</p>
                </div>
                <div className="w-11 h-11 bg-gradient-to-br from-teal-400 to-teal-500 rounded-xl flex items-center justify-center text-white text-lg shadow-lg shadow-teal-100 group-hover:scale-110 transition-transform">
                  ✅
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow group">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Upcoming</p>
                  <p className="text-2xl font-bold text-blue-600 mt-1">{bookedCount}</p>
                </div>
                <div className="w-11 h-11 bg-gradient-to-br from-indigo-400 to-indigo-500 rounded-xl flex items-center justify-center text-white text-lg shadow-lg shadow-indigo-100 group-hover:scale-110 transition-transform">
                  🔔
                </div>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-1.5 mb-8 bg-white/60 backdrop-blur-sm p-1.5 rounded-2xl shadow-sm border border-gray-100 w-fit">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 ${
                  activeTab === tab.key
                    ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg shadow-blue-200"
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* ==================== TODAY'S SCHEDULE TAB ==================== */}
          {activeTab === "schedule" && (
            <div>
              {/* Date Selector */}
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className="flex items-center gap-3">
                    <span className="w-2 h-6 bg-blue-500 rounded-full"></span>
                    <h2 className="text-lg font-bold text-gray-800">Schedule for</h2>
                  </div>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300 bg-gray-50 text-sm font-medium"
                  />
                  <span className="text-gray-500 text-sm font-medium">
                    {formatDateDisplay(selectedDate)}
                  </span>
                </div>
              </div>

              {/* Schedule Cards */}
              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : scheduleAppointments.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 py-16 flex flex-col items-center text-gray-400">
                  <span className="text-5xl mb-3">📭</span>
                  <p className="font-semibold text-lg">No appointments for this date</p>
                  <p className="text-sm mt-1">Select a different date or check your availability settings</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {scheduleAppointments.map((appt) => (
                    <div
                      key={appt._id}
                      className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-all duration-200"
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        {/* Time & Status */}
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl flex flex-col items-center justify-center border border-blue-100">
                            <span className="text-xs font-bold text-blue-600 uppercase">
                              {appt.slotTime}
                            </span>
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-gray-800 text-lg">
                                {appt.patientId?.name || "Unknown Patient"}
                              </h3>
                              <span className={getStatusBadge(appt.status)}>
                                {appt.status}
                              </span>
                            </div>
                            <p className="text-gray-400 text-sm mt-0.5">
                              📧 {appt.patientId?.email || "N/A"}
                            </p>
                            <div className="flex items-center gap-4 mt-1.5">
                              <span className="text-sm font-semibold text-emerald-600">
                                ₹{appt.amount}
                              </span>
                              <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                                appt.paymentStatus === "Paid"
                                  ? "bg-emerald-50 text-emerald-600"
                                  : "bg-amber-50 text-amber-600"
                              }`}>
                                {appt.paymentStatus}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        {appt.status === "Booked" && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => markCompleted(appt._id)}
                              className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl text-sm font-semibold shadow-md shadow-emerald-100 hover:shadow-lg transition-all transform hover:-translate-y-0.5"
                            >
                              ✓ Completed
                            </button>
                            <button
                              onClick={() => markNoShow(appt._id)}
                              className="px-5 py-2.5 bg-gradient-to-r from-amber-400 to-orange-400 text-white rounded-xl text-sm font-semibold shadow-md shadow-amber-100 hover:shadow-lg transition-all transform hover:-translate-y-0.5"
                            >
                              ✗ No Show
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ==================== ALL APPOINTMENTS TAB ==================== */}
          {activeTab === "appointments" && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-6 bg-indigo-500 rounded-full"></span>
                    <h2 className="text-lg font-bold text-gray-800">All Appointments</h2>
                    <span className="ml-2 text-xs font-semibold bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded-full">
                      {filteredAppointments.length}
                    </span>
                  </div>

                  <div className="flex gap-1.5 bg-gray-50 p-1 rounded-xl">
                    {["All", "Booked", "Completed", "No Show", "Cancelled"].map((s) => (
                      <button
                        key={s}
                        onClick={() => setStatusFilter(s)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                          statusFilter === s
                            ? "bg-white text-gray-800 shadow-sm"
                            : "text-gray-500 hover:text-gray-700"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
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
                        <th className="py-3.5 px-6 font-semibold">Date</th>
                        <th className="py-3.5 px-6 font-semibold">Time</th>
                        <th className="py-3.5 px-6 font-semibold">Amount</th>
                        <th className="py-3.5 px-6 font-semibold">Status</th>
                        <th className="py-3.5 px-6 font-semibold">Payment</th>
                        <th className="py-3.5 px-6 font-semibold text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm">
                      {filteredAppointments.map((appt) => (
                        <tr
                          key={appt._id}
                          className="border-b border-gray-50 hover:bg-gray-50/50 transition"
                        >
                          <td className="py-3.5 px-6 font-medium text-gray-700">
                            {appt.date}
                          </td>
                          <td className="py-3.5 px-6">
                            <span className="bg-blue-50 text-blue-700 py-1 px-2.5 rounded-lg font-semibold text-xs">
                              {appt.slotTime}
                            </span>
                          </td>
                          <td className="py-3.5 px-6 font-bold text-emerald-600">
                            ₹{appt.amount}
                          </td>
                          <td className="py-3.5 px-6">
                            <span className={getStatusBadge(appt.status)}>
                              {appt.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-6">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-bold border ${
                                appt.paymentStatus === "Paid"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : "bg-amber-50 text-amber-700 border-amber-200"
                              }`}
                            >
                              {appt.paymentStatus}
                            </span>
                          </td>
                          <td className="py-3.5 px-6 text-center">
                            {appt.status === "Booked" && (
                              <div className="flex gap-2 justify-center">
                                <button
                                  onClick={() => markCompleted(appt._id)}
                                  className="bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-emerald-600 shadow-sm transition"
                                >
                                  ✓ Complete
                                </button>
                                <button
                                  onClick={() => markNoShow(appt._id)}
                                  className="bg-amber-400 text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-amber-500 shadow-sm transition"
                                >
                                  ✗ No Show
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ==================== REVENUE TAB ==================== */}
          {activeTab === "revenue" && (
            <div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 group hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Earnings</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">₹{revenue.toLocaleString()}</p>
                    </div>
                    <div className="w-14 h-14 bg-gradient-to-br from-emerald-400 to-emerald-500 rounded-2xl flex items-center justify-center text-white text-2xl shadow-lg shadow-emerald-100 group-hover:scale-110 transition-transform">
                      💰
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 group hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Avg per Appointment</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">
                        ₹{completedCount > 0 ? Math.round(revenue / completedCount).toLocaleString() : 0}
                      </p>
                    </div>
                    <div className="w-14 h-14 bg-gradient-to-br from-indigo-400 to-indigo-500 rounded-2xl flex items-center justify-center text-white text-2xl shadow-lg shadow-indigo-100 group-hover:scale-110 transition-transform">
                      📊
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 group hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">No Shows</p>
                      <p className="text-3xl font-bold text-amber-600 mt-2">{noShowCount}</p>
                    </div>
                    <div className="w-14 h-14 bg-gradient-to-br from-amber-400 to-amber-500 rounded-2xl flex items-center justify-center text-white text-2xl shadow-lg shadow-amber-100 group-hover:scale-110 transition-transform">
                      ⚠️
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2 mb-5">
                  <span className="w-2 h-6 bg-emerald-500 rounded-full"></span>
                  <h2 className="text-lg font-bold text-gray-800">Monthly Revenue</h2>
                </div>
                <div className="h-72">
                  {sortedMonths.length > 0 ? (
                    <Bar data={revenueChartData} options={chartOptions} />
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
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default Doctor;
