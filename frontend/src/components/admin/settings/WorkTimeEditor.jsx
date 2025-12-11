// src/components/admin/settings/WorkTimeEditor.jsx

import React, { useState, useEffect } from "react";
import EditWorkTimeModal from "./EditWorkTimeModal.jsx";
import apiClient from "../../../api/axios";
import { toast } from "react-toastify";

const WorkTimeEditor = ({ organizationId }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  // State to hold the current time fetched from the database
  const [currentStartTime, setCurrentStartTime] = useState("N/A");
  const [loading, setLoading] = useState(true);

  // --- Data Fetching Logic (GET Request) ---
  const fetchCurrentTime = async () => {
    if (!organizationId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const response = await apiClient.get(
        `/organisations/worktime/${organizationId}`
      );
      // Time string format: "HH:MM:SS". Extract HH:MM for display
      const timeString = response.data.substring(0, 5);
      setCurrentStartTime(timeString);
    } catch (error) {
      console.error("Error fetching start time:", error);
      // Default to N/A or the backend default (08:15) if fetch fails
      setCurrentStartTime("08:15");
      toast.error("Failed to load current work time settings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentTime();
  }, [organizationId]);

  // --- Success Handler ---
  // Function passed to the modal to update state after a successful PUT request
  const handleTimeUpdateSuccess = (newTime) => {
    setCurrentStartTime(newTime);
    setIsModalOpen(false); // Close the modal
  };

  return (
    <div className="bg-white rounded-lg shadow-xl p-8">
      <h3 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-3">
        Work Start Time Configuration ⏰
      </h3>

      <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-gray-50 mb-6">
        <div>
          <p className="text-lg font-medium text-gray-700">
            Required Employee Check-in Time:
          </p>
          {loading ? (
            <p className="text-3xl font-bold text-gray-400">Loading...</p>
          ) : (
            <p className="text-3xl font-bold text-blue-600">
              {currentStartTime}
            </p>
          )}
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg transition-colors font-semibold shadow-md"
          disabled={loading}
        >
          Change Start Time
        </button>
      </div>

      <p className="text-sm text-gray-600 mt-4">
        This setting is used to calculate punctuality and determine "Late"
        arrivals in the attendance reports.
      </p>

      {/* The Modal */}
      <EditWorkTimeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onUpdate={handleTimeUpdateSuccess}
        initialTime={currentStartTime}
        organizationId={organizationId}
      />
    </div>
  );
};

export default WorkTimeEditor;
