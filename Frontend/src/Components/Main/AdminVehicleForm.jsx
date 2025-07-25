import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { FaPlus, FaSave, FaCheck, FaTimes, FaSpinner } from "react-icons/fa";
import {
  addVehicle,
  updateVehicle,
  clearSelectedVehicle,
} from "../../Store/Slices/vehicleSlice";

const AdminVehicleForm = () => {
  const dispatch = useDispatch();
  const { selectedVehicle } = useSelector((state) => state.vehicle);

  const [form, setForm] = useState({
    vehicleNumber: "",
    ownerName: "",
    contactNumber: "",
    address: "",
    vehicleType: "",
    ownership: "Owner",
  });

  const [notification, setNotification] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (selectedVehicle) setForm(selectedVehicle);
  }, [selectedVehicle]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    if (errors[name]) setErrors({ ...errors, [name]: "" });
  };

  const validateForm = () => {
    const newErrors = {};
    if (!form.vehicleNumber.trim()) newErrors.vehicleNumber = "Vehicle number is required";
    if (!form.ownerName.trim()) newErrors.ownerName = "Owner name is required";
    if (!form.contactNumber.trim()) newErrors.contactNumber = "Contact number is required";
    if (
      form.contactNumber &&
      !/^\d{10}$/.test(form.contactNumber.replace(/\s+/g, ""))
    ) {
      newErrors.contactNumber = "Enter a valid 10-digit contact number";
    }
    if (!form.vehicleType.trim()) newErrors.vehicleType = "Vehicle type is required";
    if (!form.ownership) newErrors.ownership = "Ownership is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      if (selectedVehicle) {
        await dispatch(updateVehicle({ id: selectedVehicle._id, data: form }));
        showNotification("Vehicle updated successfully", "success");
      } else {
        await dispatch(addVehicle(form));
        showNotification("Vehicle added successfully", "success");
      }
      dispatch(clearSelectedVehicle());
      resetForm();
    } catch (error) {
      showNotification("An error occurred. Please try again.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setForm({
      vehicleNumber: "",
      ownerName: "",
      contactNumber: "",
      address: "",
      vehicleType: "",
      ownership: "Owner",
    });
    setErrors({});
  };

  const showNotification = (msg, type) => {
    setNotification({ message: msg, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const dismissNotification = () => setNotification(null);

  const handleCancel = () => {
    dispatch(clearSelectedVehicle());
    resetForm();
  };

  return (
    <div className="min-h-screen bg-gray-800 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Notification */}
        {notification && (
          <div className="fixed top-6 right-6 z-50 max-w-sm w-full transform transition-all duration-300 ease-in-out">
            <div
              className={`rounded-xl shadow-2xl border-l-4 p-4 ${
                notification.type === "success"
                  ? "bg-gray-800 border-emerald-500 text-emerald-300"
                  : "bg-gray-800 border-red-500 text-red-300"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {notification.type === "success" ? (
                    <FaCheck className="text-emerald-400" />
                  ) : (
                    <FaTimes className="text-red-400" />
                  )}
                  <span className="font-medium">{notification.message}</span>
                </div>
                <button
                  onClick={dismissNotification}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <FaTimes size={12} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-white mb-2">
            {selectedVehicle ? "Edit Vehicle" : "Add Vehicle"}
          </h1>
          <p className="text-gray-400 text-lg">
            {selectedVehicle
              ? "Update the vehicle information"
              : "Enter new vehicle details"}
          </p>
        </div>

        {/* Form Container */}
        <div className="bg-gray-800 rounded-2xl shadow-xl border border-gray-700 p-8">
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Vehicle Number */}
              <div>
                <label className="block text-gray-300 text-sm mb-2">
                  Vehicle Number *
                </label>
                <input
                  type="text"
                  name="vehicleNumber"
                  value={form.vehicleNumber}
                  onChange={handleChange}
                  placeholder="Enter vehicle number"
                  className={`w-full bg-gray-700 border ${
                    errors.vehicleNumber ? "border-red-500" : "border-gray-600"
                  } rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
                {errors.vehicleNumber && (
                  <p className="text-red-400 text-sm mt-1">{errors.vehicleNumber}</p>
                )}
              </div>

              {/* Owner Name */}
              <div>
                <label className="block text-gray-300 text-sm mb-2">
                  Owner Name *
                </label>
                <input
                  type="text"
                  name="ownerName"
                  value={form.ownerName}
                  onChange={handleChange}
                  placeholder="Enter owner name"
                  className={`w-full bg-gray-700 border ${
                    errors.ownerName ? "border-red-500" : "border-gray-600"
                  } rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500`}
                />
                {errors.ownerName && (
                  <p className="text-red-400 text-sm mt-1">{errors.ownerName}</p>
                )}
              </div>

              {/* Contact Number */}
              <div>
                <label className="block text-gray-300 text-sm mb-2">
                  Contact Number *
                </label>
                <input
                  type="tel"
                  name="contactNumber"
                  value={form.contactNumber}
                  onChange={handleChange}
                  placeholder="Enter contact number"
                  className={`w-full bg-gray-700 border ${
                    errors.contactNumber ? "border-red-500" : "border-gray-600"
                  } rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500`}
                />
                {errors.contactNumber && (
                  <p className="text-red-400 text-sm mt-1">
                    {errors.contactNumber}
                  </p>
                )}
              </div>

              {/* Vehicle Type */}
              <div>
                <label className="block text-gray-300 text-sm mb-2">
                  Vehicle Type *
                </label>
                <input
                  type="text"
                  name="vehicleType"
                  value={form.vehicleType}
                  onChange={handleChange}
                  placeholder="Car, Truck, Bike..."
                  className={`w-full bg-gray-700 border ${
                    errors.vehicleType ? "border-red-500" : "border-gray-600"
                  } rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500`}
                />
                {errors.vehicleType && (
                  <p className="text-red-400 text-sm mt-1">{errors.vehicleType}</p>
                )}
              </div>

              {/* Address */}
              <div className="lg:col-span-2">
                <label className="block text-gray-300 text-sm mb-2">
                  Address
                </label>
                <textarea
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  placeholder="Enter address"
                  className="w-full bg-gray-700 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  rows={2}
                />
              </div>

              {/* Ownership */}
              <div>
                <label className="block text-gray-300 text-sm mb-2">
                  Ownership *
                </label>
                <select
                  name="ownership"
                  value={form.ownership}
                  onChange={handleChange}
                  className={`w-full bg-gray-700 border ${
                    errors.ownership ? "border-red-500" : "border-gray-600"
                  } rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500`}
                >
                  <option value="Owner">Owner</option>
                  <option value="Vendor">Vendor</option>
                </select>
                {errors.ownership && (
                  <p className="text-red-400 text-sm mt-1">{errors.ownership}</p>
                )}
              </div>
            </div>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mt-8">
              <button
                type="submit"
                disabled={isSubmitting}
                className={`flex-1 flex items-center justify-center gap-3 px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
                  selectedVehicle
                    ? "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                    : "bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                } text-white ${isSubmitting ? "opacity-75 cursor-not-allowed" : "hover:scale-105"}`}
              >
                {isSubmitting ? (
                  <FaSpinner className="animate-spin" />
                ) : selectedVehicle ? (
                  <FaSave />
                ) : (
                  <FaPlus />
                )}
                {isSubmitting
                  ? "Processing..."
                  : selectedVehicle
                  ? "Save Changes"
                  : "Add Vehicle"}
              </button>

              {selectedVehicle && (
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={isSubmitting}
                  className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-semibold transition-all duration-200"
                >
                  Cancel
                </button>
              )}

              <button
                type="button"
                onClick={resetForm}
                disabled={isSubmitting}
                className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-gray-300 border border-gray-600 rounded-xl font-semibold transition-all duration-200"
              >
                Reset Form
              </button>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-gray-400 text-sm">
            All required fields must be filled out to save vehicle information.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminVehicleForm;