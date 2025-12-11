// src/components/user/CheckInModal.jsx
import { useEffect, useRef, useState, Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { Html5Qrcode } from "html5-qrcode";
import "./CheckInModal.css";

const CheckInModal = ({ isOpen, onClose, onCheckIn, loading }) => {
  const [qrData, setQrData] = useState(null);
  const [error, setError] = useState(null);
  const scannerRef = useRef(null);
  const html5QrCodeRef = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      setQrData(null);
      setError(null);
      if (html5QrCodeRef.current) {
        html5QrCodeRef.current.stop().catch(() => {});
        html5QrCodeRef.current = null;
      }
      return;
    }

    // Wait for DOM to render #qr-reader
    const startScanner = () => {
      const element = document.getElementById("qr-reader");
      if (!element) {
        // Not in DOM yet — try again next frame
        requestAnimationFrame(startScanner);
        return;
      }

      const config = { fps: 10, qrbox: { width: 250, height: 250 } };
      const html5QrCode = new Html5Qrcode("qr-reader");

      const onScanSuccess = (decodedText) => {
        console.log("QR Code scanned:", decodedText);
        setQrData(decodedText);
        setError(null);
        if (html5QrCodeRef.current) {
          html5QrCodeRef.current.stop().catch(() => {});
        }
      };

      const onScanError = (err) => {
        console.warn("QR Scan Error:", err);
        // Don't set error for every scan attempt, only for critical issues
      };

      html5QrCode
        .start(
          { facingMode: "environment" },
          config,
          onScanSuccess,
          onScanError
        )
        .then(() => {
          html5QrCodeRef.current = html5QrCode;
        })
        .catch((err) => {
          setError("Camera access denied. Please enable camera permissions.");
          console.error(err);
        });
    };

    // Start after a tiny delay
    const timeoutId = setTimeout(startScanner, 100);

    return () => {
      if (html5QrCodeRef.current) {
        html5QrCodeRef.current
          .stop()
          .then(() => console.log("Scanner stopped cleanly"))
          .catch(() => {})
          .finally(() => {
            html5QrCodeRef.current = null;
          });
      }
    };
  }, [isOpen]);

  const handleCheckIn = async () => {
    if (!qrData) return;

    try {
      await onCheckIn(qrData); // Wait for API call to complete
      // Modal will be closed by parent component on success
    } catch (error) {
      // Error is already shown by parent, just keep modal open
      setError(error.message || "Check-in failed. Please try again.");
    }
  };

  const resetAndClose = () => {
    setQrData(null);
    setError(null);
    onClose();
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={resetAndClose}>
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
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="modal-content w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all dark:bg-gray-800">
                <Dialog.Title as="div" className="modal-header">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    Check In with QR Code
                  </h3>
                  <button onClick={resetAndClose} className="close-button">
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </Dialog.Title>

                <div className="modal-body mt-4">
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    Scan the QR code to check in. Make sure you're within the
                    allowed location radius.
                  </p>

                  {/* This MUST have id="qr-reader" */}
                  <div className="qr-reader-container">
                    <div id="qr-reader" className="w-full" />
                  </div>

                  {qrData && (
                    <div className="mt-4 p-3 bg-green-100 dark:bg-green-900 border border-green-400 dark:border-green-700 rounded">
                      <p className="text-green-700 dark:text-green-300 font-semibold">
                        ✓ QR Code Scanned Successfully!
                      </p>
                      <p className="text-sm text-green-600 dark:text-green-400 break-all mt-1">
                        Code: {qrData}
                      </p>
                      <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                        📍 When you confirm, we will automatically capture your GPS location.
                      </p>
                    </div>
                  )}

                  {error && (
                    <div className="mt-4 p-3 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 rounded">
                      <p className="text-red-700 dark:text-red-300 font-semibold">
                        ⚠ Error
                      </p>
                      <p className="text-sm text-red-600 dark:text-red-400">
                        {error}
                      </p>
                    </div>
                  )}

                  <div className="modal-actions mt-6">
                    <button
                      onClick={handleCheckIn}
                      disabled={!qrData || loading}
                      className="check-in-button"
                    >
                      {loading ? "Checking In..." : "Confirm Check In"}
                    </button>
                    <button onClick={resetAndClose} className="cancel-button">
                      Cancel
                    </button>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default CheckInModal;
