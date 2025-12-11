import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faQrcode,
  faGear,
  faGears,
  faClock,
} from "@fortawesome/free-solid-svg-icons";

const Sidebar = ({
  isOpen,
  toggleSidebar,
  activeTab,
  setActiveTab,
  activeSubTab,
  setActiveSubTab,
}) => {
  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: "📊" },
    {
      id: "users",
      label: "Users",
      icon: "👥",
      subTabs: [
        { id: "admin", label: "Admin" },
        { id: "users", label: "Users" },
      ],
    },
    { id: "attendance", label: "Attendance", icon: "📅" },
    { id: "reports", label: "Reports", icon: "📈" },
    {
      id: "qr-codes",
      label: "QR Codes",
      icon: <FontAwesomeIcon icon={faQrcode} />,
    },
    {
      id: "settings",
      label: "Settings",
      icon: <FontAwesomeIcon icon={faGear} style={{ color: "#1f2951" }} />,
      subTabs: [
        {
          id: "editInfo",
          label: "Edit Organisation Info",
          icon: <FontAwesomeIcon icon={faGears} style={{ color: "#4a6187" }} />,
        },
        {
          id: "editWorkTime",
          label: "Edit Work Time",
          icon: <FontAwesomeIcon icon={faClock} />,
        },
      ],
    },
  ];

  return (
    <>
      {/* Overlay for all devices */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={toggleSidebar}
        ></div>
      )}

      {/* Sidebar */}
      <div
        className={`fixed left-0 top-0 h-full bg-white shadow-lg z-50 transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } w-64`}
      >
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-800">Admin Panel</h2>
        </div>

        <nav className="p-4">
          <ul className="space-y-2">
            {tabs.map((tab) => (
              <li key={tab.id}>
                <button
                  onClick={() => {
                    setActiveTab(tab.id);
                    if (tab.subTabs) {
                      setActiveSubTab(tab.subTabs[0].id);
                    }
                  }}
                  className={`w-full text-left px-4 py-2 rounded-lg transition-colors duration-200 flex items-center ${
                    activeTab === tab.id
                      ? "bg-blue-100 text-blue-700"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <span className="mr-3">{tab.icon}</span>
                  {tab.label}
                </button>

                {/* Sub-tabs for Users */}
                {tab.id === "users" && activeTab === "users" && tab.subTabs && (
                  <ul className="ml-8 mt-2 space-y-1">
                    {tab.subTabs.map((subTab) => (
                      <li key={subTab.id}>
                        <button
                          onClick={() => setActiveSubTab(subTab.id)}
                          className={`w-full text-left px-4 py-2 rounded-lg transition-colors duration-200 text-sm ${
                            activeSubTab === subTab.id
                              ? "bg-blue-50 text-blue-600"
                              : "text-gray-600 hover:bg-gray-50"
                          }`}
                        >
                          {subTab.label}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                {tab.id === "settings" &&
                  activeTab === "settings" &&
                  tab.subTabs && (
                    <ul className="ml-8 mt-2 space-y-1">
                      {tab.subTabs.map((subTab) => (
                        <li key={subTab.id}>
                          <button
                            onClick={() => setActiveSubTab(subTab.id)}
                            className={`w-full text-left px-4 py-2 rounded-lg transition-colors duration-200 text-sm ${
                              activeSubTab === subTab.id
                                ? "bg-blue-50 text-blue-600"
                                : "text-gray-600 hover:bg-gray-50"
                            }`}
                          >
                            {subTab.label}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </>
  );
};

export default Sidebar;
