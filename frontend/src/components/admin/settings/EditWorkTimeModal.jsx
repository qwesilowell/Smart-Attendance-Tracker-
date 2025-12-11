import React, { useState, useEffect } from "react";
import apiClient from "../../../api/axios"; // Adjust path as necessary
import { toast } from "react-toastify";

const EditWorkTimeModal = ({
  isOpen,
  onClose,
  onUpdate,
  initialTime,
  organizationId,
}) => {
  // State for the time input field
  const [newTime, setNewTime] = useState("");
  const [loading, setLoading] = useState(false);

  // Set the input field's value when the modal opens or initialTime changes
  useEffect(() => {
    if (isOpen && initialTime && initialTime !== "N/A") {
      setNewTime(initialTime);
    } else if (isOpen) {
      // Default to a sensible time if initialTime is unavailable
      setNewTime("08:00");
    }
  }, [isOpen, initialTime]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);

    // The backend expects a LocalTime string (HH:MM:SS), so we append :00
    const timePayload = `${newTime}:00`;

    try {
      await apiClient.put(
        `/organisations/worktime/${organizationId}`,
        timePayload
      );

      toast.success(`Work start time successfully updated to ${newTime}`);

      onUpdate(newTime);
    } catch (error) {
      console.error("Error updating start time:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to update work time.";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md p-6">
        <h4 className="text-xl font-semibold mb-4 border-b pb-2">
          Edit Company Start Time ⏰
        </h4>

        <form onSubmit={handleUpdate}>
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">Current Start Time:</p>
            <p className="text-3xl font-bold text-blue-600">{initialTime}</p>
          </div>

          <div className="mb-6">
            <label
              className="block text-sm font-medium text-gray-700 mb-2"
              htmlFor="new-start-time"
            >
              Set New Start Time (HH:MM)
            </label>
            <input
              id="new-start-time"
              type="time"
              value={newTime}
              onChange={(e) => setNewTime(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-lg focus:ring-blue-500 focus:border-blue-500"
              disabled={loading}
            />
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
              disabled={loading || newTime === initialTime}
            >
              {loading ? "Updating..." : "Update Time"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditWorkTimeModal;
