import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import apiClient from "../../api/axios";
import OverviewTab from "./components/OverviewTab";
import CreateUserTab from "./components/CreateUserTab";
import CreateAdminTab from "./components/CreateAdminTab";
import AttendanceTab from "./components/AttendanceTab";
import ReportsTab from "./components/ReportsTab";
import EditOrganisationModal from "./components/EditOrganisationModal";

const SuperAdminDashboard = () => {
  const { user, logout, selectOrganisation } = useAuth();
  const [organisations, setOrganisations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [attendanceData, setAttendanceData] = useState([]);
  const [attendanceFilter, setAttendanceFilter] = useState("today");
  const [showCreateOrgModal, setShowCreateOrgModal] = useState(false);
  const [createOrgForm, setCreateOrgForm] = useState({
    name: "",
    location: "",
    contactEmail: "",
    contactPhone: "",
    latitude: "",
    longitude: "",
  });
  const [showEditOrgModal, setShowEditOrgModal] = useState(false);
  const [editOrgForm, setEditOrgForm] = useState({
    name: "",
    location: "",
    contactEmail: "",
    contactPhone: "",
    latitude: "",
    longitude: "",
  });

  const orgsPerPage = 10;

  useEffect(() => {
    fetchOrganisations();
  }, []);

  useEffect(() => {
    if (selectedOrg && activeTab === "attendance") {
      fetchAttendance();
    }
  }, [selectedOrg, activeTab, attendanceFilter]);

  const fetchOrganisations = async () => {
    try {
      const response = await apiClient.get("/organisations");
      setOrganisations(response.data.data);
    } catch (error) {
      console.error("Error fetching organisations:", error);
      setMessage("Failed to load organisations");
    }
  };

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(
        `/attendance?orgId=${selectedOrg.id}`
      );
      setAttendanceData(response.data.data || []);
    } catch (error) {
      console.error("Error fetching attendance:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOrganisation = async (org) => {
    setLoading(true);
    setMessage("");

    const result = await selectOrganisation(org.id);

    if (result.success) {
      setSelectedOrg(org);
      setActiveTab("overview");
      setMessage("Switched to " + org.name);
      setTimeout(() => setMessage(""), 3000);
    } else {
      setMessage(" " + result.message);
    }

    setLoading(false);
  };

  const captureCoordinates = (setter) => {
    if (!navigator.geolocation) {
      setMessage("Geolocation is not supported by this browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setter((prev) => ({
          ...prev,
          latitude: position.coords.latitude.toFixed(6),
          longitude: position.coords.longitude.toFixed(6),
        }));
        setMessage("✅ Location captured from this device");
        setTimeout(() => setMessage(""), 3000);
      },
      (error) => {
        let errorMessage = "Unable to get location.";
        if (error.code === error.PERMISSION_DENIED) {
          errorMessage =
            "Location permission denied. Please allow access to capture coordinates.";
        }
        setMessage(errorMessage);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const handleBackToOrgs = () => {
    setSelectedOrg(null);
    setActiveTab("overview");
    setShowEditOrgModal(false);
  };

  const handleCreateOrganisation = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const payload = {
        ...createOrgForm,
        latitude: createOrgForm.latitude
          ? Number(createOrgForm.latitude)
          : null,
        longitude: createOrgForm.longitude
          ? Number(createOrgForm.longitude)
          : null,
      };
      const response = await apiClient.post("/organisations", payload);
      if (response.data.success) {
        setMessage("✅ Organisation created successfully!");
        setShowCreateOrgModal(false);
        setCreateOrgForm({
          name: "",
          location: "",
          contactEmail: "",
          contactPhone: "",
          latitude: "",
          longitude: "",
        });
        // Refresh organisations list
        fetchOrganisations();
        setTimeout(() => setMessage(""), 3000);
      } else {
        setMessage("Failed to create organisation");
      }
    } catch (error) {
      console.error("Error creating organisation:", error);
      setMessage("Failed to create organisation");
    } finally {
      setLoading(false);
    }
  };

  const handleEditOrganisation = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const payload = {
        ...editOrgForm,
        latitude: editOrgForm.latitude
          ? Number(editOrgForm.latitude)
          : null,
        longitude: editOrgForm.longitude
          ? Number(editOrgForm.longitude)
          : null,
      };
      const response = await apiClient.put(
        `/organisations/${selectedOrg.id}`,
        payload
      );
      if (response.data.success) {
        setMessage("✅ Organisation updated successfully!");
        // Update the selectedOrg state with new data
        setSelectedOrg({ ...selectedOrg, ...editOrgForm });
        // Update the organisation in the organisations list
        setOrganisations((prevOrgs) =>
          prevOrgs.map((org) =>
            org.id === selectedOrg.id ? { ...org, ...editOrgForm } : org
          )
        );
        setShowEditOrgModal(false);
        setTimeout(() => setMessage(""), 3000);
      } else {
        setMessage("Failed to update organisation");
      }
    } catch (error) {
      console.error("Error updating organisation:", error);
      setMessage("Failed to update organisation");
    } finally {
      setLoading(false);
    }
  };

  // Pagination
  const indexOfLastOrg = currentPage * orgsPerPage;
  const indexOfFirstOrg = indexOfLastOrg - orgsPerPage;
  const currentOrgs = organisations.slice(indexOfFirstOrg, indexOfLastOrg);
  const totalPages = Math.ceil(organisations.length / orgsPerPage);

  const tabs = [
    { id: "overview", label: "Overview", icon: "📊" },
    { id: "users", label: "Create User", icon: "👤" },
    { id: "admins", label: "Create Admin", icon: "👨‍💼" },
    { id: "attendance", label: "Attendance", icon: "📅" },
    { id: "reports", label: "Reports", icon: "📈" },
  ];

  // If no organization selected, show org selection
  if (!selectedOrg) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50">
        {/* Navbar */}
        <nav className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg">
          <div className="container mx-auto px-4 py-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                  <span className="text-2xl">👑</span>
                </div>
                <div>
                  <h1 className="text-xl font-bold">Smart Attendance</h1>
                  <p className="text-xs text-purple-100">Super Admin Portal</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="hidden md:flex items-center gap-3 bg-white/10 px-4 py-2 rounded-lg backdrop-blur-sm">
                  <span className="text-sm font-medium">
                    {user.firstName} {user.lastName}
                  </span>
                  <span className="px-2 py-1 bg-yellow-400 text-purple-900 text-xs font-bold rounded">
                    SUPER ADMIN
                  </span>
                </div>
                <button
                  onClick={logout}
                  className="bg-red-500 px-4 py-2 rounded-lg hover:bg-red-600 transition-colors font-medium text-sm shadow-lg hover:shadow-xl"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-8">
          {/* Message Toast */}
          {message && (
            <div
              className={`fixed top-20 right-4 z-[90] max-w-sm p-4 rounded-lg shadow-lg animate-slideDown ${
                message.includes("✅")
                  ? "bg-green-50 border-l-4 border-green-500 text-green-700"
                  : "bg-red-50 border-l-4 border-red-500 text-red-700"
              }`}
            >
              <p className="font-medium">{message}</p>
            </div>
          )}

          {/* Create Organisation Modal */}
          {showCreateOrgModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-xl p-8 shadow-2xl max-w-md w-full mx-4">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-800">
                    Create Organisation
                  </h3>
                  <button
                    onClick={() => setShowCreateOrgModal(false)}
                    className="text-gray-400 hover:text-gray-600 text-2xl"
                  >
                    ×
                  </button>
                </div>

                <form onSubmit={handleCreateOrganisation} className="space-y-4">
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">
                      Organisation Name
                    </label>
                    <input
                      type="text"
                      value={createOrgForm.name}
                      onChange={(e) =>
                        setCreateOrgForm({
                          ...createOrgForm,
                          name: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      required
                      placeholder="Enter organisation name"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 font-medium mb-2">
                      Location
                    </label>
                    <input
                      type="text"
                      value={createOrgForm.location}
                      onChange={(e) =>
                        setCreateOrgForm({
                          ...createOrgForm,
                          location: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      required
                      placeholder="Enter location"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 font-medium mb-2">
                      Contact Email
                    </label>
                    <input
                      type="email"
                      value={createOrgForm.contactEmail}
                      onChange={(e) =>
                        setCreateOrgForm({
                          ...createOrgForm,
                          contactEmail: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      required
                      placeholder="Enter contact email"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 font-medium mb-2">
                      Contact Phone
                    </label>
                    <input
                      type="tel"
                      value={createOrgForm.contactPhone}
                      onChange={(e) =>
                        setCreateOrgForm({
                          ...createOrgForm,
                          contactPhone: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      required
                      placeholder="Enter contact phone"
                    />
                  </div>

                  <div className="p-4 rounded-lg border border-blue-100 bg-blue-50 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div>
                        <p className="text-gray-800 font-semibold">
                          Office Coordinates
                        </p>
                        <p className="text-sm text-gray-600">
                          Use your current location or enter the latitude and longitude manually.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => captureCoordinates(setCreateOrgForm)}
                        className="px-4 py-2 rounded-lg bg-white text-blue-600 border border-blue-200 hover:bg-blue-100 transition-colors text-sm font-semibold"
                      >
                        Use Current Location
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input
                        type="number"
                        step="0.000001"
                        value={createOrgForm.latitude}
                        onChange={(e) =>
                          setCreateOrgForm((prev) => ({
                            ...prev,
                            latitude: e.target.value,
                          }))
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="Latitude e.g. 5.631155"
                      />
                      <input
                        type="number"
                        step="0.000001"
                        value={createOrgForm.longitude}
                        onChange={(e) =>
                          setCreateOrgForm((prev) => ({
                            ...prev,
                            longitude: e.target.value,
                          }))
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="Longitude e.g. -0.222192"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowCreateOrgModal(false)}
                      className="flex-1 bg-gray-200 text-gray-700 py-3 px-6 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white py-3 px-6 rounded-lg font-medium hover:shadow-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? "Creating..." : "Create Organisation"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-4xl font-bold text-gray-800 mb-2">
              Select Organisation
            </h2>
            <p className="text-gray-600">Choose an organisation to manage</p>
            <div className="mt-4 flex justify-center items-center gap-4">
              <div className="inline-block px-4 py-2 bg-purple-100 rounded-full text-purple-700 font-medium">
                {organisations.length} Total Organisations
              </div>
              <button
                onClick={() => setShowCreateOrgModal(true)}
                className="bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-2 rounded-lg hover:shadow-lg transition-all transform hover:scale-105 font-medium"
              >
                ➕ Create Organisation
              </button>
            </div>
          </div>

          {/* Organisation Grid */}
          {organisations.length === 0 ? (
            <div className="text-center py-12">
              <div className="inline-block w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-4">
                <span className="text-3xl">🏢</span>
              </div>
              <p className="text-gray-500 text-lg">
                No organisations available
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-8">
                {currentOrgs.map((org, index) => (
                  <button
                    key={org.id}
                    onClick={() => handleSelectOrganisation(org)}
                    disabled={loading}
                    className="group relative bg-white rounded-xl p-6 shadow-md hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 disabled:opacity-50 disabled:cursor-not-allowed border-2 border-transparent hover:border-purple-300"
                    style={{
                      animation: `fadeInUp 0.5s ease-out ${index * 0.1}s both`,
                    }}
                  >
                    <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-purple-100 to-blue-100 rounded-bl-full opacity-50"></div>

                    <div className="relative">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <span className="text-2xl">🏢</span>
                      </div>

                      <h3 className="font-bold text-lg mb-2 text-gray-800 group-hover:text-purple-600 transition-colors line-clamp-2">
                        {org.name}
                      </h3>

                      <div className="flex items-center text-sm text-gray-600 mb-1">
                        <span className="mr-1">📍</span>
                        <span className="line-clamp-1">{org.location}</span>
                      </div>

                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <span className="text-xs text-purple-600 font-medium group-hover:text-purple-700">
                          Click to manage →
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2">
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(prev - 1, 1))
                    }
                    disabled={currentPage === 1}
                    className="px-4 py-2 bg-white rounded-lg shadow hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    ← Previous
                  </button>

                  <div className="flex gap-2">
                    {[...Array(totalPages)].map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrentPage(i + 1)}
                        className={`w-10 h-10 rounded-lg font-medium transition-all ${
                          currentPage === i + 1
                            ? "bg-purple-600 text-white shadow-lg scale-110"
                            : "bg-white hover:bg-purple-50 text-gray-700"
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                    }
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 bg-white rounded-lg shadow hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        <style>{`
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          @keyframes slideDown {
            from {
              opacity: 0;
              transform: translateY(-20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          .animate-slideDown {
            animation: slideDown 0.3s ease-out;
          }
          .line-clamp-1 {
            overflow: hidden;
            display: -webkit-box;
            -webkit-line-clamp: 1;
            -webkit-box-orient: vertical;
          }
          .line-clamp-2 {
            overflow: hidden;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
          }
        `}</style>
      </div>
    );
  }

  // Organization selected - show tabs
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50">
      {/* Navbar */}
      <nav className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <button
                onClick={handleBackToOrgs}
                className="bg-white/20 hover:bg-white/30 px-3 py-2 rounded-lg transition-colors backdrop-blur-sm"
              >
                ← Back
              </button>
              <div>
                <h1 className="text-xl font-bold">{selectedOrg.name}</h1>
                <p className="text-xs text-purple-100">
                  📍 {selectedOrg.location}
                </p>
              </div>
            </div>
            <button
              onClick={logout}
              className="bg-red-500 px-4 py-2 rounded-lg hover:bg-red-600 transition-colors font-medium text-sm"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Tabs */}
      <div className="bg-white shadow-md sticky top-16 z-40">
        <div className="container mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-4 font-medium transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? "text-purple-600 border-b-3 border-purple-600 bg-purple-50"
                    : "text-gray-600 hover:text-purple-600 hover:bg-gray-50"
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <EditOrganisationModal
        showEditOrgModal={showEditOrgModal}
        setShowEditOrgModal={setShowEditOrgModal}
        editOrgForm={editOrgForm}
        setEditOrgForm={setEditOrgForm}
        handleEditOrganisation={handleEditOrganisation}
        loading={loading}
        onCaptureLocation={captureCoordinates}
      />

      {/* Tab Content */}
      <div className="container mx-auto px-4 py-8">
        {activeTab === "overview" && (
          <OverviewTab
            org={selectedOrg}
            setShowEditOrgModal={setShowEditOrgModal}
            setEditOrgForm={setEditOrgForm}
          />
        )}
        {activeTab === "users" && <CreateUserTab org={selectedOrg} />}
        {activeTab === "admins" && <CreateAdminTab org={selectedOrg} />}
        {activeTab === "attendance" && (
          <AttendanceTab
            org={selectedOrg}
            filter={attendanceFilter}
            setFilter={setAttendanceFilter}
            data={attendanceData}
            loading={loading}
          />
        )}
        {activeTab === "reports" && <ReportsTab org={selectedOrg} />}
      </div>
    </div>
  );
};

// Create User Tab

// Create Admin Tab

// Attendance Tab

export default SuperAdminDashboard;
