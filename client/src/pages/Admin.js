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

  const [totalRevenue, setTotalRevenue] = useState(0);
  const [monthlyRevenue, setMonthlyRevenue] = useState([]);
  const [appointmentStats, setAppointmentStats] = useState([]);

  // 🔐 Protect route (admin only)
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
  }, []);

  const fetchAnalytics = async () => {
    try {
      const revenueRes = await axios.get(
        "http://localhost:5000/api/admin/total-revenue",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const monthlyRes = await axios.get(
        "http://localhost:5000/api/admin/monthly-revenue",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const statsRes = await axios.get(
        "http://localhost:5000/api/admin/appointment-stats",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setTotalRevenue(revenueRes.data.totalRevenue || 0);
      setMonthlyRevenue(monthlyRes.data || []);
      setAppointmentStats(statsRes.data || []);
    } catch (err) {
      console.error("Analytics fetch failed", err);
    }
  };

  const monthlyData = {
    labels: monthlyRevenue.map((item) => `Month ${item._id}`),
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

  return (
    <>
      <Navbar />

      <div className="min-h-screen bg-gray-100 p-10">
        <div className="max-w-6xl mx-auto">

          <h1 className="text-3xl font-bold mb-8">
            📊 Admin Dashboard
          </h1>

          {/* Total Revenue Card */}
          <div className="bg-white shadow-lg rounded-2xl p-6 mb-8">
            <h2 className="text-xl font-semibold mb-2">Total Revenue</h2>
            <p className="text-3xl font-bold text-green-600">
              ₹ {totalRevenue}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">

            {/* Monthly Revenue Chart */}
            <div className="bg-white shadow-lg rounded-2xl p-6">
              <h2 className="text-lg font-semibold mb-4">
                Monthly Revenue
              </h2>
              <Bar data={monthlyData} />
            </div>

            {/* Appointment Status Chart */}
            <div className="bg-white shadow-lg rounded-2xl p-6">
              <h2 className="text-lg font-semibold mb-4">
                Appointment Status Breakdown
              </h2>
              <Doughnut data={appointmentData} />
            </div>

          </div>
        </div>
      </div>
    </>
  );
}

export default Admin;
