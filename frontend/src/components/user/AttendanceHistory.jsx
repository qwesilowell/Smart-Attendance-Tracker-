import { useState, useEffect } from "react";
import apiClient from "../../api/axios";
import "./AttendanceHistory.css";

const AttendanceHistory = ({ darkMode }) => {
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [pageSize, setPageSize] = useState(20);

  // Filter states
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [methodFilter, setMethodFilter] = useState("");
  const [isFiltering, setIsFiltering] = useState(false);

  useEffect(() => {
    fetchAttendanceHistory();
  }, [currentPage, pageSize]);

  const fetchAttendanceHistory = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get("/attendance/history", {
        params: {
          page: currentPage,
          size: pageSize,
        },
      });

      const pageData = response.data;
      setAttendanceData(pageData.content || []);
      setTotalPages(pageData.totalPages || 0);
      setTotalElements(pageData.totalElements || 0);
    } catch (error) {
      console.error("Error fetching attendance history:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFilteredAttendance = async () => {
    setLoading(true);
    setIsFiltering(true);
    try {
      const params = {
        page: currentPage,
        size: pageSize,
      };

      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (methodFilter) params.method = methodFilter;

      const response = await apiClient.get("/attendance/history/filter", {
        params,
      });

      const pageData = response.data;
      setAttendanceData(pageData.content || []);
      setTotalPages(pageData.totalPages || 0);
      setTotalElements(pageData.totalElements || 0);
    } catch (error) {
      console.error("Error fetching filtered attendance:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFilters = () => {
    setCurrentPage(0); // Reset to first page
    fetchFilteredAttendance();
  };

  const handleClearFilters = () => {
    setStartDate("");
    setEndDate("");
    setMethodFilter("");
    setIsFiltering(false);
    setCurrentPage(0);
    fetchAttendanceHistory();
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const handlePageSizeChange = (e) => {
    setPageSize(Number(e.target.value));
    setCurrentPage(0); // Reset to first page
  };

  const exportToCSV = () => {
    const headers = [
      "Date",
      "Check-In Time",
      "Check-In Method",
      "Check-Out Time",
      "Check-Out Method",
      "Hours Worked",
    ];

    const csvData = attendanceData.map((record) => {
      const checkInTime = record.checkInTime
        ? new Date(record.checkInTime).toLocaleTimeString()
        : "-";
      const checkOutTime = record.checkOutTime
        ? new Date(record.checkOutTime).toLocaleTimeString()
        : "-";
      const hoursWorked = calculateHoursWorked(
        record.checkInTime,
        record.checkOutTime
      );

      return [
        formatDate(record.attendanceDate),
        checkInTime,
        record.checkInMethod || "-",
        checkOutTime,
        record.checkOutMethod || "-",
        hoursWorked,
      ].join(",");
    });

    const csv = [headers.join(","), ...csvData].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `attendance-history-${
      new Date().toISOString().split("T")[0]
    }.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date
      .toLocaleDateString("en-US", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
      })
      .replace(/,/g, "");
  };

  const calculateHoursWorked = (checkIn, checkOut) => {
    if (!checkIn || !checkOut) return "-";
    const diff = new Date(checkOut) - new Date(checkIn);
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const renderPagination = () => {
    const pages = [];
    const maxPagesToShow = 5;
    let startPage = Math.max(0, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages - 1, startPage + maxPagesToShow - 1);

    if (endPage - startPage < maxPagesToShow - 1) {
      startPage = Math.max(0, endPage - maxPagesToShow + 1);
    }

    // Previous button
    pages.push(
      <button
        key="prev"
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={currentPage === 0}
        className={`px-3 py-1 rounded ${
          currentPage === 0
            ? "opacity-50 cursor-not-allowed"
            : "hover:bg-gray-200 dark:hover:bg-gray-600"
        }`}
      >
        Previous
      </button>
    );

    // First page
    if (startPage > 0) {
      pages.push(
        <button
          key={0}
          onClick={() => handlePageChange(0)}
          className="px-3 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
        >
          1
        </button>
      );
      if (startPage > 1) {
        pages.push(
          <span key="ellipsis1" className="px-2">
            ...
          </span>
        );
      }
    }

    // Page numbers
    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`px-3 py-1 rounded ${
            currentPage === i
              ? "bg-blue-500 text-white"
              : "hover:bg-gray-200 dark:hover:bg-gray-600"
          }`}
        >
          {i + 1}
        </button>
      );
    }

    // Last page
    if (endPage < totalPages - 1) {
      if (endPage < totalPages - 2) {
        pages.push(
          <span key="ellipsis2" className="px-2">
            ...
          </span>
        );
      }
      pages.push(
        <button
          key={totalPages - 1}
          onClick={() => handlePageChange(totalPages - 1)}
          className="px-3 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
        >
          {totalPages}
        </button>
      );
    }

    // Next button
    pages.push(
      <button
        key="next"
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={currentPage >= totalPages - 1}
        className={`px-3 py-1 rounded ${
          currentPage >= totalPages - 1
            ? "opacity-50 cursor-not-allowed"
            : "hover:bg-gray-200 dark:hover:bg-gray-600"
        }`}
      >
        Next
      </button>
    );

    return pages;
  };

  if (loading && attendanceData.length === 0) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-300 rounded w-1/4 mb-6"></div>
        <div className="h-64 bg-gray-300 rounded"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Full Attendance History</h3>
        <p className="text-gray-500 dark:text-gray-400">
          View and manage your complete attendance records
        </p>
      </div>

      {/* Filters Section */}
      <div
        className={`rounded-lg shadow-md p-6 mb-6 ${
          darkMode ? "bg-gray-800" : "bg-white"
        }`}
      >
        <h3 className="text-lg font-semibold mb-4">Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className={`w-full px-3 py-2 rounded border ${
                darkMode
                  ? "bg-gray-700 border-gray-600"
                  : "bg-white border-gray-300"
              }`}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className={`w-full px-3 py-2 rounded border ${
                darkMode
                  ? "bg-gray-700 border-gray-600"
                  : "bg-white border-gray-300"
              }`}
            />
          </div>
          <div className="flex items-end gap-2">
            <button
              onClick={handleApplyFilters}
              className="flex-1 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
            >
              Apply
            </button>
            {isFiltering && (
              <button
                onClick={handleClearFilters}
                className="flex-1 bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Stats and Export */}
      <div
        className={`rounded-lg shadow-md p-4 mb-6 flex justify-between items-center ${
          darkMode ? "bg-gray-800" : "bg-white"
        }`}
      >
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Showing {attendanceData.length} of {totalElements} records
        </div>
        <button
          onClick={exportToCSV}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition flex items-center gap-2"
        >
          <span>📥</span>
          Export CSV
        </button>
      </div>

      {/* Table */}
      <div
        className={`rounded-lg shadow-md overflow-hidden ${
          darkMode ? "bg-gray-800" : "bg-white"
        }`}
      >
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className={`${darkMode ? "bg-gray-700" : "bg-gray-100"}`}>
              <tr>
                <th className="text-left py-3 px-4 font-semibold">Date</th>
                <th className="text-left py-3 px-4 font-semibold">Check-In</th>
                <th className="text-left py-3 px-4 font-semibold">
                  Check-In Method
                </th>
                <th className="text-left py-3 px-4 font-semibold">Check-Out</th>
                <th className="text-left py-3 px-4 font-semibold">
                  Check-Out Method
                </th>
                <th className="text-left py-3 px-4 font-semibold">
                  Hours Worked
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="text-center py-8">
                    <div className="animate-pulse">Loading...</div>
                  </td>
                </tr>
              ) : attendanceData.length === 0 ? (
                <tr>
                  <td
                    colSpan="6"
                    className="text-center py-8 text-gray-500 dark:text-gray-400"
                  >
                    No attendance records found.
                  </td>
                </tr>
              ) : (
                attendanceData.map((record, index) => (
                  <tr
                    key={record.id || index}
                    className={`border-t transition-colors ${
                      darkMode
                        ? "border-gray-700 hover:bg-gray-700"
                        : "border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <td className="py-3 px-4">
                      {formatDate(record.attendanceDate)}
                    </td>
                    <td className="py-3 px-4">
                      {record.checkInTime
                        ? new Date(record.checkInTime).toLocaleTimeString()
                        : "-"}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          record.checkInMethod === "FACE_ID"
                            ? "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                            : record.checkInMethod === "QR_CODE"
                            ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                            : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                        }`}
                      >
                        {record.checkInMethod || "-"}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {record.checkOutTime
                        ? new Date(record.checkOutTime).toLocaleTimeString()
                        : "-"}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          record.checkOutMethod === "WEB"
                            ? "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                            : record.checkOutMethod === "QR_CODE"
                            ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                            : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                        }`}
                      >
                        {record.checkOutMethod || "-"}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold">
                      {calculateHoursWorked(
                        record.checkInTime,
                        record.checkOutTime
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div
            className={`border-t px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-4 ${
              darkMode ? "border-gray-700" : "border-gray-200"
            }`}
          >
            <div className="flex items-center gap-2 text-sm">
              <span>Show</span>
              <select
                value={pageSize}
                onChange={handlePageSizeChange}
                className={`px-2 py-1 rounded border ${
                  darkMode
                    ? "bg-gray-700 border-gray-600"
                    : "bg-white border-gray-300"
                }`}
              >
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </select>
              <span>per page</span>
            </div>

            <div className="flex items-center gap-2">{renderPagination()}</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AttendanceHistory;
