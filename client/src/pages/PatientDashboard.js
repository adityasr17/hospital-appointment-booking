import React, { useEffect, useState } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";

function PatientDashboard() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [activeTab, setActiveTab] = useState("upcoming");
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [pastAppointments, setPastAppointments] = useState([]);
  const [loading, setLoading] = useState(false);

  // Reschedule modal state
  const [showReschedule, setShowReschedule] = useState(false);
  const [rescheduleAppt, setRescheduleAppt] = useState(null);
  const [newDate, setNewDate] = useState("");
  const [availableSlots, setAvailableSlots] = useState([]);
  const [newSlotTime, setNewSlotTime] = useState("");
  const [rescheduleMsg, setRescheduleMsg] = useState({ type: "", text: "" });

  // Invoice modal state
  const [showInvoice, setShowInvoice] = useState(false);
  const [invoiceData, setInvoiceData] = useState(null);

  const [userName, setUserName] = useState("");

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
      setUserName(decoded.name || "Patient");
    } catch {
      localStorage.removeItem("token");
      navigate("/");
    }
  }, [token, navigate]);

  useEffect(() => {
    fetchUpcoming();
    fetchHistory();
  }, []);

  const fetchUpcoming = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/patient/upcoming", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUpcomingAppointments(res.data);
    } catch (err) {
      console.error("Failed to fetch upcoming appointments", err);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/patient/history", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPastAppointments(res.data);
    } catch (err) {
      console.error("Failed to fetch appointment history", err);
    }
  };

  const handleCancel = async (appointmentId) => {
    if (!window.confirm("Are you sure you want to cancel this appointment?")) return;

    try {
      await axios.post(
        "http://localhost:5000/api/availability/cancel",
        { appointmentId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchUpcoming();
      fetchHistory();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to cancel appointment");
    }
  };

  const openReschedule = (appt) => {
    setRescheduleAppt(appt);
    setNewDate("");
    setNewSlotTime("");
    setAvailableSlots([]);
    setRescheduleMsg({ type: "", text: "" });
    setShowReschedule(true);
  };

  const fetchSlotsForReschedule = async (date) => {
    setNewDate(date);
    setNewSlotTime("");
    if (!rescheduleAppt || !date) return;

    try {
      const res = await axios.get(
        `http://localhost:5000/api/availability/${rescheduleAppt.doctorId._id}/${date}`
      );
      setAvailableSlots(res.data);
    } catch (err) {
      setAvailableSlots([]);
    }
  };

  const handleReschedule = async () => {
    if (!newDate || !newSlotTime) {
      setRescheduleMsg({ type: "error", text: "Please select a date and time slot" });
      return;
    }

    try {
      await axios.post(
        "http://localhost:5000/api/patient/reschedule",
        {
          appointmentId: rescheduleAppt._id,
          newDate,
          newSlotTime,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setShowReschedule(false);
      fetchUpcoming();
      fetchHistory();
    } catch (err) {
      setRescheduleMsg({
        type: "error",
        text: err.response?.data?.message || "Failed to reschedule",
      });
    }
  };

  const viewInvoice = async (appointmentId) => {
    try {
      const res = await axios.get(
        `http://localhost:5000/api/patient/invoice/${appointmentId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setInvoiceData(res.data);
      setShowInvoice(true);
    } catch (err) {
      alert("Failed to load invoice");
    }
  };

  const printInvoice = () => {
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice ${invoiceData.invoiceId}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #1f2937; background: #fff; }
          .invoice-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 3px solid #6366f1; }
          .brand { font-size: 28px; font-weight: 800; color: #6366f1; }
          .brand span { color: #9ca3af; font-weight: 300; }
          .invoice-id { text-align: right; }
          .invoice-id h2 { font-size: 24px; color: #374151; margin-bottom: 4px; }
          .invoice-id p { color: #6b7280; font-size: 14px; }
          .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 40px; }
          .detail-section h3 { font-size: 12px; text-transform: uppercase; letter-spacing: 1.5px; color: #9ca3af; margin-bottom: 8px; font-weight: 700; }
          .detail-section p { font-size: 15px; color: #374151; line-height: 1.6; }
          .detail-section p strong { color: #111827; }
          .amount-section { background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 30px; border-radius: 16px; text-align: center; margin-bottom: 30px; }
          .amount-section .label { font-size: 13px; text-transform: uppercase; letter-spacing: 2px; opacity: 0.85; }
          .amount-section .amount { font-size: 42px; font-weight: 800; margin-top: 8px; }
          .status-row { display: flex; justify-content: space-between; padding: 16px 0; border-top: 1px solid #e5e7eb; }
          .status-badge { padding: 4px 16px; border-radius: 20px; font-size: 13px; font-weight: 700; }
          .status-paid { background: #d1fae5; color: #065f46; }
          .status-pending { background: #fef3c7; color: #92400e; }
          .footer { margin-top: 50px; text-align: center; color: #9ca3af; font-size: 13px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <div class="invoice-header">
          <div>
            <div class="brand">🏥 Hospital<span>Booking</span></div>
            <p style="color: #6b7280; font-size: 14px; margin-top: 4px;">Healthcare Appointment System</p>
          </div>
          <div class="invoice-id">
            <h2>INVOICE</h2>
            <p>${invoiceData.invoiceId}</p>
            <p>Date: ${new Date(invoiceData.createdAt).toLocaleDateString()}</p>
          </div>
        </div>

        <div class="details-grid">
          <div class="detail-section">
            <h3>Patient Details</h3>
            <p><strong>${invoiceData.patientName}</strong></p>
            <p>${invoiceData.patientEmail}</p>
          </div>
          <div class="detail-section">
            <h3>Doctor Details</h3>
            <p><strong>${invoiceData.doctorName}</strong></p>
            <p>${invoiceData.specialization || "General"}</p>
          </div>
          <div class="detail-section">
            <h3>Appointment Date</h3>
            <p><strong>${invoiceData.date}</strong></p>
            <p>Time: ${invoiceData.slotTime}</p>
          </div>
          <div class="detail-section">
            <h3>Appointment Status</h3>
            <p><strong>${invoiceData.status}</strong></p>
          </div>
        </div>

        <div class="amount-section">
          <div class="label">Total Amount</div>
          <div class="amount">₹${invoiceData.amount.toLocaleString()}</div>
        </div>

        <div class="status-row">
          <span style="font-weight: 600;">Payment Status</span>
          <span class="status-badge ${invoiceData.paymentStatus === "Paid" ? "status-paid" : "status-pending"}">
            ${invoiceData.paymentStatus}
          </span>
        </div>

        <div class="footer">
          <p>Thank you for choosing HospitalBooking for your healthcare needs.</p>
          <p style="margin-top: 4px;">This is a computer-generated invoice.</p>
        </div>

        <script>window.onload = function() { window.print(); }</script>
      </body>
      </html>
    `);
    printWindow.document.close();
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

  const formatDateDisplay = (dateStr) => {
    const date = new Date(dateStr + "T00:00:00");
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const tabs = [
    { key: "upcoming", label: "📅 Upcoming" },
    { key: "history", label: "📋 History" },
    { key: "invoices", label: "🧾 Invoices" },
  ];

  const paidAppointments = pastAppointments.filter(
    (a) => a.paymentStatus === "Paid"
  );

  return (
    <>
      <Navbar />

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6 pt-24">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <header className="mb-8">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center text-white text-lg shadow-lg shadow-violet-200">
                👤
              </div>
              <div>
                <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                  Welcome back, {userName}
                </h1>
                <p className="text-gray-500 text-sm mt-0.5">
                  Manage your appointments, history & invoices
                </p>
              </div>
            </div>
          </header>

          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow group">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Upcoming</p>
                  <p className="text-2xl font-bold text-blue-600 mt-1">{upcomingAppointments.length}</p>
                </div>
                <div className="w-11 h-11 bg-gradient-to-br from-blue-400 to-blue-500 rounded-xl flex items-center justify-center text-white text-lg shadow-lg shadow-blue-100 group-hover:scale-110 transition-transform">
                  📅
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow group">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Completed</p>
                  <p className="text-2xl font-bold text-emerald-600 mt-1">
                    {pastAppointments.filter((a) => a.status === "Completed").length}
                  </p>
                </div>
                <div className="w-11 h-11 bg-gradient-to-br from-emerald-400 to-emerald-500 rounded-xl flex items-center justify-center text-white text-lg shadow-lg shadow-emerald-100 group-hover:scale-110 transition-transform">
                  ✅
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow group">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Cancelled</p>
                  <p className="text-2xl font-bold text-red-500 mt-1">
                    {pastAppointments.filter((a) => a.status === "Cancelled").length}
                  </p>
                </div>
                <div className="w-11 h-11 bg-gradient-to-br from-red-400 to-red-500 rounded-xl flex items-center justify-center text-white text-lg shadow-lg shadow-red-100 group-hover:scale-110 transition-transform">
                  ❌
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow group">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Spent</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    ₹{paidAppointments.reduce((sum, a) => sum + a.amount, 0).toLocaleString()}
                  </p>
                </div>
                <div className="w-11 h-11 bg-gradient-to-br from-violet-400 to-violet-500 rounded-xl flex items-center justify-center text-white text-lg shadow-lg shadow-violet-100 group-hover:scale-110 transition-transform">
                  💳
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
                    ? "bg-gradient-to-r from-violet-500 to-purple-500 text-white shadow-lg shadow-violet-200"
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* ==================== UPCOMING TAB ==================== */}
          {activeTab === "upcoming" && (
            <div>
              {upcomingAppointments.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 py-16 flex flex-col items-center text-gray-400">
                  <span className="text-5xl mb-3">🗓️</span>
                  <p className="font-semibold text-lg">No upcoming appointments</p>
                  <p className="text-sm mt-1">Book a new appointment to get started</p>
                  <button
                    onClick={() => navigate("/booking")}
                    className="mt-5 px-6 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl font-semibold text-sm shadow-lg shadow-blue-200 hover:shadow-xl transition-all transform hover:-translate-y-0.5"
                  >
                    Book Appointment
                  </button>
                </div>
              ) : (
                <div className="grid gap-4">
                  {upcomingAppointments.map((appt) => (
                    <div
                      key={appt._id}
                      className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-all duration-200"
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 bg-gradient-to-br from-violet-50 to-purple-50 rounded-xl flex flex-col items-center justify-center border border-violet-100">
                            <span className="text-xs font-bold text-violet-600">
                              {appt.slotTime}
                            </span>
                            <span className="text-[10px] text-violet-400 mt-0.5">
                              {appt.date?.split("-").slice(1).join("/")}
                            </span>
                          </div>
                          <div>
                            <h3 className="font-bold text-gray-800 text-lg">
                              Dr. {appt.doctorId?.name || "Unknown"}
                            </h3>
                            <p className="text-gray-400 text-sm">
                              {appt.doctorId?.specialization || "General Physician"}
                            </p>
                            <div className="flex items-center gap-3 mt-1.5">
                              <span className="text-sm font-semibold text-emerald-600">
                                ₹{appt.amount}
                              </span>
                              <span className="text-xs text-gray-400">
                                {formatDateDisplay(appt.date)}
                              </span>
                              <span
                                className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                                  appt.paymentStatus === "Paid"
                                    ? "bg-emerald-50 text-emerald-600"
                                    : "bg-amber-50 text-amber-600"
                                }`}
                              >
                                {appt.paymentStatus}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => openReschedule(appt)}
                            className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl text-sm font-semibold shadow-md shadow-blue-100 hover:shadow-lg transition-all transform hover:-translate-y-0.5"
                          >
                            📅 Reschedule
                          </button>
                          <button
                            onClick={() => handleCancel(appt._id)}
                            className="px-5 py-2.5 bg-white text-red-500 border-2 border-red-200 rounded-xl text-sm font-semibold hover:bg-red-50 transition-all transform hover:-translate-y-0.5"
                          >
                            ✕ Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ==================== HISTORY TAB ==================== */}
          {activeTab === "history" && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-6 bg-purple-500 rounded-full"></span>
                  <h2 className="text-lg font-bold text-gray-800">Appointment History</h2>
                  <span className="ml-2 text-xs font-semibold bg-purple-50 text-purple-600 px-2.5 py-1 rounded-full">
                    {pastAppointments.length} records
                  </span>
                </div>
              </div>

              {pastAppointments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                  <span className="text-5xl mb-3">📭</span>
                  <p className="font-medium">No past appointments</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-gray-50/80 text-gray-500 uppercase text-xs tracking-wider">
                        <th className="py-3.5 px-6 font-semibold">Doctor</th>
                        <th className="py-3.5 px-6 font-semibold">Date</th>
                        <th className="py-3.5 px-6 font-semibold">Time</th>
                        <th className="py-3.5 px-6 font-semibold">Amount</th>
                        <th className="py-3.5 px-6 font-semibold">Status</th>
                        <th className="py-3.5 px-6 font-semibold">Payment</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm">
                      {pastAppointments.map((appt) => (
                        <tr
                          key={appt._id}
                          className="border-b border-gray-50 hover:bg-gray-50/50 transition"
                        >
                          <td className="py-3.5 px-6">
                            <div className="font-semibold text-gray-800">
                              Dr. {appt.doctorId?.name || "N/A"}
                            </div>
                            <div className="text-xs text-gray-400">
                              {appt.doctorId?.specialization || ""}
                            </div>
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
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ==================== INVOICES TAB ==================== */}
          {activeTab === "invoices" && (
            <div>
              {paidAppointments.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 py-16 flex flex-col items-center text-gray-400">
                  <span className="text-5xl mb-3">🧾</span>
                  <p className="font-semibold text-lg">No invoices available</p>
                  <p className="text-sm mt-1">Invoices will appear after payment is completed</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {paidAppointments.map((appt) => (
                    <div
                      key={appt._id}
                      className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-all duration-200"
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl flex items-center justify-center border border-emerald-100 text-2xl">
                            🧾
                          </div>
                          <div>
                            <h3 className="font-bold text-gray-800">
                              Dr. {appt.doctorId?.name || "Unknown"}
                            </h3>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="text-sm text-gray-500">{appt.date}</span>
                              <span className="text-sm text-gray-500">at {appt.slotTime}</span>
                              <span className="text-sm font-bold text-emerald-600">₹{appt.amount}</span>
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => viewInvoice(appt._id)}
                          className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl text-sm font-semibold shadow-md shadow-emerald-100 hover:shadow-lg transition-all transform hover:-translate-y-0.5"
                        >
                          📥 Download Invoice
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ==================== RESCHEDULE MODAL ==================== */}
      {showReschedule && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-gray-800">Reschedule Appointment</h2>
              <button
                onClick={() => setShowReschedule(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition"
              >
                ✕
              </button>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 mb-5">
              <p className="text-sm text-gray-500">Current Appointment</p>
              <p className="font-semibold text-gray-800 mt-1">
                Dr. {rescheduleAppt?.doctorId?.name} — {rescheduleAppt?.date} at{" "}
                {rescheduleAppt?.slotTime}
              </p>
            </div>

            {rescheduleMsg.text && (
              <div className="px-4 py-3 rounded-xl mb-4 text-sm font-medium bg-red-50 border border-red-200 text-red-700">
                {rescheduleMsg.text}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-gray-600 text-sm font-semibold mb-1.5">
                  New Date
                </label>
                <input
                  type="date"
                  value={newDate}
                  onChange={(e) => fetchSlotsForReschedule(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-300 bg-gray-50 text-sm"
                />
              </div>

              {newDate && (
                <div>
                  <label className="block text-gray-600 text-sm font-semibold mb-1.5">
                    Available Slots
                  </label>
                  {availableSlots.length === 0 ? (
                    <p className="text-gray-400 text-sm py-3">
                      No slots available for this date
                    </p>
                  ) : (
                    <div className="grid grid-cols-4 gap-2">
                      {availableSlots.map((slot) => (
                        <button
                          key={slot.time}
                          onClick={() => setNewSlotTime(slot.time)}
                          className={`py-2.5 px-2 rounded-xl font-bold text-xs transition-all border-2 ${
                            newSlotTime === slot.time
                              ? "bg-violet-500 text-white border-violet-500 shadow-lg shadow-violet-200"
                              : "bg-white text-gray-700 border-gray-200 hover:border-violet-300 hover:text-violet-600"
                          }`}
                        >
                          {slot.time}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <button
                onClick={handleReschedule}
                disabled={!newDate || !newSlotTime}
                className={`w-full py-3 rounded-xl font-bold text-sm transition-all ${
                  newDate && newSlotTime
                    ? "bg-gradient-to-r from-violet-500 to-purple-500 text-white shadow-lg shadow-violet-200 hover:shadow-xl transform hover:-translate-y-0.5"
                    : "bg-gray-100 text-gray-400 cursor-not-allowed"
                }`}
              >
                Confirm Reschedule
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== INVOICE PREVIEW MODAL ==================== */}
      {showInvoice && invoiceData && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-gray-800">Invoice Preview</h2>
              <button
                onClick={() => setShowInvoice(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-2xl font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                    🏥 HospitalBooking
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Invoice</p>
                  <p className="font-bold text-gray-800">{invoiceData.invoiceId}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-1">Patient</p>
                  <p className="font-semibold text-gray-800 text-sm">{invoiceData.patientName}</p>
                  <p className="text-xs text-gray-500">{invoiceData.patientEmail}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-1">Doctor</p>
                  <p className="font-semibold text-gray-800 text-sm">{invoiceData.doctorName}</p>
                  <p className="text-xs text-gray-500">{invoiceData.specialization || "General"}</p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-3 flex justify-between">
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-1">Appointment</p>
                  <p className="font-semibold text-gray-800 text-sm">{invoiceData.date} at {invoiceData.slotTime}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-1">Status</p>
                  <span className={getStatusBadge(invoiceData.status)}>{invoiceData.status}</span>
                </div>
              </div>

              <div className="bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl p-5 text-center text-white">
                <p className="text-xs uppercase tracking-widest opacity-80 font-semibold">Total Amount</p>
                <p className="text-3xl font-extrabold mt-1">₹{invoiceData.amount.toLocaleString()}</p>
                <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-bold ${
                  invoiceData.paymentStatus === "Paid"
                    ? "bg-white/20 text-white"
                    : "bg-white/20 text-white"
                }`}>
                  {invoiceData.paymentStatus}
                </span>
              </div>

              <button
                onClick={printInvoice}
                className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-emerald-200 hover:shadow-xl transition-all transform hover:-translate-y-0.5"
              >
                🖨️ Print / Download PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default PatientDashboard;
