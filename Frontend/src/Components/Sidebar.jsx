import React, { useState } from "react";
import {
  FaHome,
  FaUsers,
  FaInbox,
  FaBars,
  FaTimes,
  FaShieldAlt,
  FaInfoCircle,
  FaSitemap,
  FaCalendar,
  FaBriefcase,
  FaDollarSign,
  FaBook,
  FaImage,
  FaVideo,
  FaTruck,
  FaBuilding,
  FaChevronDown,
  FaChevronRight,
  FaEdit,
  FaEye,
  FaGlobe,
  FaUserCheck,
  FaPlay,
  FaComments,
  FaArchive,
  FaCog,
  FaHourglassHalf, // New Icon
  FaFileAlt,
  FaChartBar,
} from "react-icons/fa";

const Sidebar = ({
  isOpen,
  activeTab,
  onTabChange,
  isExpanded,
  setIsExpanded,
}) => {
  const [expandedSections, setExpandedSections] = useState({ pending: true }); // Keep pending open by default

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: FaHome },
    { id: "master", label: "Master Destination", icon: FaSitemap },
    {
      id: "party",
      label: "Party Management",
      icon: FaUserCheck,
      subItems: [
        { id: "add-party", label: "Add Party", icon: FaEdit },
        { id: "list-party", label: "Party List", icon: FaBuilding },
      ],
    },
    {
      id: "vehicle",
      label: "Vehicle",
      icon: FaArchive,
      subItems: [
        { id: "add-vehicle", label: "Add Vehicle", icon: FaEdit },
        { id: "list-vehicle", label: "Vehicle List", icon: FaBriefcase },
      ],
    },
    {
      id: "booking",
      label: "Booking",
      icon: FaBook,
      subItems: [
        { id: "add-booking", label: "Add Booking", icon: FaEdit },
        { id: "list-booking", label: "Booking List", icon: FaBriefcase },
      ],
    },
    // --- NEW SECTION ---
    {
      id: "pending",
      label: "Pending Actions",
      icon: FaHourglassHalf,
      subItems: [
        { id: "party-pending", label: "Party Payments", icon: FaDollarSign },
        { id: "vehicle-pending", label: "Vehicle Payments", icon: FaTruck },
        { id: "delivery-pending", label: "Update Delivery", icon: FaCalendar },
      ],
    },
    // --- REPORTS SECTION ---
    {
      id: "reports",
      label: "Reports",
      icon: FaChartBar,
      subItems: [
        { id: "ledger-report", label: "Ledger Report", icon: FaFileAlt },
        { id: "vehicle-report", label: "Vehicle Report", icon: FaTruck },
      ],
    },
    // --- END NEW SECTION ---
  ];

  const toggleExpanded = () => setIsExpanded(!isExpanded);

  const toggleSection = (sectionId) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  const handleItemClick = (itemId) => {
    const mainSection = menuItems.find((item) => item.id === itemId);
    if (mainSection?.subItems) toggleSection(itemId);
    onTabChange(itemId);
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-30 md:hidden"
          style={{ zIndex: 9998 }}
          onClick={() => onTabChange(activeTab)}
        />
      )}

      <div
        className={`fixed top-16 left-0 h-[calc(100vh-4rem)] bg-gray-850 transform transition-all duration-300 shadow-lg
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0
          ${isExpanded ? "w-72" : "w-20"}
          flex flex-col
        `}
        style={{ zIndex: 9999 }}
      >
        <header className="flex flex-col gap-3 p-4 border-b border-gray-700">
          <div className="flex justify-end">
            <button
              onClick={toggleExpanded}
              className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-700 transition-colors duration-200 text-white"
            >
              {isExpanded ? <FaTimes size={18} /> : <FaBars size={18} />}
            </button>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div
              className={`flex items-center justify-center rounded-lg overflow-hidden transition-all duration-300
                ${isExpanded ? "w-[100px] h-[100px]" : "w-10 h-10"}
              `}
            >
              <img
                src="logo.jpg"
                alt="Logo"
                className="object-contain max-w-full max-h-full"
              />
            </div>
            {isExpanded && (
              <div className="text-center transition-opacity duration-300 delay-200">
                <p className="text-gray-200 font-medium text-sm">Admin Panel</p>
                <p className="text-gray-400 text-xs font-medium">
                  Content Management
                </p>
              </div>
            )}
          </div>
        </header>

        <nav className="flex-1 overflow-y-auto px-3 pb-4 mt-2 scrollbar-none">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              activeTab === item.id ||
              (item.subItems &&
                item.subItems.some((sub) => sub.id === activeTab));
            const isSectionExpanded = expandedSections[item.id];

            return (
              <div key={item.id} className="flex flex-col">
                <button
                  onClick={() => handleItemClick(item.id)}
                  className={`flex items-center gap-2 h-10 px-2 rounded-lg transition-all duration-200 group text-left w-full
                    ${
                      isActive
                        ? "bg-blue-600 text-white"
                        : "hover:bg-gray-800 text-gray-300"
                    }
                    ${!isExpanded ? "justify-center" : ""}
                  `}
                >
                  <div className="w-5 h-5 flex items-center justify-center">
                    <Icon
                      size={18}
                      className={`${
                        isActive
                          ? "text-white"
                          : "text-gray-400 group-hover:text-blue-500"
                      }`}
                    />
                  </div>
                  {isExpanded && (
                    <>
                      <span
                        className={`text-sm font-medium flex-1 ${
                          isActive
                            ? "text-white"
                            : "text-gray-300 group-hover:text-white"
                        }`}
                      >
                        {item.label}
                      </span>
                      {item.subItems && (
                        <div className="w-4 h-4 flex items-center justify-center">
                          {isSectionExpanded ? (
                            <FaChevronDown
                              size={14}
                              className="text-gray-300"
                            />
                          ) : (
                            <FaChevronRight
                              size={14}
                              className="text-gray-300"
                            />
                          )}
                        </div>
                      )}
                    </>
                  )}
                </button>

                {item.subItems && isSectionExpanded && isExpanded && (
                  <div className="ml-4 mt-1 border-l border-gray-700 pl-4">
                    {item.subItems.map((subItem) => {
                      const SubIcon = subItem.icon;
                      const isSubActive = activeTab === subItem.id;

                      return (
                        <button
                          key={subItem.id}
                          onClick={() => onTabChange(subItem.id)}
                          className={`flex items-center gap-2 h-8 px-2 rounded-md transition-all duration-200 group text-left w-full mb-1
                            ${
                              isSubActive
                                ? "bg-blue-700 text-white"
                                : "hover:bg-gray-800 text-gray-400"
                            }
                          `}
                        >
                          <div className="w-4 h-4 flex items-center justify-center">
                            <SubIcon
                              size={14}
                              className={`${
                                isSubActive
                                  ? "text-white"
                                  : "text-gray-400 group-hover:text-blue-500"
                              }`}
                            />
                          </div>
                          <span
                            className={`text-xs font-medium ${
                              isSubActive
                                ? "text-white"
                                : "text-gray-300 group-hover:text-white"
                            }`}
                          >
                            {subItem.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>
    </>
  );
};

export default Sidebar;
