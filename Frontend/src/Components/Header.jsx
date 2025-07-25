import React, { useState, useRef, useEffect } from "react";
import {
  FaBars,
  FaTimes,
  FaBell,
  FaUser,
  FaSignOutAlt,
  FaChevronDown,
  FaExclamationTriangle,
  FaInfoCircle,
  FaCheckCircle,
  FaTimes as FaTimesIcon,
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { fetchProfile } from "../Store/Slices/profileSlice";
import { generateNotifications, markAsRead, markAllAsRead, removeNotification } from "../Store/Slices/notificationSlice";
import useRealTimeUpdates from "../hooks/useRealTimeUpdates";

const API = import.meta.env.VITE_API_URL;

const Header = ({ onToggleSidebar, isSidebarOpen, onProfileClick }) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  const profileRef = useRef(null);
  const notificationRef = useRef(null);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { user, status } = useSelector((state) => state.profile);
  const { notifications, unreadCount } = useSelector((state) => state.notification);
  
  // Use real-time updates hook for notifications (update every 5 minutes)
  useRealTimeUpdates(5);

  useEffect(() => {
    if (!user && status !== "loading") {
      dispatch(fetchProfile());
    }
  }, [user, status, dispatch]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/tatto/admin/login");
  };

  const handleNotificationClick = (notification) => {
    if (!notification.read) {
      dispatch(markAsRead(notification.id));
    }
    // Navigate to relevant page based on notification type
    if (notification.bookingId) {
      navigate(`/admin/bookings`);
    }
  };

  const handleMarkAllAsRead = () => {
    dispatch(markAllAsRead());
  };

  const handleRemoveNotification = (e, notificationId) => {
    e.stopPropagation();
    dispatch(removeNotification(notificationId));
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'warning':
        return <FaExclamationTriangle className="text-yellow-500" />;
      case 'error':
        return <FaExclamationTriangle className="text-red-500" />;
      case 'success':
        return <FaCheckCircle className="text-green-500" />;
      default:
        return <FaInfoCircle className="text-blue-500" />;
    }
  };

  const getNotificationColor = (type, priority) => {
    if (priority === 'high') return 'border-l-red-500';
    switch (type) {
      case 'warning':
        return 'border-l-yellow-500';
      case 'error':
        return 'border-l-red-500';
      case 'success':
        return 'border-l-green-500';
      default:
        return 'border-l-blue-500';
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setIsNotificationOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const dropdownVariants = {
    hidden: { opacity: 0, y: -5 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.2, ease: "easeOut" },
    },
    exit: { opacity: 0, y: -5, transition: { duration: 0.15, ease: "easeIn" } },
  };

  return (
    <motion.header
      initial={{ y: -5, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="bg-gray-900 shadow-md border-b border-gray-700 h-16 flex items-center justify-between px-2 sm:px-4 sticky top-0 z-40"
    >
      {/* Left Section */}
      <div className="flex items-center space-x-2 sm:space-x-4">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 transition duration-200 focus:outline-none md:hidden"
        >
          {isSidebarOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
        </button>

        <motion.a
          href="/dashboard"
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="hidden sm:block text-lg md:text-xl font-bold truncate bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent hover:underline"
        >
          Nashik Haridwar Tempo Services
        </motion.a>
      </div>

      {/* Center - Mobile Title */}
      <h1 className="block sm:hidden text-base font-bold text-white truncate">
        NHTS Admin
      </h1>

      {/* Right Section */}
      <div className="flex items-center space-x-2 md:space-x-4">
        {/* Notifications */}
        <div className="relative" ref={notificationRef}>
          <button
            onClick={() => setIsNotificationOpen(!isNotificationOpen)}
            className="p-2 rounded-full bg-gray-800 hover:bg-gray-700 text-gray-300 relative"
          >
            <FaBell size={18} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center text-[10px]">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          <AnimatePresence>
            {isNotificationOpen && (
              <motion.div
                variants={dropdownVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="absolute right-0 mt-2 w-80 bg-gray-800 rounded-md shadow-lg z-50 border border-gray-600"
              >
                <div className="p-3 border-b border-gray-700 flex justify-between items-center">
                  <h3 className="text-sm font-semibold text-white">Notifications</h3>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllAsRead}
                      className="text-xs text-blue-400 hover:text-blue-300"
                    >
                      Mark all as read
                    </button>
                  )}
                </div>
                {notifications.length === 0 ? (
                  <p className="p-4 text-gray-400 text-sm text-center">No notifications</p>
                ) : (
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.slice(0, 10).map((notification) => (
                      <div
                        key={notification.id}
                        onClick={() => handleNotificationClick(notification)}
                        className={`notification-item p-3 border-l-4 ${getNotificationColor(notification.type, notification.priority)} hover:bg-gray-700 cursor-pointer transition-colors ${
                          !notification.read ? 'bg-gray-750' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-2 flex-1">
                            <div className="mt-0.5">
                              {getNotificationIcon(notification.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <p className={`text-sm font-medium ${!notification.read ? 'text-white' : 'text-gray-300'}`}>
                                  {notification.title}
                                </p>
                                {!notification.read && (
                                  <div className="w-2 h-2 bg-blue-500 rounded-full ml-2"></div>
                                )}
                              </div>
                              <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                                {notification.message}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                {new Date(notification.timestamp).toLocaleString()}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={(e) => handleRemoveNotification(e, notification.id)}
                            className="notification-remove ml-2 p-1 text-gray-500 hover:text-gray-300 transition-opacity"
                          >
                            <FaTimesIcon size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Profile Dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center space-x-2 p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-white"
          >
            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gray-600 rounded-full overflow-hidden flex items-center justify-center">
              {user?.profileImage ? (
                <img
                  src={`${API}${user.profileImage}`}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <FaUser size={14} className="text-white" />
              )}
            </div>

            <span className="hidden lg:block text-sm font-medium max-w-24 truncate">
              {user?.name || "Loading..."}
            </span>

            <FaChevronDown
              size={14}
              className={`hidden sm:block text-gray-400 transition-transform duration-200 ${
                isProfileOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          <AnimatePresence>
            {isProfileOpen && (
              <motion.div
                variants={dropdownVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="absolute right-0 mt-2 w-44 sm:w-48 bg-gray-800 rounded-md shadow-lg py-1 z-50 border border-gray-600"
              >
                <div className="px-4 py-2 border-b border-gray-700">
                  <p className="text-sm font-bold text-white truncate">
                    {user?.name || "Admin"}
                  </p>
                  <p className="text-xs text-gray-400 truncate">
                    {user?.username || "admin@example.com"}
                  </p>
                </div>

                <button
                  onClick={() => onProfileClick("edit-profile")}
                  className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 transition flex items-center"
                >
                  <FaUser size={14} className="mr-2 text-blue-400" />
                  Edit Profile
                </button>

                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-gray-700 transition flex items-center"
                >
                  <FaSignOutAlt size={14} className="mr-2 text-red-400" />
                  Sign out
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.header>
  );
};

export default Header;
