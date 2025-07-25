import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { FaPlus, FaSave, FaCheck, FaTimes, FaSpinner } from "react-icons/fa";
import {
  addParty,
  updateParty,
  clearSelectedParty,
} from "../../Store/Slices/partySlice";
import indiaData from "../../Data/indiaData.json";
import AutoCompleteInput from "./AutoCompleteInput";
import EmailAutoComplete from "./EmailAutoComplete";

// City-State list
const cityStateList = Object.keys(indiaData).flatMap((state) => [
  { name: state },
  ...indiaData[state].map((city) => ({ name: `${city}, ${state}` })),
]);

const AdminPartyForm = () => {
  const dispatch = useDispatch();
  const { selectedParty } = useSelector((state) => state.party);

  const [form, setForm] = useState({
    name: "",
    contactNumber: "",
    email: "",
    city: "",
    gstNo: "",
  });

  const [notification, setNotification] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (selectedParty) setForm(selectedParty);
  }, [selectedParty]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    if (errors[name]) setErrors({ ...errors, [name]: "" });
  };

  const handleCitySelect = (value) => {
    setForm({ ...form, city: value });
    if (errors.city) setErrors({ ...errors, city: "" });
  };

  const handleEmailChange = (value) => {
    setForm({ ...form, email: value });
    if (errors.email) setErrors({ ...errors, email: "" });
  };

  const validateForm = () => {
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = "Party name is required";
    if (!form.contactNumber.trim())
      newErrors.contactNumber = "Contact number is required";
    if (
      form.contactNumber &&
      !/^\d{10}$/.test(form.contactNumber.replace(/\s+/g, ""))
    ) {
      newErrors.contactNumber = "Please enter a valid 10-digit contact number";
    }
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = "Please enter a valid email address";
    }
    if (form.gstNo && form.gstNo.length > 0 && form.gstNo.length !== 15) {
      newErrors.gstNo = "GST number must be 15 characters long";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      if (selectedParty) {
        await dispatch(updateParty({ id: selectedParty._id, data: form }));
        showNotification("Party updated successfully", "success");
      } else {
        await dispatch(addParty(form));
        showNotification("Party added successfully", "success");
      }
      dispatch(clearSelectedParty());
      resetForm();
    } catch (error) {
      showNotification("An error occurred. Please try again.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setForm({
      name: "",
      contactNumber: "",
      email: "",
      city: "",
      gstNo: "",
    });
    setErrors({});
  };

  const showNotification = (msg, type) => {
    setNotification({ message: msg, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const dismissNotification = () => setNotification(null);

  const handleCancel = () => {
    dispatch(clearSelectedParty());
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
            {selectedParty ? "Edit Party" : "Add Party"}
          </h1>
          <p className="text-gray-400 text-lg">
            {selectedParty
              ? "Update the party information"
              : "Enter new party details"}
          </p>
        </div>

        {/* Form Container */}
        <div className="bg-gray-800 rounded-2xl shadow-xl border border-gray-700 p-8">
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Party Name */}
              <div>
                <label className="block text-gray-300 text-sm mb-2">
                  Party Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Enter party name"
                  className={`w-full bg-gray-700 border ${
                    errors.name ? "border-red-500" : "border-gray-600"
                  } rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
                {errors.name && (
                  <p className="text-red-400 text-sm mt-1">{errors.name}</p>
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

              {/* Email with AutoComplete */}
              <div>
                <label className="block text-gray-300 text-sm mb-2">
                  Email
                </label>
                <EmailAutoComplete
                  value={form.email}
                  onChange={handleEmailChange}
                />
                {errors.email && (
                  <p className="text-red-400 text-sm mt-1">{errors.email}</p>
                )}
              </div>

              {/* City with AutoComplete */}
              <div>
                <label className="block text-gray-300 text-sm mb-2">
                  City
                </label>
                <AutoCompleteInput
                  data={cityStateList}
                  placeholder="Enter city or state"
                  value={form.city}
                  onChangeValue={(val) => setForm({ ...form, city: val })}
                  onSelect={handleCitySelect}
                  className="w-full"
                />
                {errors.city && (
                  <p className="text-red-400 text-sm mt-1">{errors.city}</p>
                )}
              </div>

              {/* GST Number */}
              <div>
                <label className="block text-gray-300 text-sm mb-2">
                  GST Number
                </label>
                <input
                  type="text"
                  name="gstNo"
                  value={form.gstNo}
                  onChange={handleChange}
                  placeholder="Enter GST number (15 digits)"
                  maxLength={15}
                  className={`w-full bg-gray-700 border ${
                    errors.gstNo ? "border-red-500" : "border-gray-600"
                  } rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500`}
                />
                {errors.gstNo && (
                  <p className="text-red-400 text-sm mt-1">{errors.gstNo}</p>
                )}
                {form.gstNo && (
                  <p className="text-gray-400 text-xs mt-1">
                    {form.gstNo.length}/15 characters
                  </p>
                )}
              </div>
            </div>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mt-8">
              <button
                type="submit"
                disabled={isSubmitting}
                className={`flex-1 flex items-center justify-center gap-3 px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
                  selectedParty
                    ? "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                    : "bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                } text-white ${isSubmitting ? "opacity-75 cursor-not-allowed" : "hover:scale-105"}`}
              >
                {isSubmitting ? (
                  <FaSpinner className="animate-spin" />
                ) : selectedParty ? (
                  <FaSave />
                ) : (
                  <FaPlus />
                )}
                {isSubmitting
                  ? "Processing..."
                  : selectedParty
                  ? "Save Changes"
                  : "Add Party"}
              </button>

              {selectedParty && (
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
            All required fields must be filled out to save the party information.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminPartyForm;
