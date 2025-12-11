import { useEffect, useRef, useState, Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { Html5Qrcode } from "html5-qrcode";
import "./AdminCheckInModal.css";

const AdminCheckInModal = ({ isOpen, onClose, onCheckIn, loading }) => {
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

    // Wait for DOM to render #admin-qr-reader
    const startScanner = () => {
      const element = document.getElementById("admin-qr-reader");
      if (!element) {
        // Not in DOM yet — try again next frame
        requestAnimationFrame(startScanner);
        return;
      }

      const config = { fps: 10, qrbox: { width: 250, height: 250 } };
      const html5QrCode = new Html5Qrcode("admin-qr-reader");

      const onScanSuccess = (decodedText) => {
        setQrData(decodedText);
        setError(null);
        html5QrCode.stop();
      };

      const onScanError = (err) => {
        console.warn("QR Scan Error:", err);
        if (!qrData) setError("Camera not available.");
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
          setError("Camera access denied.");
          console.error(err);
        });
    };

    // Start after a tiny delay
    const timeoutId = setTimeout(startScanner, 100);

    return () => {
      clearTimeout(timeoutId);
      if (html5QrCodeRef.current) {
        html5QrCodeRef.current.stop().catch(() => {});
        html5QrCodeRef.current = null;
      }
    };
  }, [isOpen]);

  const handleCheckIn = () => {
    if (qrData) onCheckIn(qrData);
    onClose();
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
              <Dialog.Panel className="modal-content w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title as="div" className="modal-header">
                  <h3 className="text-xl font-bold text-gray-900">
                    Admin Check In with QR Code
                  </h3>
                  <button onClick={resetAndClose} className="close-button">
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </Dialog.Title>

                <div className="modal-body mt-4">
                  <p className="text-gray-600 mb-4">
                    Scan the QR code to check in as admin.
                  </p>

                  {/* This MUST have id="admin-qr-reader" */}
                  <div className="qr-reader-container">
                    <div id="admin-qr-reader" className="w-full" />
                  </div>

                  {qrData && (
                    <div className="mt-4 p-3 bg-green-100 border border-green-400 rounded">
                      <p className="text-green-700 font-semibold">
                        QR Code Scanned!
                      </p>
                      <p className="text-sm text-green-600 break-all">
                        {qrData}
                      </p>
                    </div>
                  )}

                  {error && (
                    <div className="mt-4 p-3 bg-red-100 border border-red-400 rounded">
                      <p className="text-red-700 font-semibold">Error</p>
                      <p className="text-sm text-red-600">{error}</p>
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

export default AdminCheckInModal;
