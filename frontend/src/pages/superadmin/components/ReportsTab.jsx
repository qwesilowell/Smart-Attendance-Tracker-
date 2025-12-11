import { useState, useEffect } from "react";
import apiClient from "../../../api/axios";

const ReportsTab = ({ org }) => {
  const [reportType, setReportType] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [reportPayload, setReportPayload] = useState(null);
  const [reportError, setReportError] = useState("");
  const [downloadingFormat, setDownloadingFormat] = useState("");

  const extractFileName = (disposition, fallback) => {
    if (!disposition) {
      return fallback;
    }

    const utfMatch = disposition.match(/filename\*=UTF-8''([^;]+)/i);
    if (utfMatch && utfMatch[1]) {
      return decodeURIComponent(utfMatch[1]);
    }

    const plainMatch = disposition.match(/filename="?([^";]+)"?/i);
    return plainMatch && plainMatch[1] ? plainMatch[1] : fallback;
  };

  const triggerFileDownload = (blobData, disposition, fallbackName) => {
    const blob = blobData instanceof Blob ? blobData : new Blob([blobData]);
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", extractFileName(disposition, fallbackName));
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  const formatDateLabel = (value) =>
    value ? new Date(value).toLocaleDateString() : "N/A";

  const formatTimeLabel = (value) =>
    value
      ? new Date(value).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "-";

  const buildReportParams = (overrides = {}) => {
    const params = {
      orgId: org?.id,
      reportType,
      startDate,
      endDate,
      ...(selectedUserId ? { userId: selectedUserId } : {}),
      ...overrides,
    };

    if (!params.userId) {
      delete params.userId;
    }

    return params;
  };

  const fetchUsers = async () => {
    if (!org?.id) {
      return;
    }

    try {
      const response = await apiClient.get(`/users?orgId=${org.id}`);
      setUsers(response.data.data || []);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const fetchReport = async (overrides = {}) => {
    if (!org?.id) {
      return;
    }

    setLoading(true);
    setReportError("");

    try {
      const response = await apiClient.get("/attendance/reports/organisation", {
        params: buildReportParams(overrides),
      });
      setReportPayload(response.data.data || response.data);
    } catch (error) {
      console.error("Error generating report:", error);
      setReportError(
        error.response?.data?.message ||
          "Unable to generate the report. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = async (format) => {
    if (!org?.id) {
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
        `attendance-report-${org.name || "organisation"}.${format}`
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

  useEffect(() => {
    if (!org?.id) {
      return;
    }

    fetchUsers();

    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const first = firstDay.toISOString().split("T")[0];
    const last = lastDay.toISOString().split("T")[0];

    setStartDate(first);
    setEndDate(last);
    setSelectedUserId("");
    setReportPayload(null);
    fetchReport({ startDate: first, endDate: last });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [org]);

  if (!org) {
    return (
      <div className="bg-white rounded-xl p-8 shadow-md text-center text-gray-500">
        Select an organisation to generate reports.
      </div>
    );
  }

  const summary = reportPayload?.summary;
  const records = reportPayload?.records || [];

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-800">
          Attendance Reports · {org.name}
        </h2>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => downloadReport("csv")}
            disabled={downloadingFormat === "csv"}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {downloadingFormat === "csv" ? "Preparing CSV..." : "📊 Export CSV"}
          </button>
          <button
            onClick={() => downloadReport("pdf")}
            disabled={downloadingFormat === "pdf"}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {downloadingFormat === "pdf" ? "Preparing PDF..." : "📄 Export PDF"}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-md">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Report Filters
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Report Type
            </label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="all">All Records</option>
              <option value="complete">Complete Sessions</option>
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              User (Optional)
            </label>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">All Users</option>
              {users.map((user) => (
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

        <button
          onClick={() => fetchReport()}
          disabled={loading || !startDate || !endDate}
          className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Generating..." : "📊 Generate Report"}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Records</p>
              <p className="text-2xl font-bold text-gray-900">
                {summary ? summary.totalRecords : "--"}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">📋</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Unique Users</p>
              <p className="text-2xl font-bold text-gray-900">
                {summary ? summary.uniqueUsers : "--"}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">👥</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Complete Sessions
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {summary ? summary.completeSessions : "--"}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">✅</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Active Sessions
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {summary ? summary.activeSessions : "--"}
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">⏳</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-md">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Recent Activity
        </h3>

        {records.length === 0 ? (
          <p className="text-sm text-gray-500">
            Run a report to see detailed attendance entries.
          </p>
        ) : (
          <div className="space-y-4">
            {records.slice(0, 6).map((record) => (
              <div
                key={record.id}
                className="flex flex-col md:flex-row md:items-center md:justify-between p-4 border border-gray-200 rounded-lg"
              >
                <div>
                  <h4 className="font-semibold text-gray-800">
                    {record.userName || "Unknown User"}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {record.userEmail} · {formatDateLabel(record.attendanceDate)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Check-in: {formatTimeLabel(record.checkInTime)} · Check-out:{" "}
                    {formatTimeLabel(record.checkOutTime)}
                  </p>
                </div>
                <span
                  className={`mt-3 md:mt-0 text-sm font-semibold ${
                    record.checkOutTime ? "text-green-600" : "text-orange-600"
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
  );
};

export default ReportsTab;
