import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import apiClient from "../../api/axios";

const QuickStats = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    presentToday: 0,
    absentToday: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);

      // Fetch total users in organization
      const usersResponse = await apiClient.get(
        `/users?orgId=${user.organisationId}`
      );
      const totalUsers = usersResponse.data.data
        ? usersResponse.data.data.length
        : usersResponse.data.count || 0;

      // Fetch today's attendance records
      const attendanceResponse = await apiClient.get(
        `/attendance?orgId=${user.organisationId}`
      );
      const attendanceRecords = attendanceResponse.data.data || [];

      // Calculate present/absent for today
      const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD format
      const todayRecords = attendanceRecords.filter((record) => {
        const recordDate = new Date(record.checkInTime)
          .toISOString()
          .split("T")[0];
        return recordDate === today;
      });

      const presentToday = todayRecords.length;
      const absentToday = totalUsers - presentToday;

      setStats({
        totalUsers,
        presentToday,
        absentToday: Math.max(0, absentToday), // Ensure not negative
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
      // Set default values on error
      setStats({
        totalUsers: 0,
        presentToday: 0,
        absentToday: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-gray-500 text-sm font-semibold mb-2">
            Total Users
          </h3>
          <p className="text-3xl font-bold text-blue-600">--</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-gray-500 text-sm font-semibold mb-2">
            Present Today
          </h3>
          <p className="text-3xl font-bold text-green-600">--</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-gray-500 text-sm font-semibold mb-2">
            Absent Today
          </h3>
          <p className="text-3xl font-bold text-red-600">--</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-gray-500 text-sm font-semibold mb-2">
          Total Users
        </h3>
        <p className="text-3xl font-bold text-blue-600">{stats.totalUsers}</p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-gray-500 text-sm font-semibold mb-2">
          Present Today
        </h3>
        <p className="text-3xl font-bold text-green-600">
          {stats.presentToday}
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-gray-500 text-sm font-semibold mb-2">
          Absent Today
        </h3>
        <p className="text-3xl font-bold text-red-600">{stats.absentToday}</p>
      </div>
    </div>
  );
};

export default QuickStats;
