import React, { useState, useRef, useEffect } from "react";
import { FaSave, FaUserCircle, FaCheck, FaTimes } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import { fetchProfile, updateProfile } from "../Store/Slices/profileSlice";

const API = import.meta.env.VITE_API_URL;

const ProfileEditPage = () => {
  const dispatch = useDispatch();
  const { user, status } = useSelector((state) => state.profile);

  const [formData, setFormData] = useState({
    name: "",
    gstNumber: "",
    description: "",
    profileImage: null,
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [preview, setPreview] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const [isProfileChanged, setIsProfileChanged] = useState(false);
  const [isPasswordChanged, setIsPasswordChanged] = useState(false);
  const fileInputRef = useRef(null);

  // ---------------- Notification ----------------
  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  // ---------------- Load Profile ----------------
  useEffect(() => {
    if (!user) {
      dispatch(fetchProfile());
    }
  }, [user, dispatch]);

  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        name: user.name || "",
        gstNumber: user.gstNumber || "",
        description: user.description || "",
        profileImage: null,
      }));

      if (user.profileImage) {
        setPreview(
          user.profileImage.startsWith("http")
            ? user.profileImage
            : `${API}${user.profileImage}`
        );
      }
    }
  }, [user]);

  // ---------------- Input Handlers ----------------
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Track profile vs password changes
    if (["name", "gstNumber", "description"].includes(name)) {
      setIsProfileChanged(true);
    } else if (["oldPassword", "newPassword", "confirmPassword"].includes(name)) {
      setIsPasswordChanged(true);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({ ...prev, profileImage: file }));
      setPreview(URL.createObjectURL(file));
      setIsProfileChanged(true);
    }
  };

  // ---------------- Save Profile ----------------
  const handleProfileUpdate = async () => {
    setIsLoading(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append("name", formData.name);
      formDataToSend.append("gstNumber", formData.gstNumber);
      formDataToSend.append("description", formData.description);
      if (formData.profileImage) {
        formDataToSend.append("profileImage", formData.profileImage);
      }

      await dispatch(updateProfile(formDataToSend)).unwrap();
      setIsProfileChanged(false);
      showNotification("success", "Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      showNotification("error", "Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  // ---------------- Save Password ----------------
  const handlePasswordUpdate = async () => {
    if (!formData.oldPassword || !formData.newPassword || !formData.confirmPassword) {
      showNotification("error", "Please fill in all password fields.");
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      showNotification("error", "New passwords do not match!");
      return;
    }

    setIsLoading(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append("oldPassword", formData.oldPassword);
      formDataToSend.append("newPassword", formData.newPassword);

      await dispatch(updateProfile(formDataToSend)).unwrap();
      setFormData((prev) => ({
        ...prev,
        oldPassword: "",
        newPassword: "",
        confirmPassword: "",
      }));
      setIsPasswordChanged(false);
      showNotification("success", "Password updated successfully!");
    } catch (error) {
      console.error("Error updating password:", error);
      showNotification("error", "Failed to update password");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full bg-gray-800 text-white">
      {/* Notification */}
      {notification && (
        <div
          className={`fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 flex items-center space-x-2 ${
            notification.type === "success" ? "bg-green-600" : "bg-red-600"
          }`}
        >
          {notification.type === "success" ? (
            <FaCheck className="text-white" />
          ) : (
            <FaTimes className="text-white" />
          )}
          <span className="text-white font-medium">{notification.message}</span>
        </div>
      )}

      <div className="p-6 h-full overflow-y-auto space-y-6">
        <h2 className="text-2xl font-bold text-gray-100">Profile Settings</h2>

        {/* Profile Section */}
        <div className="bg-gray-700/50 backdrop-blur-sm rounded-xl p-4 border border-gray-600/30 space-y-4">
          {/* Profile Image */}
          <div className="flex items-center justify-center space-x-4">
            <div className="relative">
              <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-600 flex items-center justify-center ring-4 ring-gray-600/50">
                {preview ? (
                  <img
                    src={preview}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <FaUserCircle className="w-16 h-16 text-gray-400" />
                )}
              </div>
              <button
                className="absolute -bottom-2 -right-2 w-8 h-8 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center transition"
                onClick={() => fileInputRef.current.click()}
              >
                <FaSave className="w-3 h-3" />
              </button>
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>
          </div>

          {/* Profile Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full bg-gray-800 border border-gray-600 px-3 py-2 rounded-lg text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                GST Number <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                name="gstNumber"
                value={formData.gstNumber}
                onChange={handleInputChange}
                className="w-full bg-gray-800 border border-gray-600 px-3 py-2 rounded-lg text-white"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Description <span className="text-gray-400 text-xs">(optional)</span>
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows="3"
                className="w-full bg-gray-800 border border-gray-600 px-3 py-2 rounded-lg text-white resize-none"
                placeholder="Tell us about yourself"
              />
            </div>
          </div>
        </div>

        {/* Password Section */}
        <div className="bg-gray-700/50 backdrop-blur-sm rounded-xl p-4 border border-gray-600/30">
          <h3 className="text-lg font-semibold mb-4">Password & Security</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="password"
              name="oldPassword"
              value={formData.oldPassword}
              onChange={handleInputChange}
              className="bg-gray-800 border border-gray-600 px-3 py-2 rounded-lg text-white"
              placeholder="Old Password"
            />
            <input
              type="password"
              name="newPassword"
              value={formData.newPassword}
              onChange={handleInputChange}
              className="bg-gray-800 border border-gray-600 px-3 py-2 rounded-lg text-white"
              placeholder="New Password"
            />
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              className="bg-gray-800 border border-gray-600 px-3 py-2 rounded-lg text-white"
              placeholder="Confirm Password"
            />
          </div>
          {isPasswordChanged && (
            <button
              onClick={handlePasswordUpdate}
              className="mt-4 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-white"
            >
              Update Password
            </button>
          )}
        </div>

        {/* Save Button (only when profile changes are made) */}
        {isProfileChanged && (
          <div className="fixed bottom-4 right-4">
            <button
              onClick={handleProfileUpdate}
              disabled={isLoading}
              className={`px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-lg transition ${
                isLoading && "opacity-50 cursor-not-allowed"
              }`}
            >
              {isLoading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileEditPage;
