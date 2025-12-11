import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import apiClient from "../../api/axios";
import AttendanceTable from "../../components/user/AttendanceTable";
import ReportsTab from "../../components/user/ReportsTab";
import AttendanceHistory from "../../components/user/AttendanceHistory";
import CheckInModal from "../../components/user/CheckInModal";
import CheckOutModal from "../../components/user/CheckOutModal";
import StatusModal from "../../components/common/StatusModal";
import "./UserDashboard.css";

const UserDashboard = () => {
  const { user, logout } = useAuth();
  const [attendance, setAttendance] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [darkMode, setDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [checkInModalOpen, setCheckInModalOpen] = useState(false);
  const [checkOutModalOpen, setCheckOutModalOpen] = useState(false);
  const [statusModal, setStatusModal] = useState({
    open: false,
    variant: "success",
    title: "",
    message: "",
  });

  useEffect(() => {
    fetchTodayAttendance();
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchTodayAttendance = async () => {
    try {
      const response = await apiClient.get("/attendance/today");
      setAttendance(response.data.data);
    } catch (error) {
      console.error("Error fetching attendance:", error);
    }
  };

  // Get user's current location
  const getUserLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation is not supported by your browser"));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          let errorMessage = "Unable to get location";
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = "Location permission denied. Please enable location access.";
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = "Location information unavailable.";
              break;
            case error.TIMEOUT:
              errorMessage = "Location request timed out.";
              break;
          }
          reject(new Error(errorMessage));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    });
  };

  const showStatusModal = (variant, title, message) => {
    setStatusModal({
      open: true,
      variant,
      title,
      message,
    });
  };

  const handleCheckIn = async (qrData) => {
    setLoading(true);
    try {
      const location = await getUserLocation();
      const response = await apiClient.post("/attendance/check-in-qr", {
        qrCode: qrData,
        latitude: location.latitude,
        longitude: location.longitude,
        checkInMethod: "WEB",
      });

      fetchTodayAttendance();
      setCheckInModalOpen(false);
      showStatusModal(
        "success",
        "Check-in successful",
        response.data?.message || "You're all set for today!"
      );
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || error.message || "Check-in failed";
      showStatusModal("error", "Check-in failed", errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setLoading(true);
    try {
      const response = await apiClient.put("/attendance/check-out", {});
      fetchTodayAttendance();
      setCheckOutModalOpen(false);
      showStatusModal(
        "success",
        "Check-out successful",
        response.data?.message || "Enjoy the rest of your day!"
      );
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Check-out failed";
      showStatusModal("error", "Check-out failed", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const hasCheckedIn = attendance?.checkInTime != null;
  const hasCheckedOut = attendance?.checkOutTime != null;

  const greeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${
        darkMode ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-900"
      }`}
    >
      {/* Navbar */}
      <nav
        className={`p-4 transition-colors duration-300 ${
          darkMode ? "bg-gray-800" : "bg-blue-600 text-white"
        }`}
      >
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold">Smart Attendance</h1>
          <div className="flex items-center gap-4">
            <span>
              {user.firstName} {user.lastName}
            </span>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`px-3 py-1 rounded transition-colors ${
                darkMode ? "bg-gray-700" : "bg-white text-blue-600"
              }`}
            >
              {darkMode ? "☀️" : "🌙"}
            </button>
            <button
              onClick={logout}
              className="bg-red-500 px-4 py-2 rounded hover:bg-red-600"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container mx-auto p-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div
            className={`rounded-lg shadow-md p-6 mb-6 transition-colors duration-300 ${
              darkMode ? "bg-gray-800" : "bg-white"
            }`}
          >
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">
                  {greeting()}, {user.firstName} 👋
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  {user.organisationName}
                </p>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold">
                  {currentTime.toLocaleDateString()}
                </p>
                <p className="text-2xl font-bold">
                  {currentTime.toLocaleTimeString()}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex mb-6">
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`px-6 py-3 rounded-l-lg transition-colors ${
                activeTab === "dashboard"
                  ? darkMode
                    ? "bg-blue-600"
                    : "bg-blue-500 text-white"
                  : darkMode
                  ? "bg-gray-700"
                  : "bg-gray-200"
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab("attendance")}
              className={`px-6 py-3 transition-colors ${
                activeTab === "attendance"
                  ? darkMode
                    ? "bg-blue-600"
                    : "bg-blue-500 text-white"
                  : darkMode
                  ? "bg-gray-700"
                  : "bg-gray-200"
              }`}
            >
              Attendance
            </button>
            <button
              onClick={() => setActiveTab("reports")}
              className={`px-4 py-3 rounded-r-lg transition-colors ${
                activeTab === "reports"
                  ? darkMode
                    ? "bg-blue-600"
                    : "bg-blue-500 text-white"
                  : darkMode
                  ? "bg-gray-700"
                  : "bg-gray-200"
              }`}
            >
              Reports
            </button>
          </div>

          {/* Dashboard Tab */}
          {activeTab === "dashboard" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Today's Status */}
              <div
                className={`rounded-lg shadow-md p-6 transition-colors duration-300 ${
                  darkMode ? "bg-gray-800" : "bg-white"
                }`}
              >
                <h3 className="text-lg font-semibold mb-4">
                  Today's Attendance
                </h3>

                {!hasCheckedIn ? (
                  <p className="text-gray-500 mb-4">
                    You haven't checked in yet today.
                  </p>
                ) : (
                  <div className="space-y-2 mb-4">
                    <p className="text-green-600 font-semibold">
                      Checked In:{" "}
                      {new Date(attendance.checkInTime).toLocaleTimeString()}
                    </p>
                    {hasCheckedOut && (
                      <p className="text-blue-600 font-semibold">
                        Checked Out:{" "}
                        {new Date(attendance.checkOutTime).toLocaleTimeString()}
                      </p>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-4">
                  <button
                    onClick={() => setCheckInModalOpen(true)}
                    disabled={loading || hasCheckedIn}
                    className="flex-1 bg-green-500 text-white py-3 px-6 rounded-lg hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold transition-colors"
                  >
                    📍 Check In
                  </button>

                  <button
                    onClick={() => setCheckOutModalOpen(true)}
                    disabled={loading || !hasCheckedIn || hasCheckedOut}
                    className="flex-1 bg-blue-500 text-white py-3 px-6 rounded-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold transition-colors"
                  >
                    Check Out
                  </button>
                </div>
              </div>

              {/* Recent Attendance Table */}
              <AttendanceTable
                darkMode={darkMode}
                onRowClick={() => setActiveTab("attendance")}
              />
            </div>
          )}

          {/* Attendance Tab */}
          {activeTab === "attendance" && (
            <AttendanceHistory darkMode={darkMode} />
          )}

          {/* Reports Tab */}
          {activeTab === "reports" && <ReportsTab darkMode={darkMode} />}
        </div>
      </div>

      {/* Modals */}
      <CheckInModal
        isOpen={checkInModalOpen}
        onClose={() => setCheckInModalOpen(false)}
        onCheckIn={handleCheckIn}
        loading={loading}
      />
      <CheckOutModal
        isOpen={checkOutModalOpen}
        onClose={() => setCheckOutModalOpen(false)}
        onCheckOut={handleCheckOut}
        loading={loading}
      />
      <StatusModal
        open={statusModal.open}
        variant={statusModal.variant}
        title={statusModal.title}
        message={statusModal.message}
        onClose={() =>
          setStatusModal((prev) => ({
            ...prev,
            open: false,
          }))
        }
      />
    </div>
  );
};

export default UserDashboard;