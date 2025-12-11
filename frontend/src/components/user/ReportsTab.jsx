import { useState, useEffect } from "react";
import apiClient from "../../api/axios";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import "./ReportsTab.css";

const ReportsTab = ({ darkMode }) => {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState("month");
  const [downloadingFormat, setDownloadingFormat] = useState("");

  useEffect(() => {
    fetchReports();
  }, [selectedPeriod]);

  const fetchReports = async () => {
    try {
      const response = await apiClient.get(
        `/attendance/reports?period=${selectedPeriod}`
      );
      setReportData(response.data.data);
    } catch (error) {
      console.error("Error fetching reports:", error);
    } finally {
      setLoading(false);
    }
  };

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
    link.setAttribute("download", extractFileName(disposition, fallbackName));
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  const downloadReport = async (format) => {
    setDownloadingFormat(format);

    try {
      const response = await apiClient.get("/attendance/reports/export", {
        params: { period: selectedPeriod, format },
        responseType: "blob",
      });

      triggerFileDownload(
        response.data,
        response.headers["content-disposition"],
        `attendance-report-${selectedPeriod}.${format}`
      );
    } catch (error) {
      console.error("Error downloading report:", error);
    } finally {
      setDownloadingFormat("");
    }
  };

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

  if (loading) {
    return (
      <div
        className={`rounded-lg shadow-md p-6 transition-colors duration-300 ${
          darkMode ? "bg-gray-800" : "bg-white"
        }`}
      >
        <h3 className="text-lg font-semibold mb-4">Attendance Reports</h3>
        <div className="animate-pulse">
          <div className="h-64 bg-gray-300 rounded mb-4"></div>
          <div className="h-64 bg-gray-300 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`rounded-lg shadow-md p-6 transition-colors duration-300 ${
        darkMode ? "bg-gray-800" : "bg-white"
      }`}
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-6">
        <h3 className="text-lg font-semibold">Attendance Reports</h3>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className={`px-3 py-2 border rounded-md ${
              darkMode
                ? "bg-gray-700 border-gray-600 text-white"
                : "bg-white border-gray-300"
            }`}
          >
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
          </select>
          <button
            onClick={() => downloadReport("csv")}
            disabled={downloadingFormat === "csv"}
            className={`px-3 py-2 rounded-md text-sm font-medium text-white ${
              downloadingFormat === "csv"
                ? "opacity-60 cursor-not-allowed"
                : "bg-blue-500 hover:bg-blue-600"
            }`}
          >
            {downloadingFormat === "csv" ? "Preparing CSV..." : "Download CSV"}
          </button>
          <button
            onClick={() => downloadReport("pdf")}
            disabled={downloadingFormat === "pdf"}
            className={`px-3 py-2 rounded-md text-sm font-medium text-white ${
              downloadingFormat === "pdf"
                ? "opacity-60 cursor-not-allowed"
                : "bg-purple-500 hover:bg-purple-600"
            }`}
          >
            {downloadingFormat === "pdf" ? "Preparing PDF..." : "Download PDF"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Attendance Chart */}
        <div className="chart-container">
          <h4 className="text-md font-semibold mb-4">Daily Attendance</h4>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={reportData?.dailyAttendance || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="hours" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Check-in Methods Pie Chart */}
        <div className="chart-container">
          <h4 className="text-md font-semibold mb-4">Check-in Methods</h4>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={reportData?.checkInMethods || []}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) =>
                  `${name} ${(percent * 100).toFixed(0)}%`
                }
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {reportData?.checkInMethods?.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Summary Statistics */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div
          className={`p-4 rounded-lg ${
            darkMode ? "bg-gray-700" : "bg-blue-50"
          }`}
        >
          <h5 className="text-sm font-medium text-gray-500">Total Days</h5>
          <p className="text-2xl font-bold">{reportData?.totalDays || 0}</p>
        </div>
        <div
          className={`p-4 rounded-lg ${
            darkMode ? "bg-gray-700" : "bg-green-50"
          }`}
        >
          <h5 className="text-sm font-medium text-gray-500">Present Days</h5>
          <p className="text-2xl font-bold">{reportData?.presentDays || 0}</p>
        </div>
        <div
          className={`p-4 rounded-lg ${
            darkMode ? "bg-gray-700" : "bg-yellow-50"
          }`}
        >
          <h5 className="text-sm font-medium text-gray-500">Late Arrivals</h5>
          <p className="text-2xl font-bold">{reportData?.lateArrivals || 0}</p>
        </div>
        <div
          className={`p-4 rounded-lg ${
            darkMode ? "bg-gray-700" : "bg-purple-50"
          }`}
        >
          <h5 className="text-sm font-medium text-gray-500">Avg Hours/Day</h5>
          <p className="text-2xl font-bold">
            {reportData?.averageHours?.toFixed(1) || 0}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ReportsTab;
