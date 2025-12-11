import React from "react";

const EditOrganisationModal = ({
  showEditOrgModal,
  setShowEditOrgModal,
  editOrgForm,
  setEditOrgForm,
  handleEditOrganisation,
  loading,
  onCaptureLocation,
}) => {
  if (!showEditOrgModal) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000]">
      <div className="bg-white rounded-xl p-8 shadow-2xl max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-gray-800">
            Edit Organisation
          </h3>
          <button
            onClick={() => setShowEditOrgModal(false)}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleEditOrganisation} className="space-y-4">
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Organisation Name
            </label>
            <input
              type="text"
              value={editOrgForm.name}
              onChange={(e) =>
                setEditOrgForm({
                  ...editOrgForm,
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
              value={editOrgForm.location}
              onChange={(e) =>
                setEditOrgForm({
                  ...editOrgForm,
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
              value={editOrgForm.contactEmail}
              onChange={(e) =>
                setEditOrgForm({
                  ...editOrgForm,
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
              value={editOrgForm.contactPhone}
              onChange={(e) =>
                setEditOrgForm({
                  ...editOrgForm,
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
                <p className="text-gray-800 font-semibold">Office Coordinates</p>
                <p className="text-sm text-gray-600">
                  Update the precise latitude and longitude for this office.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onCaptureLocation && onCaptureLocation(setEditOrgForm)}
                className="px-4 py-2 rounded-lg bg-white text-blue-600 border border-blue-200 hover:bg-blue-100 transition-colors text-sm font-semibold"
              >
                Use Current Location
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="number"
                step="0.000001"
                value={editOrgForm.latitude}
                onChange={(e) =>
                  setEditOrgForm((prev) => ({
                    ...prev,
                    latitude: e.target.value,
                  }))
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Latitude"
              />
              <input
                type="number"
                step="0.000001"
                value={editOrgForm.longitude}
                onChange={(e) =>
                  setEditOrgForm((prev) => ({
                    ...prev,
                    longitude: e.target.value,
                  }))
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Longitude"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => setShowEditOrgModal(false)}
              className="flex-1 bg-gray-200 text-gray-700 py-3 px-6 rounded-lg font-medium hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3 px-6 rounded-lg font-medium hover:shadow-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Updating..." : "Update Organisation"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditOrganisationModal;
