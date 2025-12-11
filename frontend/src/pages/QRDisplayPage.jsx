// QRDisplayPage.jsx
import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import apiClient from "../api/axios";

function QRDisplayPage() {
  const location = useLocation();
  const navigate = useNavigate();

  // 1. Initialize with data passed via navigation state, if available.
  const [qrData, setQrData] = useState(location.state?.qrData || null);
  const [timeLeft, setTimeLeft] = useState("");
  const [error, setError] = useState("");

  // NEW STATE: Tracks if we are currently loading the initial data from the API
  const [isLoading, setIsLoading] = useState(!location.state?.qrData);

  // FUNCTION: Centralized API call logic for both mount and refresh
  const fetchCurrentQrCode = async () => {
    setIsLoading(true);
    setError("");
    try {
      const res = await apiClient.get("/admin/qr-codes/start");
      setQrData(res.data);
      setIsLoading(false);
    } catch (err) {
      console.error("Failed to fetch current QR code:", err);

      setError(
        "Could not load the active QR session. Please check your session or log in again."
      );
      setIsLoading(false);
      setQrData(null); // Explicitly clear data if fetch fails
    }
  };

  // 2. CRITICAL FIX: Effect to fetch data on mount or refresh
  useEffect(() => {
    // Only run the fetch if we are missing data (i.e., not from navigation state)
    if (!qrData) {
      fetchCurrentQrCode();
    } else {
      setIsLoading(false);
    }
  }, []);

  // 3. Countdown timer logic (now calls the robust fetch function)
  useEffect(() => {
    if (!qrData || isLoading) return;

    const interval = setInterval(async () => {
      const now = new Date();
      const expiryTime = new Date(qrData.expiresAt);
      const difference = expiryTime - now;

      if (difference <= 0) {
        setTimeLeft("Refreshing...");

        await fetchCurrentQrCode();
      } else {
        const minutes = Math.floor(difference / 60000);
        const seconds = Math.floor((difference % 60000) / 1000);
        setTimeLeft(`${minutes}:${seconds.toString().padStart(2, "0")}`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [qrData, isLoading]);

  const stopGeneration = async () => {
    try {
      await apiClient.post("/admin/qr-codes/stop");
      navigate("/dashboard");
    } catch (err) {
      setError("Failed to stop session");
      console.error("Error stopping:", err);
    }
  };

  // 4. Handle Loading and Error states gracefully
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <p className="text-xl text-blue-600 font-semibold">
          Loading current QR Code session...
        </p>
      </div>
    );
  }

  if (!qrData) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        {error ? (
          <div className="text-center p-8 bg-white rounded-lg shadow-xl">
            <p className="text-red-600 text-lg mb-4">{error}</p>
            <button
              onClick={() => navigate("/dashboard")}
              className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
            >
              Go to Dashboard
            </button>
          </div>
        ) : (
          <p className="text-xl text-gray-600">
            No active QR Code session found. Please start one from the
            dashboard.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full">
        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
            {error}
          </div>
        )}
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">Attendance Check-In</h1>
          <p className="text-gray-600 mb-6">
            Scan the QR code to mark your attendance
          </p>

          {/* QR Code Image */}
          <div className="flex justify-center mb-6">
            <img
              src={qrData.qrCodeImage}
              alt="QR Code"
              className="w-80 h-80 border-4 border-blue-500 rounded-lg shadow-lg"
            />
          </div>

          {/* Timer */}
          <div className="mb-6">
            <p className="text-lg font-semibold text-gray-700">
              New code in:{" "}
              <span className="text-blue-600 text-2xl">{timeLeft}</span>
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Total Scans</p>
              <p className="text-2xl font-bold text-blue-600">
                {qrData.scanCount}
              </p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Radius</p>
              <p className="text-2xl font-bold text-green-600">
                {qrData.radiusMeters}m
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4 justify-center">
            <button
              onClick={stopGeneration}
              className="bg-red-500 hover:bg-red-600 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
            >
              Stop Session
            </button>
            <button
              onClick={() => navigate("/dashboard")}
              className="bg-gray-500 hover:bg-gray-600 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default QRDisplayPage;
