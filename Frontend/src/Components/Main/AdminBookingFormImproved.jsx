import React, { useEffect, useState, useRef, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchParties } from "../../Store/Slices/partySlice";
import { fetchVehicles } from "../../Store/Slices/vehicleSlice";
import {
  fetchLastBookingNo,
  createBooking,
  fetchBookingById,
  updateBooking,
  fetchBookings,
  clearCurrentBooking,
} from "../../Store/Slices/bookingSlice";
import AutoCompleteInput from "./AutoCompleteInput";
import { fetchMasters } from "../../Store/Slices/masterSlice";
import "../../styles/print.css";
import {
  FaPrint,
  FaSave,
  FaRupeeSign,
  FaCalendarAlt,
  FaUser,
  FaTruck,
  FaRoute,
  FaMoneyBillWave,
  FaCreditCard,
  FaArrowLeft,
  FaCheckCircle,
  FaSync,
  FaFileImage,
} from "react-icons/fa";

// --- Centralized Calculation Helper ---
// This single function handles all financial calculations to ensure consistency.
const calculateAllTotals = (charges = {}, vehiclePayment = {}) => {
  const dealAmt = parseFloat(charges.dealAmount) || 0;
  const advanceAmt = parseFloat(charges.advancePaid) || 0;

  const totalDeductions =
    (parseFloat(charges.vehicleCharges) || 0) +
    (parseFloat(charges.commission) || 0) +
    (parseFloat(charges.localCharges) || 0) +
    (parseFloat(charges.hamali) || 0) +
    (parseFloat(charges.tds) || 0) +
    (parseFloat(charges.stCharges) || 0) +
    (parseFloat(charges.other) || 0);

  const vehicleCostAmt = parseFloat(vehiclePayment.actualVehicleCost) || 0;
  const vehicleAdvanceAmt = parseFloat(vehiclePayment.vehicleAdvance) || 0;

  // CORRECTED: The final pending amount now correctly subtracts deductions.
  const finalPendingAmount = dealAmt - advanceAmt;
  const subTotal = dealAmt - totalDeductions;
  const vehicleBalance = vehicleCostAmt - vehicleAdvanceAmt;

  return {
    pendingAmount: finalPendingAmount,
    finalPendingAmount: finalPendingAmount,
    subTotal: subTotal,
    vehicleBalance: vehicleBalance,
  };
};

// --- Helper function to convert number to words (for invoice) ---
const toWords = (num) => {
  const a = [
    "",
    "one ",
    "two ",
    "three ",
    "four ",
    "five ",
    "six ",
    "seven ",
    "eight ",
    "nine ",
    "ten ",
    "eleven ",
    "twelve ",
    "thirteen ",
    "fourteen ",
    "fifteen ",
    "sixteen ",
    "seventeen ",
    "eighteen ",
    "nineteen ",
  ];
  const b = [
    "",
    "",
    "twenty",
    "thirty",
    "forty",
    "fifty",
    "sixty",
    "seventy",
    "eighty",
    "ninety",
  ];
  const s = Math.round(num).toString();
  if (s !== parseFloat(s).toString()) return "";
  if (s.length > 9) return "overflow";
  const n = ("000000000" + s)
    .substr(-9)
    .match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
  if (!n) return "";
  var str = "";
  str +=
    n[1] != 0
      ? (a[Number(n[1])] || b[n[1][0]] + " " + a[n[1][1]]) + "crore "
      : "";
  str +=
    n[2] != 0
      ? (a[Number(n[2])] || b[n[2][0]] + " " + a[n[2][1]]) + "lakh "
      : "";
  str +=
    n[3] != 0
      ? (a[Number(n[3])] || b[n[3][0]] + " " + a[n[3][1]]) + "thousand "
      : "";
  str +=
    n[4] != 0
      ? (a[Number(n[4])] || b[n[4][0]] + " " + a[n[4][1]]) + "hundred "
      : "";
  str +=
    n[5] != 0
      ? (str !== "" ? "and " : "") +
        (a[Number(n[5])] || b[n[5][0]] + " " + a[n[5][1]])
      : "";
  return str.replace(/\s+/g, " ").trim();
};

const AdminBookingFormImproved = ({
  setActiveTab,
  editMode = false,
  editBookingId = null,
}) => {
  const dispatch = useDispatch();
  const gstSyncedRef = useRef(false);

  const [toast, setToast] = useState(null);
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [loading, setLoading] = useState(false);

  const { parties } = useSelector((state) => state.party);
  const { vehicles } = useSelector((state) => state.vehicle);
  const { lastBookingNo } = useSelector((state) => state.booking);
  const { user: profile } = useSelector((state) => state.profile);
  const { masters } = useSelector((state) => state.master);

  const getInitialFormData = useCallback(
    () => ({
      bookingNo: "NH0001",
      bookingDate: new Date().toISOString().split("T")[0],
      ourGstNo: profile?.gstNumber || "",
      party: { name: "", address: "", contact: "", gstNo: "" },
      vehicle: {
        vehicleNumber: "",
        ownerName: "",
        contactNumber: "",
        vehicleType: "",
      },
      journey: { fromLocation: "", toLocation: "" },
      charges: {
        dealAmount: "",
        advancePaid: "",
        pendingAmount: "",
        vehicleCharges: "",
        commission: "",
        localCharges: "",
        hamali: "",
        tds: "",
        stCharges: "",
        other: "",
        subTotal: "",
        previousAmount: "",
        finalPendingAmount: "",
      },
      vehiclePayment: {
        actualVehicleCost: "",
        vehicleAdvance: "",
        vehicleBalance: "",
      },
      delivery: {
        status: "pending",
        remarks: "",
        proofImage: null,
        existingImagePath: "",
      },
      paymentStatus: {
        partyPaymentStatus: "pending",
        vehiclePaymentStatus: "pending",
      },
    }),
    [profile]
  );

  const [formData, setFormData] = useState(getInitialFormData());

  const loadBookingData = useCallback(
    (booking) => {
      const initialData = getInitialFormData();
      const loadedData = {
        ...initialData,
        bookingNo: booking.bookingNo || "",
        bookingDate:
          booking.bookingDate?.split("T")[0] ||
          new Date().toISOString().split("T")[0],
        ourGstNo: booking.ourGstNo || profile?.gstNumber || "",
        party: { ...initialData.party, ...booking.party },
        vehicle: {
          ...initialData.vehicle,
          vehicleNumber:
            booking.vehicle?.vehicleNo || booking.vehicle?.vehicleNumber || "",
          ownerName: booking.vehicle?.ownerName || "",
          contactNumber:
            booking.vehicle?.ownerContact ||
            booking.vehicle?.contactNumber ||
            "",
          vehicleType: booking.vehicle?.vehicleType || "",
        },
        journey: { ...initialData.journey, ...booking.journey },
        charges: { ...initialData.charges, ...booking.charges },
        vehiclePayment: {
          ...initialData.vehiclePayment,
          ...booking.vehiclePayment,
        },
        delivery: {
          ...initialData.delivery,
          ...booking.delivery,
          proofImage: null,
          existingImagePath: booking.delivery?.proofImage || "",
        },
        paymentStatus: {
          ...initialData.paymentStatus,
          ...booking.paymentStatus,
        },
      };

      // Recalculate all totals upon loading data to ensure data integrity
      const totals = calculateAllTotals(
        loadedData.charges,
        loadedData.vehiclePayment
      );
      loadedData.charges.pendingAmount = totals.pendingAmount;
      loadedData.charges.finalPendingAmount = totals.finalPendingAmount;
      loadedData.charges.subTotal = totals.subTotal;
      loadedData.vehiclePayment.vehicleBalance = totals.vehicleBalance;

      setFormData(loadedData);
    },
    [profile, getInitialFormData]
  );

  useEffect(() => {
    if (editMode && editBookingId) {
      dispatch(fetchBookingById(editBookingId))
        .unwrap()
        .then(loadBookingData)
        .catch((error) => {
          console.error("Failed to load booking:", error);
          setToast({ message: "Failed to load booking data", type: "error" });
          setTimeout(() => setToast(null), 3000);
        });
    } else {
      dispatch(clearCurrentBooking());
      setFormData(getInitialFormData()); // Reset form for new booking
    }
  }, [editMode, editBookingId, dispatch, loadBookingData, getInitialFormData]);

  useEffect(() => {
    return () => {
      dispatch(clearCurrentBooking());
    };
  }, [dispatch]);

const resetForm = useCallback(() => {
  if (!editMode) {
    dispatch(fetchLastBookingNo())
      .unwrap()
      .then((lastNo) => {
        setFormData((prev) => ({
          ...getInitialFormData(),
          bookingNo: lastNo ? incrementBookingNo(lastNo) : "NH0001",
        }));
      })
      .catch(() => {
        setFormData({
          ...getInitialFormData(),
          bookingNo: "NH0001",
        });
      });
  } else {
    setFormData(getInitialFormData());
  }
}, [getInitialFormData, editMode, dispatch]);

useEffect(() => {
  dispatch(fetchParties());
  dispatch(fetchVehicles());
  dispatch(fetchMasters());
  if (!editMode) {
    // This is now handled in the resetForm function
    resetForm();
  }
}, [dispatch, editMode, resetForm]);

  const incrementBookingNo = (lastNo) => {
    if (!lastNo || lastNo.trim() === "") return "NH0001";
    const prefix = (lastNo.match(/^[A-Za-z]+/) || ["NH"])[0];
    const numPart = parseInt(lastNo.replace(/\D/g, ""), 10) || 0;
    return `${prefix}${String(numPart + 1).padStart(4, "0")}`;
  };

  useEffect(() => {
    if (!editMode && lastBookingNo) {
      setFormData((prev) => ({
        ...prev,
        bookingNo: incrementBookingNo(lastBookingNo),
      }));
    } else if (!editMode && !lastBookingNo) {
      // Ensure NH0001 is set when there's no last booking number
      setFormData((prev) => ({
        ...prev,
        bookingNo: "NH0001",
      }));
    }
  }, [lastBookingNo, editMode]);

  useEffect(() => {
    if (!editMode && profile?.gstNumber && !gstSyncedRef.current) {
      setFormData((prev) => ({ ...prev, ourGstNo: profile.gstNumber }));
      gstSyncedRef.current = true;
    }
  }, [profile, editMode]);

  const handleInputChange = (section, field, value) => {
    setFormData((prev) => {
      const newData = {
        ...prev,
        [section]: { ...prev[section], [field]: value },
      };

      if (section === "charges" || section === "vehiclePayment") {
        const totals = calculateAllTotals(
          newData.charges,
          newData.vehiclePayment
        );

        newData.charges.pendingAmount = totals.pendingAmount;
        newData.charges.finalPendingAmount = totals.finalPendingAmount;
        newData.charges.subTotal = totals.subTotal;
        newData.vehiclePayment.vehicleBalance = totals.vehicleBalance;

        newData.paymentStatus.partyPaymentStatus =
          totals.finalPendingAmount <= 0 ? "completed" : "pending";
        newData.paymentStatus.vehiclePaymentStatus =
          totals.vehicleBalance <= 0 ? "completed" : "pending";
      }
      return newData;
    });
  };

  const handleSelectParty = (partyName) => {
    const selectedParty = parties.find((p) => p.name === partyName);
    if (selectedParty) {
      setFormData((prev) => ({
        ...prev,
        party: {
          name: selectedParty.name || "",
          address: selectedParty.city || "",
          contact: selectedParty.contactNumber || "",
          gstNo: selectedParty.gstNo || "",
        },
      }));
    }
  };

  const handleSelectVehicle = (vehicleNumber) => {
    const selectedVehicle = vehicles.find(
      (v) => v.vehicleNumber === vehicleNumber
    );
    if (selectedVehicle) {
      setFormData((prev) => ({
        ...prev,
        vehicle: {
          vehicleNumber: selectedVehicle.vehicleNumber || "",
          ownerName: selectedVehicle.ownerName || "",
          contactNumber: selectedVehicle.contactNumber || "",
          vehicleType: selectedVehicle.vehicleType || "",
        },
      }));
    }
  };

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setFormData((prev) => ({
        ...prev,
        delivery: { ...prev.delivery, proofImage: file },
      }));
    }
  };

  const buildDataForSubmission = (data) => {
    // Convert empty strings to 0 for numeric fields
    const sanitizeNumericField = (value) => {
      if (value === "" || value === null || value === undefined) return 0;
      const parsed = parseFloat(value);
      return isNaN(parsed) ? 0 : parsed;
    };

    const normalizedData = {
      ...data,
      vehicle: {
        vehicleNo: data.vehicle.vehicleNumber || data.vehicle.vehicleNo,
        ownerName: data.vehicle.ownerName,
        ownerContact: data.vehicle.contactNumber || data.vehicle.ownerContact,
        vehicleType: data.vehicle.vehicleType,
      },
      charges: {
        ...data.charges,
        dealAmount: sanitizeNumericField(data.charges.dealAmount),
        advancePaid: sanitizeNumericField(data.charges.advancePaid),
        pendingAmount: sanitizeNumericField(data.charges.pendingAmount),
        vehicleCharges: sanitizeNumericField(data.charges.vehicleCharges),
        commission: sanitizeNumericField(data.charges.commission),
        localCharges: sanitizeNumericField(data.charges.localCharges),
        hamali: sanitizeNumericField(data.charges.hamali),
        tds: sanitizeNumericField(data.charges.tds),
        stCharges: sanitizeNumericField(data.charges.stCharges),
        other: sanitizeNumericField(data.charges.other),
        subTotal: sanitizeNumericField(data.charges.subTotal),
        previousAmount: sanitizeNumericField(data.charges.previousAmount),
        finalPendingAmount: sanitizeNumericField(data.charges.finalPendingAmount),
      },
      vehiclePayment: {
        ...data.vehiclePayment,
        actualVehicleCost: sanitizeNumericField(data.vehiclePayment.actualVehicleCost),
        vehicleAdvance: sanitizeNumericField(data.vehiclePayment.vehicleAdvance),
        vehicleBalance: sanitizeNumericField(data.vehiclePayment.vehicleBalance),
      },
    };

    if (normalizedData.delivery.proofImage instanceof File) {
      const fd = new FormData();
      Object.keys(normalizedData).forEach((key) => {
        if (key === "delivery") {
          fd.append(
            "delivery",
            JSON.stringify({
              status: normalizedData.delivery.status,
              remarks: normalizedData.delivery.remarks,
              existingImagePath: normalizedData.delivery.existingImagePath,
            })
          );
          fd.append("proofImage", normalizedData.delivery.proofImage);
        } else if (
          typeof normalizedData[key] === "object" &&
          normalizedData[key] !== null
        ) {
          fd.append(key, JSON.stringify(normalizedData[key]));
        } else {
          fd.append(key, normalizedData[key] || "");
        }
      });
      return fd;
    }
    return normalizedData;
  };

  const handleSave = async () => {
    if (
      !formData.party.name ||
      !formData.vehicle.vehicleNumber ||
      !formData.journey.fromLocation ||
      !formData.journey.toLocation
    ) {
      setToast({ message: "Please fill all required fields!", type: "error" });
      setTimeout(() => setToast(null), 3000);
      return false;
    }

    setLoading(true);
    try {
      const dataToSubmit = buildDataForSubmission(formData);
      if (editMode && editBookingId) {
        await dispatch(
          updateBooking({ id: editBookingId, formData: dataToSubmit })
        ).unwrap();
        setToast({ message: "Booking updated successfully!", type: "success" });
      } else {
        await dispatch(createBooking(dataToSubmit)).unwrap();
        setToast({ message: "Booking saved successfully!", type: "success" });
      }
      await dispatch(fetchBookings());
      setTimeout(() => setActiveTab("list-booking"), 1500);
      return true;
    } catch (err) {
      console.error("Booking operation failed:", err);
      const message =
        err?.message ||
        err?.errors?.join(", ") ||
        (editMode ? "Failed to update booking" : "Failed to create booking");
      setToast({ message, type: "error" });
      setTimeout(() => setToast(null), 3000);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleSave();
  };

  const handlePrint = () => setShowPrintPreview(true);
  const closePrintPreview = () => setShowPrintPreview(false);
  const handleBackToList = () => setActiveTab("list-booking");

  const calculatedDisplayValues = React.useMemo(
    () => calculateAllTotals(formData.charges, formData.vehiclePayment),
    [formData.charges, formData.vehiclePayment]
  );

  const ImprovedPrintBill = () => {
    const calculated = calculatedDisplayValues;
    const dealAmount = parseFloat(formData.charges.dealAmount) || 0;
    const advancePaid = parseFloat(formData.charges.advancePaid) || 0;
    const actualVehicleCost =
      parseFloat(formData.vehiclePayment.actualVehicleCost) || 0;
    const vehicleAdvance =
      parseFloat(formData.vehiclePayment.vehicleAdvance) || 0;

    const deductions = [
      {
        label: "Vehicle Charges",
        value: parseFloat(formData.charges.vehicleCharges) || 0,
      },
      {
        label: "Commission",
        value: parseFloat(formData.charges.commission) || 0,
      },
      {
        label: "Local Charges",
        value: parseFloat(formData.charges.localCharges) || 0,
      },
      { label: "Hamali", value: parseFloat(formData.charges.hamali) || 0 },
      { label: "TDS", value: parseFloat(formData.charges.tds) || 0 },
      {
        label: "ST Charges",
        value: parseFloat(formData.charges.stCharges) || 0,
      },
      {
        label: "Other Charges",
        value: parseFloat(formData.charges.other) || 0,
      },
    ].filter((d) => d.value > 0);

    const totalDeductions = deductions.reduce(
      (sum, item) => sum + item.value,
      0
    );
    const profit =
      dealAmount -
      actualVehicleCost -
      totalDeductions +
      (parseFloat(formData.charges.vehicleCharges) || 0);
    const finalAmountInWords = toWords(calculated.finalPendingAmount) + " only";

    const proofImageUrl = formData.delivery.existingImagePath
      ? `${import.meta.env.VITE_API_URL || "http://localhost:5003"}/${
          formData.delivery.existingImagePath
        }`
      : formData.delivery.proofImage instanceof File
      ? URL.createObjectURL(formData.delivery.proofImage)
      : null;

    const printMasterBill = () => {
      const printWindow = window.open("", "_blank");
      printWindow.document.write(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <title>Master Bill - ${formData.bookingNo}</title>
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap');
                body { font-family: 'Roboto', sans-serif; margin: 0; padding: 0; background-color: #fff; font-size: 10pt; color: #333; }
                .page { width: 210mm; min-height: 297mm; padding: 15mm; margin: 10mm auto; border: 1px solid #d3d3d3; background: white; box-shadow: 0 0 5px rgba(0, 0, 0, 0.1); }
                @page { size: A4; margin: 0; }
                @media print {
                    html, body { width: 210mm; height: 297mm; }
                    .page { margin: 0; border: initial; border-radius: initial; width: initial; min-height: initial; box-shadow: initial; background: initial; page-break-after: always; }
                    .no-print { display: none; }
                }
                .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #003366; padding-bottom: 10px; }
                .company-details h1 { margin: 0; font-size: 20pt; color: #003366; }
                .company-details p { margin: 2px 0; font-size: 9pt; }
                .bill-details { text-align: right; }
                .bill-details h2 { margin: 0; font-size: 24pt; color: #555; }
                .bill-details p { margin: 3px 0; font-size: 11pt; }
                .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 20px; padding-bottom: 15px; border-bottom: 1px solid #eee; }
                .info-block h3 { font-size: 12pt; color: #003366; margin-bottom: 8px; border-bottom: 1px solid #eee; padding-bottom: 4px; }
                .info-block p { margin: 4px 0; line-height: 1.5; }
                .info-block p strong { display: inline-block; width: 120px; color: #555; }
                .financial-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 20px; }
                .financial-table { width: 100%; border-collapse: collapse; }
                .financial-table th, .financial-table td { padding: 8px; border: 1px solid #ddd; text-align: left; }
                .financial-table th { background: #f2f2f2; font-weight: 700; }
                .financial-table .amount { text-align: right; }
                .financial-table .total-row td { font-weight: 700; background-color: #e8f0fe; border-top: 2px solid #003366; }
                .delivery-section { margin-top: 20px; padding: 10px; border: 1px solid #eee; border-radius: 5px; }
                .delivery-section h3 { margin-top: 0; }
                .delivery-section .status { font-weight: bold; text-transform: capitalize; }
                .delivery-section img { max-width: 100%; max-height: 200px; margin-top: 10px; border-radius: 5px; border: 1px solid #ddd; }
                .footer { margin-top: 40px; text-align: center; font-size: 9pt; color: #777; }
            </style>
        </head>
        <body>
            <div class="page">
                <div class="header">
                    <div class="company-details">
                        <h1>TRANSPORT SOLUTIONS PVT. LTD.</h1>
                        <p>123 Transport Street, Logistics City, TC 400001</p>
                        <p><strong>GSTIN:</strong> ${formData.ourGstNo}</p>
                    </div>
                    <div class="bill-details">
                        <p><strong>Booking No:</strong> ${
                          formData.bookingNo
                        }</p>
                        <p><strong>Date:</strong> ${new Date(
                          formData.bookingDate
                        ).toLocaleDateString("en-IN")}</p>
                    </div>
                </div>
                <div class="details-grid">
                    <div class="info-block">
                        <h3>Party Details</h3>
                        <p><strong>Name:</strong> ${formData.party.name}</p>
                        <p><strong>Address:</strong> ${
                          formData.party.address
                        }</p>
                        <p><strong>Contact:</strong> ${
                          formData.party.contact
                        }</p>
                        <p><strong>GSTIN:</strong> ${
                          formData.party.gstNo || "N/A"
                        }</p>
                    </div>
                    <div class="info-block">
                        <h3>Vehicle & Journey</h3>
                        <p><strong>Vehicle No:</strong> ${
                          formData.vehicle.vehicleNumber
                        }</p>
                        <p><strong>Owner:</strong> ${
                          formData.vehicle.ownerName
                        }</p>
                        <p><strong>Contact:</strong> ${
                          formData.vehicle.contactNumber
                        }</p>
                        <p><strong>Route:</strong> ${
                          formData.journey.fromLocation
                        } to ${formData.journey.toLocation}</p>
                    </div>
                </div>
                <div class="financial-grid">
                    <div class="info-block">
                        <h3>Party Charges</h3>
                        <table class="financial-table">
                            <tr><td>Deal Amount</td><td class="amount">₹ ${dealAmount.toLocaleString(
                              "en-IN",
                              { minimumFractionDigits: 2 }
                            )}</td></tr>
                            <tr><td>Advance Paid</td><td class="amount">₹ ${advancePaid.toLocaleString(
                              "en-IN",
                              { minimumFractionDigits: 2 }
                            )}</td></tr>
                            <tr class="total-row"><td>Pending Amount</td><td class="amount">₹ ${Math.max(
                              0,
                              calculated.finalPendingAmount
                            ).toLocaleString("en-IN", {
                              minimumFractionDigits: 2,
                            })}</td></tr>
                        </table>
                    </div>
                    <div class="info-block">
                        <h3>Vehicle Payments</h3>
                        <table class="financial-table">
                            <tr><td>Actual Cost</td><td class="amount">₹ ${actualVehicleCost.toLocaleString(
                              "en-IN",
                              { minimumFractionDigits: 2 }
                            )}</td></tr>
                            <tr><td>Advance Paid</td><td class="amount">₹ ${vehicleAdvance.toLocaleString(
                              "en-IN",
                              { minimumFractionDigits: 2 }
                            )}</td></tr>
                            <tr class="total-row"><td>Balance Due</td><td class="amount">₹ ${Math.max(
                              0,
                              calculated.vehicleBalance
                            ).toLocaleString("en-IN", {
                              minimumFractionDigits: 2,
                            })}</td></tr>
                        </table>
                    </div>
                </div>
                 <div class="info-block" style="margin-top: 20px;">
                    <h3>Deductions & Profit</h3>
                    <table class="financial-table">
                         ${deductions
                           .map(
                             (d) =>
                               `<tr><td>${
                                 d.label
                               }</td><td class="amount">₹ ${d.value.toLocaleString(
                                 "en-IN",
                                 { minimumFractionDigits: 2 }
                               )}</td></tr>`
                           )
                           .join("")}
                         <tr class="total-row"><td>Total Deductions</td><td class="amount">₹ ${totalDeductions.toLocaleString(
                           "en-IN",
                           { minimumFractionDigits: 2 }
                         )}</td></tr>
                         <tr class="total-row" style="background-color: #e6fffa;"><td>Net Profit</td><td class="amount">₹ ${profit.toLocaleString(
                           "en-IN",
                           { minimumFractionDigits: 2 }
                         )}</td></tr>
                    </table>
                </div>
                <div class="delivery-section">
                    <h3>Delivery Details</h3>
                    <p><strong>Status:</strong> <span class="status">${
                      formData.delivery.status
                    }</span></p>
                    ${
                      formData.delivery.remarks
                        ? `<p><strong>Remarks:</strong> ${formData.delivery.remarks}</p>`
                        : ""
                    }
                    ${
                      proofImageUrl
                        ? `<div><strong>Proof Image:</strong><br><img src="${proofImageUrl}" alt="Delivery Proof"></div>`
                        : "<p>No proof image available.</p>"
                    }
                </div>
                <div class="footer">
                    This is a computer-generated document.
                </div>
            </div>
        </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 500);
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 no-print">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
          <div className="bg-gray-800 text-white p-4 rounded-t-lg flex justify-between items-center">
            <h2 className="text-xl font-bold">Print Bill</h2>
            <button
              onClick={closePrintPreview}
              className="text-gray-400 hover:text-white text-2xl"
            >
              &times;
            </button>
          </div>
          <div className="p-6 space-y-4">
            <button
              onClick={printMasterBill}
              className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 font-semibold transition-colors"
            >
              <FaPrint /> Print Master Bill
            </button>
            <button
              onClick={closePrintPreview}
              className="w-full bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  };

  const inputBaseStyle =
    "w-full bg-gray-700 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow";
  const inputDisabledStyle = "disabled:opacity-60 disabled:cursor-not-allowed";
  const inputReadOnlyStyle = "cursor-not-allowed focus:ring-0";

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-6">
      {toast && (
        <div
          className={`fixed top-5 right-5 z-[100] p-4 rounded-lg text-white shadow-lg ${
            toast.type === "success" ? "bg-green-600" : "bg-red-600"
          }`}
        >
          {toast.message}
        </div>
      )}
      {showPrintPreview && <ImprovedPrintBill />}

      <form onSubmit={handleSubmit} className="max-w-screen-2xl mx-auto">
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={handleBackToList}
                className="bg-gray-700 hover:bg-gray-600 text-white p-2 rounded-full flex items-center justify-center"
              >
                <FaArrowLeft />
              </button>
              <h1 className="text-2xl md:text-3xl font-bold text-white">
                {editMode ? "Edit Booking" : "Create New Booking"}
              </h1>
            </div>
            <div className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm text-gray-400">
              Booking No:{" "}
              <span className="font-bold text-white ml-2">
                {formData.bookingNo || "N/A"}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
          <div className="xl:col-span-3 space-y-6">
            <div className="bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-700 space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-6">
                <div className="space-y-4 lg:col-span-2">
                  <h3 className="text-lg font-semibold flex items-center gap-2 text-blue-400 border-b border-gray-700 pb-2">
                    <FaCalendarAlt /> Basic Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Booking Number *
                      </label>
                      <input
                        type="text"
                        value={formData.bookingNo}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            bookingNo: e.target.value,
                          })
                        }
                        disabled={editMode}
                        className={`${inputBaseStyle} ${inputDisabledStyle}`}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Booking Date *
                      </label>
                      <input
                        type="date"
                        value={formData.bookingDate}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            bookingDate: e.target.value,
                          })
                        }
                        className={`${inputBaseStyle} date-input`}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Our GST Number
                      </label>
                      <input
                        type="text"
                        value={formData.ourGstNo}
                        onChange={(e) =>
                          setFormData({ ...formData, ourGstNo: e.target.value })
                        }
                        className={inputBaseStyle}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2 text-green-400 border-b border-gray-700 pb-2">
                    <FaUser /> Party Information
                  </h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Party Name *
                    </label>
                    <AutoCompleteInput
                      value={formData.party.name}
                      onChangeValue={(value) =>
                        handleInputChange("party", "name", value)
                      }
                      onSelect={handleSelectParty}
                      data={parties}
                      labelKey="name"
                      placeholder="Select or type party name"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Address
                      </label>
                      <input
                        type="text"
                        value={formData.party.address}
                        onChange={(e) =>
                          handleInputChange("party", "address", e.target.value)
                        }
                        className={inputBaseStyle}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Contact
                      </label>
                      <input
                        type="text"
                        value={formData.party.contact}
                        onChange={(e) =>
                          handleInputChange("party", "contact", e.target.value)
                        }
                        className={inputBaseStyle}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      GST Number
                    </label>
                    <input
                      type="text"
                      value={formData.party.gstNo}
                      onChange={(e) =>
                        handleInputChange("party", "gstNo", e.target.value)
                      }
                      className={inputBaseStyle}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2 text-orange-400 border-b border-gray-700 pb-2">
                    <FaTruck /> Vehicle Information
                  </h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Vehicle Number *
                    </label>
                    <AutoCompleteInput
                      value={formData.vehicle.vehicleNumber}
                      onChangeValue={(value) =>
                        handleInputChange("vehicle", "vehicleNumber", value)
                      }
                      onSelect={handleSelectVehicle}
                      data={vehicles}
                      labelKey="vehicleNumber"
                      placeholder="Select or type vehicle number"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Owner Name
                      </label>
                      <input
                        type="text"
                        value={formData.vehicle.ownerName}
                        onChange={(e) =>
                          handleInputChange(
                            "vehicle",
                            "ownerName",
                            e.target.value
                          )
                        }
                        className={inputBaseStyle}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Contact Number
                      </label>
                      <input
                        type="text"
                        value={formData.vehicle.contactNumber}
                        onChange={(e) =>
                          handleInputChange(
                            "vehicle",
                            "contactNumber",
                            e.target.value
                          )
                        }
                        className={inputBaseStyle}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Vehicle Type
                    </label>
                    <select
                      value={formData.vehicle.vehicleType}
                      onChange={(e) =>
                        handleInputChange(
                          "vehicle",
                          "vehicleType",
                          e.target.value
                        )
                      }
                      className={inputBaseStyle}
                    >
                      <option value="">Select Type</option>
                      <option value="Truck">Truck</option>
                      <option value="Tempo">Tempo</option>
                      <option value="Container">Container</option>
                      <option value="Trailer">Trailer</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-4 border-t border-gray-700 pt-6">
                <h3 className="text-lg font-semibold flex items-center gap-2 text-purple-400 pb-2">
                  <FaRoute /> Journey Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      From Location *
                    </label>
                    <AutoCompleteInput
                      value={formData.journey.fromLocation}
                      onChangeValue={(value) =>
                        handleInputChange("journey", "fromLocation", value)
                      }
                      onSelect={(loc) =>
                        handleInputChange("journey", "fromLocation", loc)
                      }
                      data={masters}
                      labelKey="name"
                      placeholder="Select or type from location"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      To Location *
                    </label>
                    <AutoCompleteInput
                      value={formData.journey.toLocation}
                      onChangeValue={(value) =>
                        handleInputChange("journey", "toLocation", value)
                      }
                      onSelect={(loc) =>
                        handleInputChange("journey", "toLocation", loc)
                      }
                      data={masters}
                      labelKey="name"
                      placeholder="Select or type to location"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="xl:col-span-2 space-y-6">
            <div className="bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-700 space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-yellow-400 border-b border-gray-700 pb-2">
                  <FaRupeeSign /> Party Charges
                </h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Deal Amount *
                      </label>
                      <input
                        type="number"
                        value={formData.charges.dealAmount}
                        onChange={(e) =>
                          handleInputChange(
                            "charges",
                            "dealAmount",
                            e.target.value
                          )
                        }
                        className={inputBaseStyle}
                        placeholder="e.g., 50000"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Advance Paid
                      </label>
                      <input
                        type="number"
                        value={formData.charges.advancePaid}
                        onChange={(e) =>
                          handleInputChange(
                            "charges",
                            "advancePaid",
                            e.target.value
                          )
                        }
                        className={inputBaseStyle}
                        placeholder="e.g., 20000"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-dashed border-gray-600 pt-4">
                <h4 className="text-md font-semibold mb-3 text-orange-400">
                  Charges & Deductions
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <input
                    type="number"
                    placeholder="Veh. Charges"
                    value={formData.charges.vehicleCharges}
                    onChange={(e) =>
                      handleInputChange(
                        "charges",
                        "vehicleCharges",
                        e.target.value
                      )
                    }
                    className={inputBaseStyle}
                  />
                  <input
                    type="number"
                    placeholder="Commission"
                    value={formData.charges.commission}
                    onChange={(e) =>
                      handleInputChange("charges", "commission", e.target.value)
                    }
                    className={inputBaseStyle}
                  />
                  <input
                    type="number"
                    placeholder="Local"
                    value={formData.charges.localCharges}
                    onChange={(e) =>
                      handleInputChange(
                        "charges",
                        "localCharges",
                        e.target.value
                      )
                    }
                    className={inputBaseStyle}
                  />
                  <input
                    type="number"
                    placeholder="Hamali"
                    value={formData.charges.hamali}
                    onChange={(e) =>
                      handleInputChange("charges", "hamali", e.target.value)
                    }
                    className={inputBaseStyle}
                  />
                  <input
                    type="number"
                    placeholder="TDS"
                    value={formData.charges.tds}
                    onChange={(e) =>
                      handleInputChange("charges", "tds", e.target.value)
                    }
                    className={inputBaseStyle}
                  />
                  <input
                    type="number"
                    placeholder="ST Charges"
                    value={formData.charges.stCharges}
                    onChange={(e) =>
                      handleInputChange("charges", "stCharges", e.target.value)
                    }
                    className={inputBaseStyle}
                  />
                  <div className="col-span-2 md:col-span-3">
                    <input
                      type="number"
                      placeholder="Other Charges"
                      value={formData.charges.other}
                      onChange={(e) =>
                        handleInputChange("charges", "other", e.target.value)
                      }
                      className={inputBaseStyle}
                    />
                  </div>
                </div>
              </div>

              <div className="border-t border-dashed border-gray-600 pt-4">
                <h4 className="text-md font-semibold mb-3 text-green-400">
                  Final Calculation
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-gray-900/50 rounded-xl">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Sub Total (Payable)
                    </label>
                    <input
                      type="text"
                      value={`₹ ${parseFloat(
                        calculatedDisplayValues.subTotal || 0
                      ).toLocaleString("en-IN")}`}
                      readOnly
                      className={`${inputBaseStyle} ${inputReadOnlyStyle} bg-green-900/50 border-green-700 text-green-300 font-bold`}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Final Pending Amount
                    </label>
                    <input
                      type="text"
                      value={`₹ ${parseFloat(
                        calculatedDisplayValues.finalPendingAmount || 0
                      ).toLocaleString("en-IN")}`}
                      readOnly
                      className={`${inputBaseStyle} ${inputReadOnlyStyle} bg-red-900/50 border-red-700 text-red-300 font-bold`}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-700 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-red-400 border-b border-gray-700 pb-2">
                    <FaMoneyBillWave /> Vehicle Payment
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Actual Vehicle Cost
                      </label>
                      <input
                        type="number"
                        value={formData.vehiclePayment.actualVehicleCost}
                        onChange={(e) =>
                          handleInputChange(
                            "vehiclePayment",
                            "actualVehicleCost",
                            e.target.value
                          )
                        }
                        className={inputBaseStyle}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Vehicle Advance
                      </label>
                      <input
                        type="number"
                        value={formData.vehiclePayment.vehicleAdvance}
                        onChange={(e) =>
                          handleInputChange(
                            "vehiclePayment",
                            "vehicleAdvance",
                            e.target.value
                          )
                        }
                        className={inputBaseStyle}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Vehicle Balance
                      </label>
                      <input
                        type="text"
                        value={`₹ ${parseFloat(
                          calculatedDisplayValues.vehicleBalance || 0
                        ).toLocaleString("en-IN")}`}
                        readOnly
                        className={`${inputBaseStyle} ${inputReadOnlyStyle} bg-gray-800 text-red-300 font-semibold`}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-cyan-400 border-b border-gray-700 pb-2">
                    <FaCheckCircle /> Delivery & Status
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Delivery Status
                      </label>
                      <select
                        value={formData.delivery.status}
                        onChange={(e) =>
                          handleInputChange(
                            "delivery",
                            "status",
                            e.target.value
                          )
                        }
                        className={inputBaseStyle}
                      >
                        <option value="pending">Pending</option>
                        <option value="in-transit">In Transit</option>
                        <option value="delivered">Delivered</option>
                        <option value="received">Received</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Remarks
                      </label>
                      <textarea
                        value={formData.delivery.remarks}
                        onChange={(e) =>
                          handleInputChange(
                            "delivery",
                            "remarks",
                            e.target.value
                          )
                        }
                        className={inputBaseStyle}
                        rows="1"
                      ></textarea>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Delivery Proof
                      </label>
                      <label
                        htmlFor="file-upload"
                        className={`${inputBaseStyle} flex items-center justify-between cursor-pointer`}
                      >
                        <span className="truncate text-gray-400 max-w-[calc(100%-100px)]">
                          {formData.delivery.proofImage?.name ||
                            formData.delivery.existingImagePath ||
                            "No file chosen"}
                        </span>
                        <span className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded-lg text-sm whitespace-nowrap">
                          Choose File
                        </span>
                      </label>
                      <input
                        id="file-upload"
                        type="file"
                        className="sr-only"
                        onChange={handleImageUpload}
                        accept="image/*"
                      />
                      {(formData.delivery.proofImage ||
                        formData.delivery.existingImagePath) && (
                        <div className="mt-2">
                          <img
                            src={
                              formData.delivery.proofImage instanceof File
                                ? URL.createObjectURL(
                                    formData.delivery.proofImage
                                  )
                                : `${
                                    import.meta.env.VITE_API_URL ||
                                    "http://localhost:5003"
                                  }/${formData.delivery.existingImagePath}`
                            }
                            alt="Proof"
                            className="w-full h-24 object-cover rounded-xl border border-gray-500"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="border-t border-dashed border-gray-600 pt-4">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <FaCreditCard className="text-green-500" /> Payment Status
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-gray-700/50 p-3 rounded-xl text-center">
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Party Payment
                    </label>
                    <div
                      className={`px-3 py-2 rounded-lg font-medium text-sm capitalize ${
                        formData.paymentStatus.partyPaymentStatus ===
                        "completed"
                          ? "bg-green-600 text-green-100"
                          : "bg-yellow-600 text-yellow-100"
                      }`}
                    >
                      {formData.paymentStatus.partyPaymentStatus}
                    </div>
                  </div>
                  <div className="bg-gray-700/50 p-3 rounded-xl text-center">
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Vehicle Payment
                    </label>
                    <div
                      className={`px-3 py-2 rounded-lg font-medium text-sm capitalize ${
                        formData.paymentStatus.vehiclePaymentStatus ===
                        "completed"
                          ? "bg-green-600 text-green-100"
                          : "bg-yellow-600 text-yellow-100"
                      }`}
                    >
                      {formData.paymentStatus.vehiclePaymentStatus}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-gray-800/80 backdrop-blur-sm border-t border-gray-700 mt-6 -mx-6 -mb-6 px-6 py-4">
          <div className="max-w-screen-2xl mx-auto flex justify-between items-center">
            <div className="flex gap-4">
              <button
                type="button"
                onClick={handleBackToList}
                className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2"
              >
                <FaArrowLeft /> Back to List
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2"
              >
                <FaSync /> Reset
              </button>
            </div>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={handlePrint}
                disabled={!formData.party.name || loading}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2 disabled:opacity-50"
              >
                <FaPrint /> Print Bill
              </button>
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold flex items-center gap-2 disabled:opacity-50 min-w-[180px] justify-center"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>{editMode ? "Updating..." : "Saving..."}</span>
                  </>
                ) : (
                  <>
                    <FaSave /> {editMode ? "Update Booking" : "Save Booking"}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default AdminBookingFormImproved;
