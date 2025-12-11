import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import QuickStats from "../../components/admin/QuickStats";
import Sidebar from "../../components/admin/Sidebar";
import CreateAdminModal from "../../components/admin/CreateAdminModal";
import EditAdminModal from "../../components/admin/EditAdminModal";
import CreateUserModal from "../../components/admin/CreateUserModal";
import EditUserModal from "../../components/admin/EditUserModal";
import WorkTimeEditor from "../../components/admin/settings/WorkTimeEditor";
import apiClient from "../../api/axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faQrcode } from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [activeSubTab, setActiveSubTab] = useState("admin");
  const [adminUsers, setAdminUsers] = useState([]);
  const [regularUsers, setRegularUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [createAdminModalOpen, setCreateAdminModalOpen] = useState(false);
  const [editAdminModalOpen, setEditAdminModalOpen] = useState(false);
  const [createUserModalOpen, setCreateUserModalOpen] = useState(false);
  const [editUserModalOpen, setEditUserModalOpen] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [dateFilter, setDateFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Report state
  const [reportType, setReportType] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [orgReport, setOrgReport] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState("");
  const [downloadingFormat, setDownloadingFormat] = useState("");
  const [hasInitializedReportRange, setHasInitializedReportRange] = useState(false);

  // QR Codes state
  const [isGenerating, setIsGenerating] = useState(false);
  const [qrLoading, setQrLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (hasInitializedReportRange) {
      return;
    }

    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    setStartDate(firstDay.toISOString().split("T")[0]);
    setEndDate(lastDay.toISOString().split("T")[0]);
    setHasInitializedReportRange(true);
  }, [hasInitializedReportRange]);

  const extractFileName = (disposition, fallback) => {
    if (!disposition) {
      return fallback;
    }

    const utfMatch = disposition.match(/filename\*=UTF-8''([^;]+)/i);
    if (utfMatch && utfMatch[1]) {
      return decodeURIComponent(utfMatch[1]);
    }

    const plainMatch = disposition.match(/filename="?([^\";]+)"?/i);
    return plainMatch && plainMatch[1] ? plainMatch[1] : fallback;
  };

  const triggerFileDownload = (blobData, disposition, fallbackName) => {
    const blob = blobData instanceof Blob ? blobData : new Blob([blobData]);
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      extractFileName(disposition, fallbackName)
    );
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  const buildReportParams = () => {
    const params = {
      orgId: user?.organisationId,
      reportType,
    };

    if (startDate) {
      params.startDate = startDate;
    }
    if (endDate) {
      params.endDate = endDate;
    }
    if (selectedUserId) {
      params.userId = selectedUserId;
    }

    return params;
  };

  const fetchOrganisationReport = async () => {
    if (!user?.organisationId || !startDate || !endDate) {
      return;
    }

    setReportLoading(true);
    setReportError("");

    try {
      const response = await apiClient.get("/attendance/reports/organisation", {
        params: buildReportParams(),
      });
      setOrgReport(response.data.data || response.data);
    } catch (error) {
      console.error("Error generating report:", error);
      setReportError(
        error.response?.data?.message ||
          "Unable to generate the report. Please try again."
      );
    } finally {
      setReportLoading(false);
    }
  };

  const downloadOrganisationReport = async (format) => {
    if (!user?.organisationId) {
      return;
    }

    setReportError("");
    setDownloadingFormat(format);

    try {
      const response = await apiClient.get(
        "/attendance/reports/organisation/export",
        {
          params: { ...buildReportParams(), format },
          responseType: "blob",
        }
      );
      triggerFileDownload(
        response.data,
        response.headers["content-disposition"],
        `organisation-attendance-report.${format}`
      );
    } catch (error) {
      console.error("Error downloading report:", error);
      setReportError(
        error.response?.data?.message ||
          "Unable to download the report. Please try again."
      );
    } finally {
      setDownloadingFormat("");
    }
  };

  const formatDateLabel = (value) =>
    value ? new Date(value).toLocaleDateString() : "N/A";

  const formatTimeLabel = (value) =>
    value
      ? new Date(value).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "—";

  const fetchAdminUsers = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get(
        `/users?orgId=${user.organisationId}`
      );
      // Filter only admin users
      const admins = response.data.data.filter((user) => user.role === "ADMIN");
      setAdminUsers(admins);
    } catch (error) {
      console.error("Error fetching admin users:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRegularUsers = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get(
        `/users?orgId=${user.organisationId}`
      );
      // Filter only regular users
      const users = response.data.data.filter((user) => user.role === "USER");
      setRegularUsers(users);
    } catch (error) {
      console.error("Error fetching regular users:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendance = async () => {
    setAttendanceLoading(true);
    try {
      const response = await apiClient.get(
        `/attendance?orgId=${user.organisationId}`
      );
      // Transform the data to match the expected format
      const transformedData = (response.data.data || []).map((record) => ({
        id: record.id,
        date: record.attendanceDate
          ? new Date(record.attendanceDate).toISOString().split("T")[0]
          : "",
        checkInTime: record.checkInTime,
        checkOutTime: record.checkOutTime,
        status: record.checkOutTime ? "present" : "Incomplete", // Simple status logic
        user: {
          id: record.userId,
          firstName: record.userName ? record.userName.split(" ")[0] : "",
          lastName: record.userName
            ? record.userName.split(" ").slice(1).join(" ")
            : "",
          email: record.userEmail,
        },
      }));
      setAttendance(transformedData);
    } catch (error) {
      console.error("Error fetching attendance:", error);
    } finally {
      setAttendanceLoading(false);
    }
  };

  useEffect(() => {
    if (
      activeTab === "users" &&
      activeSubTab === "admin" &&
      user?.organisationId
    ) {
      fetchAdminUsers();
    } else if (
      activeTab === "users" &&
      activeSubTab === "users" &&
      user?.organisationId
    ) {
      fetchRegularUsers();
    } else if (activeTab === "attendance" && user?.organisationId) {
      fetchAttendance();
    } else if (activeTab === "reports" && user?.organisationId) {
      if (regularUsers.length === 0) {
        fetchRegularUsers();
      }
    }
  }, [activeTab, activeSubTab, user, regularUsers.length]);

  const handleCreateAdminSuccess = () => {
    fetchAdminUsers();
  };

  const handleCreateUserSuccess = () => {
    fetchRegularUsers();
  };

  const handleEditAdminSuccess = () => {
    fetchAdminUsers();
    setSelectedAdmin(null);
  };

  const handleEditUserSuccess = () => {
    fetchRegularUsers();
    setSelectedUser(null);
  };

  const handleEditAdmin = (admin) => {
    setSelectedAdmin(admin);
    setEditAdminModalOpen(true);
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setEditUserModalOpen(true);
  };

  const generateQRCode = async () => {
    setIsGenerating(true);
    setError(""); // Clear previous errors

    try {
      console.log("Starting QR generation..."); // ✅ Debug log

      // Get user's location with timeout
      let latitude = 5.6037; // Default location
      let longitude = -0.187;

      try {
        console.log("Requesting geolocation..."); // ✅ Debug log

        const position = await new Promise((resolve, reject) => {
          // Add timeout of 5 seconds
          const timeoutId = setTimeout(() => {
            reject(new Error("Location request timed out"));
          }, 5000);

          navigator.geolocation.getCurrentPosition(
            (pos) => {
              clearTimeout(timeoutId);
              resolve(pos);
            },
            (err) => {
              clearTimeout(timeoutId);
              reject(err);
            },
            {
              enableHighAccuracy: false,
              timeout: 5000,
              maximumAge: 60000,
            }
          );
        });

        latitude = position.coords.latitude;
        longitude = position.coords.longitude;
        console.log("Got location:", latitude, longitude); //  Debug log
      } catch (geoError) {
        console.warn("Could not get location, using default:", geoError);
        // Continue with default location
      }

      console.log("Making API request..."); //  Debug log

      const response = await apiClient.post("/admin/qr-codes/start", {
        latitude: latitude,
        longitude: longitude,
        radiusMeters: 100,
      });

      console.log("API response:", response.data); //  Debug log

      // Navigate to QR display page
      console.log("Navigating to QR display..."); //  Debug log
      navigate("/qr-display", {
        state: { qrData: response.data },
      });
    } catch (error) {
      console.error("Error generating QR code:", error);
      console.error("Error response:", error.response?.data);
      console.error("Error status:", error.response?.status);

      // Set user-friendly error message
      if (error.response?.status === 403) {
        setError("You don't have permission to generate QR codes");
      } else if (error.response?.status === 401) {
        setError("Your session has expired. Please login again");
      } else if (error.message) {
        setError(error.message);
      } else {
        setError("Failed to generate QR code. Please try again.");
      }
    } finally {
      setIsGenerating(false);
      console.log("Generation finished"); //  Debug log
    }
  };

  const summary = orgReport?.summary;
  const recentRecords = orgReport?.records?.slice(0, 5) || [];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        activeSubTab={activeSubTab}
        setActiveSubTab={setActiveSubTab}
      />

      {/* Modals */}
      <CreateAdminModal
        isOpen={createAdminModalOpen}
        onClose={() => setCreateAdminModalOpen(false)}
        onSuccess={handleCreateAdminSuccess}
      />
      <EditAdminModal
        isOpen={editAdminModalOpen}
        onClose={() => setEditAdminModalOpen(false)}
        onSuccess={handleEditAdminSuccess}
        adminUser={selectedAdmin}
      />
      <CreateUserModal
        isOpen={createUserModalOpen}
        onClose={() => setCreateUserModalOpen(false)}
        onSuccess={handleCreateUserSuccess}
      />
      <EditUserModal
        isOpen={editUserModalOpen}
        onClose={() => setEditUserModalOpen(false)}
        onSuccess={handleEditUserSuccess}
        user={selectedUser}
      />

      {/* Navbar */}
      <nav className="bg-blue-600 text-white p-4">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="mr-4 text-white hover:bg-blue-700 p-2 rounded"
            >
              ☰
            </button>
            <h1 className="text-xl font-bold">Smart Attendance - Admin</h1>
          </div>
          <div className="flex items-center gap-4">
            <span>
              {user.firstName} {user.lastName}
            </span>
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
      <div className="flex-1 overflow-auto">
        <div className="h-full p-6">
          {activeTab === "dashboard" && (
            <div className="max-w-7xl mx-auto space-y-6">
              <h2 className="text-3xl font-bold text-gray-800">Dashboard</h2>

              {/* Organisation Info */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold mb-2">Organisation</h3>
                <p className="text-gray-700 text-xl">{user.organisationName}</p>
              </div>

              {/* Quick Stats */}
              <QuickStats />

              {/* Quick Actions */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <button
                    onClick={() => setActiveTab("users")}
                    className="bg-blue-500 text-white py-3 px-6 rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    👥 Manage Users
                  </button>
                  <button
                    onClick={() => setActiveTab("attendance")}
                    className="bg-green-500 text-white py-3 px-6 rounded-lg hover:bg-green-600 transition-colors"
                  >
                    📊 View Attendance
                  </button>
                  <button
                    onClick={() => setCreateUserModalOpen(true)}
                    className="bg-purple-500 text-white py-3 px-6 rounded-lg hover:bg-purple-600 transition-colors"
                  >
                    ➕ Add New User
                  </button>
                  <button
                    onClick={() => setActiveTab("reports")}
                    className="bg-orange-500 text-white py-3 px-6 rounded-lg hover:bg-orange-600 transition-colors"
                  >
                    📈 Generate Report
                  </button>
                  <button
                    onClick={() => setActiveTab("qr-codes")}
                    className="bg-teal-500 text-white py-3 px-6 rounded-lg hover:bg-teal-600 transition-colors"
                  >
                    <FontAwesomeIcon icon={faQrcode} className="mr-2" />
                    QR Codes
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "users" && activeSubTab === "admin" && (
            <div className="max-w-7xl mx-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-gray-800">
                  Admin Users
                </h2>
                <button
                  onClick={() => setCreateAdminModalOpen(true)}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  + Create Admin
                </button>
              </div>

              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                {loading ? (
                  <div className="p-8 text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <p className="mt-2 text-gray-600">Loading admin users...</p>
                  </div>
                ) : adminUsers.length === 0 ? (
                  <div className="p-8 text-center text-gray-600">
                    No admin users found.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Name
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Email
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Created
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {adminUsers.map((admin) => (
                          <tr key={admin.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                {admin.firstName} {admin.lastName}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-500">
                                {admin.email}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-500">
                                {new Date(
                                  admin.createdAt
                                    .replace(" ", "T")
                                    .split(".")[0]
                                ).toLocaleDateString("en-GB", {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                })}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <button
                                onClick={() => handleEditAdmin(admin)}
                                className="text-blue-600 hover:text-blue-900 mr-4"
                              >
                                Edit
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "users" && activeSubTab === "users" && (
            <div className="max-w-7xl mx-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-gray-800">
                  Regular Users
                </h2>
                <button
                  onClick={() => setCreateUserModalOpen(true)}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  + Create User
                </button>
              </div>

              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                {loading ? (
                  <div className="p-8 text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <p className="mt-2 text-gray-600">
                      Loading regular users...
                    </p>
                  </div>
                ) : regularUsers.length === 0 ? (
                  <div className="p-8 text-center text-gray-600">
                    No regular users found.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Name
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Email
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Created
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {regularUsers.map((user) => (
                          <tr key={user.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                {user.firstName} {user.lastName}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-500">
                                {user.email}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-500">
                                {new Date(
                                  user.createdAt
                                    .replace(" ", "T")
                                    .split(".")[0]
                                ).toLocaleDateString("en-GB", {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                })}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <button
                                onClick={() => handleEditUser(user)}
                                className="text-blue-600 hover:text-blue-900 mr-4"
                              >
                                Edit
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "attendance" && (
            <div className="max-w-7xl mx-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-gray-800">
                  Attendance Records
                </h2>
              </div>

              {/* Filters */}
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Filter by Date
                    </label>
                    <input
                      type="date"
                      value={dateFilter}
                      onChange={(e) => setDateFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Search by Name or Email
                    </label>
                    <input
                      type="text"
                      placeholder="Search..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={() => {
                        setDateFilter("");
                        setSearchQuery("");
                      }}
                      className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
                    >
                      Clear Filters
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                {attendanceLoading ? (
                  <div className="p-8 text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <p className="mt-2 text-gray-600">
                      Loading attendance records...
                    </p>
                  </div>
                ) : attendance.length === 0 ? (
                  <div className="p-8 text-center text-gray-600">
                    No attendance records found.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Name
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Email
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Check-in Time
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Check-out Time
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {attendance
                          .filter((record) => {
                            const matchesDate =
                              !dateFilter || record.date === dateFilter;
                            const matchesSearch =
                              !searchQuery ||
                              `${record.user.firstName} ${record.user.lastName}`
                                .toLowerCase()
                                .includes(searchQuery.toLowerCase()) ||
                              record.user.email
                                .toLowerCase()
                                .includes(searchQuery.toLowerCase());
                            return matchesDate && matchesSearch;
                          })
                          .map((record) => (
                            <tr key={record.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">
                                  {record.user.firstName} {record.user.lastName}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-500">
                                  {record.user.email}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-500">
                                  {new Date(record.date).toLocaleDateString()}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-500">
                                  {record.checkInTime
                                    ? new Date(
                                        record.checkInTime
                                      ).toLocaleTimeString()
                                    : "-"}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-500">
                                  {record.checkOutTime
                                    ? new Date(
                                        record.checkOutTime
                                      ).toLocaleTimeString()
                                    : "-"}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span
                                  className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                    record.status === "present"
                                      ? "bg-green-100 text-green-800"
                                      : record.status === "Incomplete"
                                      ? "bg-red-100 text-red-800"
                                      : "bg-yellow-100 text-yellow-800"
                                  }`}
                                >
                                  {record.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "reports" && (
            <div className="max-w-7xl mx-auto">
              <h2 className="text-3xl font-bold text-gray-800 mb-6">Reports</h2>

              {/* Report Generation Form */}
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-4">
                  <h3 className="text-lg font-semibold">
                    Generate Attendance Report
                  </h3>
                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={() => downloadOrganisationReport("csv")}
                      disabled={reportLoading || downloadingFormat === "csv"}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {downloadingFormat === "csv" ? "Preparing CSV..." : "📥 Download CSV"}
                    </button>
                    <button
                      onClick={() => downloadOrganisationReport("pdf")}
                      disabled={reportLoading || downloadingFormat === "pdf"}
                      className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {downloadingFormat === "pdf" ? "Preparing PDF..." : "📄 Download PDF"}
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Report Type
                    </label>
                    <select
                      value={reportType}
                      onChange={(e) => setReportType(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">All Records</option>
                      <option value="complete">Completed Sessions</option>
                      <option value="active">Active Sessions</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      User (Optional)
                    </label>
                    <select
                      value={selectedUserId}
                      onChange={(e) => setSelectedUserId(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">All Users</option>
                      {regularUsers.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.firstName} {user.lastName}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                {reportError && (
                  <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
                    {reportError}
                  </div>
                )}
                <div className="flex gap-4">
                  <button
                    onClick={fetchOrganisationReport}
                    disabled={reportLoading || !startDate || !endDate}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {reportLoading ? "Generating..." : "📊 Generate Report"}
                  </button>
                </div>
              </div>

              {/* Quick Report Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-lg font-semibold text-gray-800">
                        Total Records
                      </h4>
                      <p className="text-2xl font-bold text-green-600">
                        {summary ? summary.totalRecords : "--"}
                      </p>
                      <p className="text-sm text-gray-600">
                        Across selected filters
                      </p>
                    </div>
                    <div className="text-4xl">📅</div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-lg font-semibold text-gray-800">
                        Completion Rate
                      </h4>
                      <p className="text-2xl font-bold text-blue-600">
                        {summary ? `${summary.completionRate}%` : "--"}
                      </p>
                      <p className="text-sm text-gray-600">
                        Completed check-ins
                      </p>
                    </div>
                    <div className="text-4xl">📈</div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-lg font-semibold text-gray-800">
                        Late Arrivals
                      </h4>
                      <p className="text-2xl font-bold text-orange-600">
                        {summary ? summary.lateArrivals : "--"}
                      </p>
                      <p className="text-sm text-gray-600">
                        Check-ins after 8:00 AM
                      </p>
                    </div>
                    <div className="text-4xl">⏰</div>
                  </div>
                </div>
              </div>

              {/* Recent Reports */}
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-800">
                    Recent Activity
                  </h3>
                </div>
                <div className="p-6">
                  {recentRecords.length === 0 ? (
                    <p className="text-sm text-gray-500">
                      Run a report to see recent attendance activity.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {recentRecords.map((record) => (
                        <div
                          key={record.id}
                          className="flex flex-col md:flex-row md:items-center md:justify-between p-4 border border-gray-200 rounded-lg"
                        >
                          <div>
                            <h4 className="font-semibold text-gray-800">
                              {record.userName || "Unknown User"}
                            </h4>
                            <p className="text-sm text-gray-600">
                              {record.userEmail} ·{" "}
                              {formatDateLabel(record.attendanceDate)}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              Check-in: {formatTimeLabel(record.checkInTime)} ·
                              Check-out: {formatTimeLabel(record.checkOutTime)}
                            </p>
                          </div>
                          <span
                            className={`mt-3 md:mt-0 text-sm font-semibold ${
                              record.checkOutTime
                                ? "text-green-600"
                                : "text-orange-600"
                            }`}
                          >
                            {record.checkOutTime ? "Complete" : "Active"}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === "qr-codes" && (
            <div className="max-w-7xl mx-auto">
              <h2 className="text-3xl font-bold text-gray-800 mb-6">
                QR Codes
              </h2>

              {/* QR Code Controls */}
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h3 className="text-lg font-semibold mb-4">
                  Attendance QR Code
                </h3>

                {/* Error Message */}
                {error && (
                  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    {error}
                  </div>
                )}

                <button
                  onClick={generateQRCode}
                  disabled={isGenerating}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGenerating ? "Starting..." : "Start Attendance Session"}
                </button>

                <p className="text-sm text-gray-600 mt-4">
                  Generate a QR code for employees to check in/out. The code
                  refreshes every 5 minutes automatically.
                </p>
              </div>
            </div>
          )}

          {activeTab === "settings" && (
            <div className="max-w-7xl mx-auto p-4 sm:px-6 lg:px-8">
              <h2 className="text-3xl font-bold text-gray-800 mb-6">
                Organisation Settings
              </h2>

              {activeSubTab === "editInfo" && (
                <OrganisationInfoEditor organizationId={user?.organisationId} />
              )}

              {activeSubTab === "editWorkTime" && (
                <WorkTimeEditor organizationId={user?.organisationId} />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
