import { useState, useEffect } from "react";
import apiClient from "../../../api/axios";

const OverviewTab = ({ org, setShowEditOrgModal, setEditOrgForm }) => {
  const [totalUsers, setTotalUsers] = useState(0);
  const [todayCheckIns, setTodayCheckIns] = useState(0);
  const [pendingCheckOuts, setPendingCheckOuts] = useState(0);
  const [admins, setAdmins] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOverviewData = async () => {
      try {
        setLoading(true);

        // Fetch users
        const usersResponse = await apiClient.get(`/users?orgId=${org.id}`);
        const users = usersResponse.data.data || [];
        setTotalUsers(usersResponse.data.count || 0);
        setAdmins(users.filter((user) => user.role === "ADMIN").length);

        // Fetch attendance
        const attendanceResponse = await apiClient.get(
          `/attendance?orgId=${org.id}`
        );
        const attendanceRecords = attendanceResponse.data.data || [];

        // Get today's date
        const today = new Date();
        const todayString = today.toISOString().split("T")[0]; // YYYY-MM-DD

        // Filter today's records
        const todayRecords = attendanceRecords.filter((record) => {
          const checkInDate = new Date(record.checkInTime)
            .toISOString()
            .split("T")[0];
          return checkInDate === todayString;
        });

        setTodayCheckIns(todayRecords.length);
        setPendingCheckOuts(
          todayRecords.filter((record) => !record.checkOutTime).length
        );
      } catch (error) {
        console.error("Error fetching overview data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (org) {
      fetchOverviewData();
    }
  }, [org]);

  const stats = [
    { label: "Total Users", value: totalUsers, icon: "👥", color: "blue" },
    {
      label: "Today Check-ins",
      value: todayCheckIns,
      icon: "✅",
      color: "green",
    },
    {
      label: "Pending Check-outs",
      value: pendingCheckOuts,
      icon: "⏰",
      color: "orange",
    },
    { label: "Admins", value: admins, icon: "👨‍💼", color: "purple" },
  ];

  if (loading) {
    return (
      <div className="space-y-6 animate-fadeIn">
        <h2 className="text-2xl font-bold text-gray-800">
          Organisation Overview
        </h2>
        <div className="bg-white rounded-xl p-12 text-center">
          <div className="inline-block animate-spin w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full"></div>
          <p className="mt-4 text-gray-600">Loading overview data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <h2 className="text-2xl font-bold text-gray-800">
        Organisation Overview
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
            style={{ animation: `fadeInUp 0.5s ease-out ${index * 0.1}s both` }}
          >
            <div
              className={`w-12 h-12 bg-${stat.color}-100 rounded-lg flex items-center justify-center mb-4`}
            >
              <span className="text-2xl">{stat.icon}</span>
            </div>
            <p className="text-gray-600 text-sm mb-1">{stat.label}</p>
            <p className="text-3xl font-bold text-gray-800">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl p-6 shadow-md">
        <h3 className="text-lg font-bold mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="bg-gradient-to-r from-blue-500 to-blue-600 text-white py-4 px-6 rounded-lg hover:shadow-lg transition-all transform hover:scale-105">
            📊 View Reports
          </button>
          <button className="bg-gradient-to-r from-green-500 to-green-600 text-white py-4 px-6 rounded-lg hover:shadow-lg transition-all transform hover:scale-105">
            📥 Export Data
          </button>
          <button
            onClick={() => {
              setEditOrgForm({
                name: org.name,
                location: org.location,
                contactEmail: org.contactEmail,
                contactPhone: org.contactPhone,
                latitude: org.latitude || "",
                longitude: org.longitude || "",
              });
              setShowEditOrgModal(true);
            }}
            className="bg-gradient-to-r from-orange-500 to-orange-600 text-white py-4 px-6 rounded-lg hover:shadow-lg transition-all transform hover:scale-105"
          >
            ✏️ Edit Organization
          </button>
        </div>
      </div>
    </div>
  );
};

export default OverviewTab;
