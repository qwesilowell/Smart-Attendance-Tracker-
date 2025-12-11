const AttendanceTab = ({ org, filter, setFilter, data, loading }) => {
  const filters = [
    { id: "today", label: "Today" },
    { id: "yesterday", label: "Yesterday" },
    { id: "week", label: "This Week" },
    { id: "month", label: "This Month" },
    { id: "all", label: "All" },
  ];

  // Function to get date range for filtering
  const getDateRange = (filterType) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (filterType) {
      case "today":
        return {
          start: today,
          end: new Date(today.getTime() + 24 * 60 * 60 * 1000),
        };
      case "yesterday":
        const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
        return { start: yesterday, end: today };
      case "week":
        const weekStart = new Date(
          today.getTime() - today.getDay() * 24 * 60 * 60 * 1000
        );
        return {
          start: weekStart,
          end: new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000),
        };
      case "month":
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        return {
          start: monthStart,
          end: new Date(now.getFullYear(), now.getMonth() + 1, 1),
        };
      default:
        return null; // all records
    }
  };

  // Function to format ISO time strings to readable format
  const formatTime = (isoString) => {
    if (!isoString) return "-";
    const date = new Date(isoString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  // Function to format date with ordinal suffix
  const formatDate = (isoString) => {
    if (!isoString) return "-";
    const date = new Date(isoString);
    const day = date.getDate();
    const month = date.toLocaleDateString("en-US", { month: "long" });
    const year = date.getFullYear();
    const weekday = date.toLocaleDateString("en-US", { weekday: "long" });

    // Add ordinal suffix
    const getOrdinalSuffix = (day) => {
      if (day > 3 && day < 21) return "th";
      switch (day % 10) {
        case 1:
          return "st";
        case 2:
          return "nd";
        case 3:
          return "rd";
        default:
          return "th";
      }
    };

    return `${weekday} ${day}${getOrdinalSuffix(day)} ${month}, ${year}`;
  };

  // Transform API data to match table expectations
  const transformAttendanceData = (records) => {
    return records.map((record) => ({
      id: record.id,
      name: record.userName,
      date: formatDate(record.checkInTime),
      checkIn: formatTime(record.checkInTime),
      checkInMethod: record.checkInMethod,
      checkOut: record.checkOutTime ? formatTime(record.checkOutTime) : "-",
      status: record.checkOutTime ? "complete" : "active",
    }));
  };

  // Mock data if empty
  const mockData = [];

  // Filter data based on selected filter
  const filterData = (records, filterType) => {
    if (filterType === "all" || !records.length) return records;

    const dateRange = getDateRange(filterType);
    if (!dateRange) return records;

    return records.filter((record) => {
      const checkInDate = new Date(record.checkInTime);
      return checkInDate >= dateRange.start && checkInDate < dateRange.end;
    });
  };

  const displayData =
    data.length > 0
      ? transformAttendanceData(filterData(data, filter))
      : mockData;

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-800">Attendance Records</h2>

        <div className="flex gap-2">
          {filters.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                filter === f.id
                  ? "bg-purple-600 text-white shadow-lg"
                  : "bg-white text-gray-700 hover:bg-purple-50"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-xl p-12 text-center">
          <div className="inline-block animate-spin w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full"></div>
          <p className="mt-4 text-gray-600">Loading attendance data...</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-purple-50 border-b border-purple-100">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    Name
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    Date
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    Check In Time
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    Check In Method
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    Check Out Time
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {displayData.map((record, index) => (
                  <tr
                    key={record.id}
                    className="hover:bg-purple-50 transition-colors"
                    style={{
                      animation: `fadeIn 0.3s ease-out ${index * 0.05}s both`,
                    }}
                  >
                    <td className="px-6 py-4 text-gray-800 font-medium">
                      {record.name}
                    </td>
                    <td className="px-6 py-4 text-gray-600">{record.date}</td>
                    <td className="px-6 py-4 text-gray-600">
                      {record.checkIn}
                    </td>
                    <td className="px-6 py-4 text-gray-600 font-bold">
                      {record.checkInMethod}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {record.checkOut}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          record.status === "complete"
                            ? "bg-green-100 text-green-700"
                            : "bg-blue-100 text-blue-700"
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
        </div>
      )}
    </div>
  );
};

export default AttendanceTab;
