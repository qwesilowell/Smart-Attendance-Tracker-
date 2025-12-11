import { useState, Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import "./AdminCheckOutModal.css";

const AdminCheckOutModal = ({
  isOpen,
  onClose,
  onCheckOut,
  loading = false,
}) => {
  const [confirmation, setConfirmation] = useState("");

  const handleCheckOut = () => {
    if (confirmation.toLowerCase() === "confirm") {
      onCheckOut();
      onClose();
      setConfirmation("");
    } else {
      alert('Please type "confirm" to proceed with check-out.');
    }
  };

  const resetAndClose = () => {
    setConfirmation("");
    onClose();
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={resetAndClose}>
        {/* Overlay */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-75" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="checkout-modal w-full max-w-sm transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title
                  as="div"
                  className="flex justify-between items-center mb-4"
                >
                  <h3 className="text-xl font-semibold text-gray-900">
                    Admin Confirm Check-Out
                  </h3>
                  <button
                    onClick={resetAndClose}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </Dialog.Title>

                <p className="text-gray-700 mb-4">
                  To finalize your check-out, type <strong>confirm</strong>{" "}
                  below.
                </p>

                <input
                  type="text"
                  value={confirmation}
                  onChange={(e) => setConfirmation(e.target.value)}
                  placeholder="confirm"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={loading}
                  autoFocus
                />

                <div className="mt-6 flex justify-end gap-3">
                  <button
                    onClick={resetAndClose}
                    disabled={loading}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition disabled:opacity-50"
                  >
                    Cancel
                  </button>

                  <button
                    onClick={handleCheckOut}
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-2"
                  >
                    {loading ? (
                      <>
                        <svg
                          className="animate-spin h-4 w-4"
                          viewBox="0 0 24 24"
                          aria-hidden="true"
                        >
                          <circle
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="none"
                          />
                        </svg>
                        Checking out…
                      </>
                    ) : (
                      "Check Out"
                    )}
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default AdminCheckOutModal;
