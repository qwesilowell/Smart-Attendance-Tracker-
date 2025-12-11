import { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";

const variantStyles = {
  success: {
    bg: "bg-green-100",
    text: "text-green-800",
    iconBg: "bg-green-200",
    icon: "✅",
  },
  error: {
    bg: "bg-red-100",
    text: "text-red-800",
    iconBg: "bg-red-200",
    icon: "⚠️",
  },
};

const StatusModal = ({
  open,
  onClose,
  title,
  message,
  variant = "error",
}) => {
  const styles = variantStyles[variant] || variantStyles.error;

  return (
    <Transition show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/40" />
        </Transition.Child>

        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <Dialog.Panel
              className={`w-full max-w-md rounded-2xl p-6 shadow-2xl ${styles.bg} ${styles.text}`}
            >
              <div className="flex items-center gap-4">
                <div
                  className={`w-14 h-14 rounded-full flex items-center justify-center text-3xl ${styles.iconBg}`}
                >
                  {styles.icon}
                </div>
                <div>
                  <Dialog.Title className="text-xl font-semibold">
                    {title}
                  </Dialog.Title>
                  <p className="mt-2 text-sm">{message}</p>
                </div>
              </div>
              <div className="mt-6 text-right">
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg bg-white/70 text-sm font-semibold hover:bg-white transition-colors"
                >
                  Close
                </button>
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
};

export default StatusModal;

