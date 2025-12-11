import { useState, useEffect } from "react";
import apiClient from "../../api/axios";
import "./AttendanceTable.css";

const AttendanceTable = ({ darkMode, onRowClick }) => {
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecentAttendance();
  }, []);

  const fetchRecentAttendance = async () => {
    try {
      const response = await apiClient.get("/attendance/last7");
      setAttendanceData(response.data.data || []);
    } catch (error) {
      console.error("Error fetching recent attendance:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const options = {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    };
    return date.toLocaleDateString("en-US", options);
  };

  const handleRowClick = (record) => {
    console.log("Navigate to full attendance for:", record);
  };

  if (loading) {
    return (
      <div
        className={`rounded-lg shadow-md p-6 transition-colors duration-300 ${
          darkMode ? "bg-gray-800" : "bg-white"
        }`}
      >
        <h3 className="text-lg font-semibold mb-4">Recent Attendance</h3>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-300 rounded mb-2"></div>
          <div className="h-4 bg-gray-300 rounded mb-2"></div>
          <div className="h-4 bg-gray-300 rounded mb-2"></div>
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
      <h3 className="text-lg font-semibold mb-4">
        Recent Attendance (Last 7 Days)
      </h3>
      <div className="overflow-x-auto">
        <table className="min-w-full table-auto">
          <thead>
            <tr
              className={`border-b ${
                darkMode ? "border-gray-600" : "border-gray-200"
              }`}
            >
              <th className="text-left py-2 px-4 font-semibold">Date</th>
              <th className="text-left py-2 px-4 font-semibold">
                Check-In Time
              </th>
              <th className="text-left py-2 px-4 font-semibold">
                Check-In Method
              </th>
              <th className="text-left py-2 px-4 font-semibold">
                Check-Out Time
              </th>
              <th className="text-left py-2 px-4 font-semibold">
                Check-Out Method
              </th>
            </tr>
          </thead>
          <tbody>
            {attendanceData.length === 0 ? (
              <tr>
                <td colSpan="5" className="text-center py-4 text-gray-500">
                  No attendance records found for the last 7 days.
                </td>
              </tr>
            ) : (
              attendanceData.map((record, index) => (
                <tr
                  key={index}
                  className={`border-b hover:bg-gray-50 transition-colors cursor-pointer ${
                    darkMode
                      ? "border-gray-600 hover:bg-gray-700"
                      : "border-gray-200 hover:bg-gray-50"
                  }`}
                  onClick={() =>
                    onRowClick ? onRowClick() : handleRowClick(record)
                  }
                >
                  <td className="py-3 px-4">
                    {formatDate(record.attendanceDate)}
                  </td>
                  <td className="py-3 px-4">
                    {record.checkInTime
                      ? new Date(record.checkInTime).toLocaleTimeString()
                      : "-"}
                  </td>
                  <td className="py-3 px-4">{record.checkInMethod || "-"}</td>
                  <td className="py-3 px-4">
                    {record.checkOutTime
                      ? new Date(record.checkOutTime).toLocaleTimeString()
                      : "-"}
                  </td>
                  <td className="py-3 px-4">{record.checkOutMethod || "-"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AttendanceTable;
