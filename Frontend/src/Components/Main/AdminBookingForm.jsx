import React, { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchParties } from "../../Store/Slices/partySlice";
import { fetchVehicles } from "../../Store/Slices/vehicleSlice";
import {
  fetchLastBookingNo,
  createBooking,
} from "../../Store/Slices/bookingSlice";
import AutoCompleteInput from "./AutoCompleteInput";
import { fetchMasters } from "../../Store/Slices/masterSlice";
import {
  FaPrint,
  FaSave,
  FaRupeeSign,
  FaFileInvoice,
  FaCalendarAlt,
  FaUser,
  FaTruck,
  FaRoute,
  FaMoneyBillWave,
  FaTruckLoading,
  FaCreditCard,
} from "react-icons/fa";

const AdminBookingForm = () => {
  const dispatch = useDispatch();
  const printRef = useRef();

  const [toast, setToast] = useState(null);
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [activeSection, setActiveSection] = useState("basic");

  const { parties } = useSelector((state) => state.party);
  const { vehicles } = useSelector((state) => state.vehicle);
  const { lastBookingNo, loading } = useSelector((state) => state.booking);
  const { user: profile } = useSelector((state) => state.profile);
  const { masters } = useSelector((state) => state.master);

  const [formData, setFormData] = useState({
    bookingNo: "",
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
      vehicleCostParty: "",
      commission: "",
      tds: "",
      hamali: "",
      stCharges: "",
      otherCharges: "",
      totalAmount: "",
      partyAdvance: "",
      partyBalance: "",
    },
    vehiclePayment: {
      actualVehicleCost: "",
      vehicleAdvance: "",
      vehicleBalance: "",
    },
    delivery: { status: "pending", remarks: "", proofImage: null },
    paymentStatus: {
      partyPaymentStatus: "pending",
      vehiclePaymentStatus: "pending",
    },
  });

  // Reset form function
  const resetForm = () => {
    setFormData({
      bookingNo: "",
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
        vehicleCostParty: "",
        commission: "",
        tds: "",
        hamali: "",
        stCharges: "",
        otherCharges: "",
        totalAmount: "",
        partyAdvance: "",
        partyBalance: "",
      },
      vehiclePayment: {
        actualVehicleCost: "",
        vehicleAdvance: "",
        vehicleBalance: "",
      },
      delivery: { status: "pending", remarks: "", proofImage: null },
      paymentStatus: {
        partyPaymentStatus: "pending",
        vehiclePaymentStatus: "pending",
      },
    });
  };

  // Fetch initial data
  useEffect(() => {
    dispatch(fetchParties());
    dispatch(fetchVehicles());
    dispatch(fetchLastBookingNo());
    dispatch(fetchMasters());
  }, [dispatch]);

  // Auto set booking number
  useEffect(() => {
    if (lastBookingNo) {
      const nextBookingNo = incrementBookingNo(lastBookingNo);
      setFormData((prev) => ({ ...prev, bookingNo: nextBookingNo }));
    } else {
      // If no previous booking exists, start with B0001
      setFormData((prev) => ({ ...prev, bookingNo: "NH0001" }));
    }
  }, [lastBookingNo,resetForm]);

  // Sync GST No from profile
  useEffect(() => {
    if (profile?.gstNumber) {
      setFormData((prev) => ({ ...prev, ourGstNo: profile.gstNumber }));
    }
  }, [profile]);

  // And update the incrementBookingNo function to handle empty cases
  const incrementBookingNo = (lastNo) => {
    if (!lastNo) return "NH0001";
    const prefixMatch = lastNo.match(/^[A-Za-z]+/);
    const prefix = prefixMatch ? prefixMatch[0] : "NH";
    const numPart = parseInt(lastNo.replace(/\D/g, ""), 10) || 0;
    return `${prefix}${String(numPart + 1).padStart(4, "0")}`;
  };

  // Handlers
  const handleDateChange = (e) => {
    setFormData({ ...formData, bookingDate: e.target.value });
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

  // Auto-calculate total and balances
  useEffect(() => {
    const {
      vehicleCostParty,
      commission,
      tds,
      hamali,
      stCharges,
      otherCharges,
      partyAdvance,
    } = formData.charges;

    const vcp = parseFloat(vehicleCostParty) || 0;
    const com = parseFloat(commission) || 0;
    const t = parseFloat(tds) || 0;
    const h = parseFloat(hamali) || 0;
    const st = parseFloat(stCharges) || 0;
    const other = parseFloat(otherCharges) || 0;
    const advance = parseFloat(partyAdvance) || 0;

    const total = vcp + com + t + h + st + other;
    const balance = total - advance;

    setFormData((prev) => ({
      ...prev,
      charges: {
        ...prev.charges,
        totalAmount: total || "",
        partyBalance: balance || "",
      },
    }));
  }, [
    formData.charges.vehicleCostParty,
    formData.charges.commission,
    formData.charges.tds,
    formData.charges.hamali,
    formData.charges.stCharges,
    formData.charges.otherCharges,
    formData.charges.partyAdvance,
  ]);

  useEffect(() => {
    const actualCost =
      parseFloat(formData.vehiclePayment.actualVehicleCost) || 0;
    const advance = parseFloat(formData.vehiclePayment.vehicleAdvance) || 0;
    const balance = actualCost - advance;
    setFormData((prev) => ({
      ...prev,
      vehiclePayment: {
        ...prev.vehiclePayment,
        vehicleBalance: isNaN(balance) ? "" : balance,
      },
    }));
  }, [
    formData.vehiclePayment.actualVehicleCost,
    formData.vehiclePayment.vehicleAdvance,
  ]);

  // Build FormData for API
  const buildBookingFormData = (data) => {
    const fd = new FormData();
    const safeAppend = (key, value) => {
      fd.append(key, value !== undefined && value !== null ? value : "");
    };

    safeAppend("bookingNo", data.bookingNo);
    safeAppend("bookingDate", data.bookingDate);
    safeAppend("ourGstNo", data.ourGstNo);

    // Party
    safeAppend("partyName", data.party?.name);
    safeAppend("partyAddress", data.party?.address);
    safeAppend("partyContact", data.party?.contact);
    safeAppend("partyGstNo", data.party?.gstNo);

    // Vehicle
    safeAppend("vehicleNo", data.vehicle?.vehicleNumber);
    safeAppend("ownerName", data.vehicle?.ownerName);
    safeAppend("ownerContact", data.vehicle?.contactNumber);
    safeAppend("vehicleType", data.vehicle?.vehicleType);

    // Journey
    safeAppend("fromLocation", data.journey?.fromLocation);
    safeAppend("toLocation", data.journey?.toLocation);

    // Charges & Payments (as JSON strings)
    safeAppend("charges", JSON.stringify(data.charges || {}));
    safeAppend("vehiclePayment", JSON.stringify(data.vehiclePayment || {}));

    // Delivery
    safeAppend("deliveryStatus", data.delivery?.status);
    safeAppend("deliveryRemarks", data.delivery?.remarks);
    if (data.delivery?.proofImage) {
      fd.append("proofImage", data.delivery.proofImage);
    }

    // Payment Status
    safeAppend("paymentStatus", JSON.stringify(data.paymentStatus || {}));

    return fd;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (
      !formData.bookingNo ||
      !formData.party.name ||
      !formData.vehicle.vehicleNumber ||
      !formData.journey.fromLocation ||
      !formData.journey.toLocation
    ) {
      setToast({ message: "Please fill all required fields!", type: "error" });
      setTimeout(() => setToast(null), 3000);
      return;
    }

    const bookingFormData = buildBookingFormData(formData);

    dispatch(createBooking(bookingFormData))
      .unwrap()
      .then(() => {
        setToast({ message: "Booking created successfully!", type: "success" });
        resetForm();
        setTimeout(() => setToast(null), 3000);
        incrementBookingNo(lastBookingNo);
      })
      .catch((err) => {
        const message =
          err?.message || (err?.error && err.error.includes("duplicate"))
            ? "Duplicate booking number!"
            : "Failed to create booking";

        console.error("Booking creation failed:", message);
        setToast({ message, type: "error" });
        setTimeout(() => setToast(null), 3000);
      });
  };

  const handlePrint = () => {
    setShowPrintPreview(true);
  };

  const closePrintPreview = () => {
    setShowPrintPreview(false);
  };

  const PrintBill = () => {
    // Calculate profit values
    const partyTotal = parseFloat(formData.charges.vehicleCostParty) || 0;
    const commission = parseFloat(formData.charges.commission) || 0;
    const tds = parseFloat(formData.charges.tds) || 0;
    const hamali = parseFloat(formData.charges.hamali) || 0;
    const stCharges = parseFloat(formData.charges.stCharges) || 0;
    const otherCharges = parseFloat(formData.charges.otherCharges) || 0;
    const partyAdvance = parseFloat(formData.charges.partyAdvance) || 0;

    const vehicleActualCost =
      parseFloat(formData.vehiclePayment.actualVehicleCost) || 0;
    const vehicleAdvance =
      parseFloat(formData.vehiclePayment.vehicleAdvance) || 0;

    const totalBillToParty =
      partyTotal + commission + tds + hamali + stCharges + otherCharges;
    const partyBalance = totalBillToParty - partyAdvance - tds;

    const totalPaidToVehicle = vehicleActualCost;
    const vehicleBalance = vehicleActualCost - vehicleAdvance;

    const hiddenProfit = partyTotal - vehicleActualCost;
    const netProfit = hiddenProfit + commission + tds;
    const profitMargin =
      totalBillToParty > 0
        ? ((netProfit / totalBillToParty) * 100).toFixed(1)
        : 0;
    const roi =
      vehicleActualCost > 0
        ? ((netProfit / vehicleActualCost) * 100).toFixed(1)
        : 0;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 overflow-y-auto">
        <div className="bg-gray-900 p-6 rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto border border-gray-700">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-white">Booking Bills</h2>
            <button
              onClick={closePrintPreview}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
            >
              Close
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* PARTY BILL TEMPLATE */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              {/* Company Header */}
              <div className="bg-gradient-to-r from-indigo-700 to-purple-600 text-white p-6 text-center">
                <div className="w-20 h-20 bg-white rounded-full mx-auto mb-4 flex items-center justify-center text-indigo-700 text-3xl font-bold">
                  🚗
                </div>
                <div className="text-xl font-bold mb-2 text-yellow-300">
                  TRANSPORT SOLUTIONS PVT. LTD.
                </div>
                <div className="text-sm opacity-90">
                  📍 123, Industrial Area, Transport Nagar, Mumbai - 400001
                  <br />
                  📞 +91-98765-43210 | ✉️ info@transportsolutions.com
                  <br />
                  🆔 GST: {formData.ourGstNo} | 🏢 CIN: U63030MH2020PTC123456
                </div>
              </div>

              <div className="bg-gradient-to-r from-indigo-600 to-purple-500 text-white p-4 text-center">
                <h2 className="text-xl font-bold">📄 TRANSPORTATION INVOICE</h2>
                <p className="text-sm">FOR CUSTOMER</p>
              </div>

              <div className="p-6">
                <div className="text-xl font-bold text-center text-blue-600 mb-6">
                  PARTY BILL
                </div>

                <div className="mb-6 pb-4 border-b">
                  <div className="font-semibold text-gray-700 mb-3 uppercase text-sm tracking-wider">
                    📋 Booking Details
                  </div>
                  <div className="flex justify-between py-2 border-b border-dashed">
                    <span>Booking No:</span>
                    <span className="font-bold">{formData.bookingNo}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-dashed">
                    <span>Date:</span>
                    <span>
                      {new Date(formData.bookingDate).toLocaleDateString(
                        "en-IN"
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span>Route:</span>
                    <span>
                      {formData.journey.fromLocation} →{" "}
                      {formData.journey.toLocation}
                    </span>
                  </div>
                </div>

                <div className="mb-6 pb-4 border-b">
                  <div className="font-semibold text-gray-700 mb-3 uppercase text-sm tracking-wider">
                    👥 Party Information
                  </div>
                  <div className="flex justify-between py-2 border-b border-dashed">
                    <span>Party Name:</span>
                    <span>{formData.party.name}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-dashed">
                    <span>GST No:</span>
                    <span>{formData.party.gstNo || "N/A"}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span>Vehicle No:</span>
                    <span>{formData.vehicle.vehicleNumber}</span>
                  </div>
                </div>

                <div className="mb-6">
                  <div className="font-semibold text-gray-700 mb-3 uppercase text-sm tracking-wider">
                    💰 Charges
                  </div>
                  <div className="bg-yellow-100 rounded-md p-3 mb-2">
                    <div className="flex justify-between font-semibold text-yellow-900">
                      <span>Vehicle Transportation:</span>
                      <span>₹{partyTotal.toLocaleString("en-IN")}</span>
                    </div>
                  </div>
                  <div className="flex justify-between py-2 border-b border-dashed">
                    <span>Service Charges:</span>
                    <span>₹{stCharges.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-dashed">
                    <span>Commission:</span>
                    <span>₹{commission.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between py-3 font-bold text-lg bg-gray-100 rounded-md px-3 mt-3 border-2 border-indigo-500">
                    <span>Gross Total:</span>
                    <span>₹{totalBillToParty.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-dashed">
                    <span>
                      Less: TDS (
                      {tds > 0 ? ((tds / partyTotal) * 100).toFixed(2) : "0"}%):
                    </span>
                    <span>-₹{tds.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-dashed">
                    <span>Less: Advance:</span>
                    <span>-₹{partyAdvance.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between py-3 font-bold text-lg bg-gray-100 rounded-md px-3 mt-2 border-2 border-red-500 text-red-600">
                    <span>Balance Due:</span>
                    <span>₹{partyBalance.toLocaleString("en-IN")}</span>
                  </div>
                </div>

                <div className="flex justify-between mt-8 pt-4 border-t-2 border-dashed">
                  <div className="text-center w-5/12">
                    <div className="border-b-2 border-gray-400 h-10 mb-2"></div>
                    <div className="text-sm">Prepared By</div>
                  </div>
                  <div className="text-center w-5/12">
                    <div className="border-b-2 border-gray-400 h-10 mb-2"></div>
                    <div className="text-sm">Authorized Signatory</div>
                  </div>
                </div>
              </div>
            </div>

            {/* VEHICLE BILL TEMPLATE */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              {/* Company Header */}
              <div className="bg-gradient-to-r from-indigo-700 to-purple-600 text-white p-6 text-center">
                <div className="w-20 h-20 bg-white rounded-full mx-auto mb-4 flex items-center justify-center text-indigo-700 text-3xl font-bold">
                  🚛
                </div>
                <div className="text-xl font-bold mb-2 text-yellow-300">
                  TRANSPORT SOLUTIONS PVT. LTD.
                </div>
                <div className="text-sm opacity-90">
                  📍 123, Industrial Area, Transport Nagar, Mumbai - 400001
                  <br />
                  📞 +91-98765-43210 | ✉️ info@transportsolutions.com
                  <br />
                  🆔 GST: {formData.ourGstNo} | 🏢 CIN: U63030MH2020PTC123456
                </div>
              </div>

              <div className="bg-gradient-to-r from-indigo-600 to-purple-500 text-white p-4 text-center">
                <h2 className="text-xl font-bold">
                  🚛 VEHICLE PAYMENT VOUCHER
                </h2>
                <p className="text-sm">FOR VEHICLE OWNER</p>
              </div>

              <div className="p-6">
                <div className="text-xl font-bold text-center text-green-600 mb-6">
                  VEHICLE PAYMENT SLIP
                </div>

                <div className="mb-6 pb-4 border-b">
                  <div className="font-semibold text-gray-700 mb-3 uppercase text-sm tracking-wider">
                    📋 Trip Details
                  </div>
                  <div className="flex justify-between py-2 border-b border-dashed">
                    <span>Booking No:</span>
                    <span className="font-bold">{formData.bookingNo}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-dashed">
                    <span>Date:</span>
                    <span>
                      {new Date(formData.bookingDate).toLocaleDateString(
                        "en-IN"
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span>Route:</span>
                    <span>
                      {formData.journey.fromLocation} →{" "}
                      {formData.journey.toLocation}
                    </span>
                  </div>
                </div>

                <div className="mb-6 pb-4 border-b">
                  <div className="font-semibold text-gray-700 mb-3 uppercase text-sm tracking-wider">
                    🚛 Vehicle Information
                  </div>
                  <div className="flex justify-between py-2 border-b border-dashed">
                    <span>Vehicle Owner:</span>
                    <span>{formData.vehicle.ownerName}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-dashed">
                    <span>Vehicle No:</span>
                    <span>{formData.vehicle.vehicleNumber}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span>Contact:</span>
                    <span>{formData.vehicle.contactNumber}</span>
                  </div>
                </div>

                <div className="mb-6">
                  <div className="font-semibold text-gray-700 mb-3 uppercase text-sm tracking-wider">
                    💳 Payment Details
                  </div>
                  <div className="bg-yellow-100 rounded-md p-3 mb-2">
                    <div className="flex justify-between font-semibold text-yellow-900">
                      <span>Vehicle Hire Charges:</span>
                      <span>₹{vehicleActualCost.toLocaleString("en-IN")}</span>
                    </div>
                  </div>
                  <div className="flex justify-between py-2 border-b border-dashed">
                    <span>Advance Paid:</span>
                    <span>₹{vehicleAdvance.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between py-3 font-bold text-lg bg-gray-100 rounded-md px-3 mt-3 border-2 border-indigo-500">
                    <span>Total Paid:</span>
                    <span>₹{vehicleAdvance.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between py-3 font-bold text-lg bg-gray-100 rounded-md px-3 mt-2 border-2 border-red-500 text-red-600">
                    <span>Balance Remaining:</span>
                    <span>₹{vehicleBalance.toLocaleString("en-IN")}</span>
                  </div>
                </div>

                <div className="flex justify-between mt-8 pt-4 border-t-2 border-dashed">
                  <div className="text-center w-5/12">
                    <div className="border-b-2 border-gray-400 h-10 mb-2"></div>
                    <div className="text-sm">Paid By (Company)</div>
                  </div>
                  <div className="text-center w-5/12">
                    <div className="border-b-2 border-gray-400 h-10 mb-2"></div>
                    <div className="text-sm">Received By (Vehicle Owner)</div>
                  </div>
                </div>
              </div>
            </div>

            {/* INTERNAL REPORT TEMPLATE */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              {/* Company Header */}
              <div className="bg-gradient-to-r from-indigo-700 to-purple-600 text-white p-6 text-center">
                <div className="w-20 h-20 bg-white rounded-full mx-auto mb-4 flex items-center justify-center text-indigo-700 text-3xl font-bold">
                  📊
                </div>
                <div className="text-xl font-bold mb-2 text-yellow-300">
                  TRANSPORT SOLUTIONS PVT. LTD.
                </div>
                <div className="text-sm opacity-90">
                  📍 123, Industrial Area, Transport Nagar, Mumbai - 400001
                  <br />
                  📞 +91-98765-43210 | ✉️ info@transportsolutions.com
                  <br />
                  🆔 GST: {formData.ourGstNo} | 🏢 CIN: U63030MH2020PTC123456
                </div>
              </div>

              <div className="bg-gradient-to-r from-indigo-600 to-purple-500 text-white p-4 text-center">
                <h2 className="text-xl font-bold">📊 INTERNAL PROFIT REPORT</h2>
                <div className="bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-1 rounded-full text-xs font-bold uppercase inline-block transform -rotate-3 shadow-md mt-2">
                  CONFIDENTIAL
                </div>
              </div>

              <div className="p-6">
                <div className="text-xl font-bold text-center text-yellow-600 mb-6">
                  PROFIT ANALYSIS REPORT
                </div>

                <div className="mb-6 pb-4 border-b">
                  <div className="font-semibold text-gray-700 mb-3 uppercase text-sm tracking-wider">
                    📋 Deal Summary
                  </div>
                  <div className="flex justify-between py-2 border-b border-dashed">
                    <span>Booking No:</span>
                    <span className="font-bold">{formData.bookingNo}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-dashed">
                    <span>Party:</span>
                    <span>{formData.party.name}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-dashed">
                    <span>Vehicle Owner:</span>
                    <span>{formData.vehicle.ownerName}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span>Route:</span>
                    <span>
                      {formData.journey.fromLocation} →{" "}
                      {formData.journey.toLocation}
                    </span>
                  </div>
                </div>

                <div className="mb-6 pb-4 border-b">
                  <div className="font-semibold text-gray-700 mb-3 uppercase text-sm tracking-wider">
                    💰 Revenue Analysis
                  </div>
                  <div className="bg-green-100 rounded-md p-3 mb-2">
                    <div className="flex justify-between font-semibold text-green-900">
                      <span>Total Bill to Party:</span>
                      <span>₹{totalBillToParty.toLocaleString("en-IN")}</span>
                    </div>
                  </div>
                  <div className="flex justify-between py-2 border-b border-dashed">
                    <span>Party Balance Due:</span>
                    <span>₹{partyBalance.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span>TDS Recovered:</span>
                    <span>₹{tds.toLocaleString("en-IN")}</span>
                  </div>
                </div>

                <div className="mb-6 pb-4 border-b">
                  <div className="font-semibold text-gray-700 mb-3 uppercase text-sm tracking-wider">
                    💸 Cost Analysis
                  </div>
                  <div className="bg-red-100 rounded-md p-3 mb-2">
                    <div className="flex justify-between font-semibold text-red-900">
                      <span>Actually Paid to Vehicle:</span>
                      <span>₹{vehicleActualCost.toLocaleString("en-IN")}</span>
                    </div>
                  </div>
                  <div className="flex justify-between py-2 border-b border-dashed">
                    <span>Hamali Charges:</span>
                    <span>₹{hamali.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-dashed">
                    <span>ST/Toll Charges:</span>
                    <span>₹{stCharges.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span>Other Expenses:</span>
                    <span>₹{otherCharges.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="bg-red-100 rounded-md p-3 mt-3">
                    <div className="flex justify-between font-semibold text-red-900">
                      <span>Total Our Expenses:</span>
                      <span>
                        ₹
                        {(
                          vehicleActualCost +
                          hamali +
                          stCharges +
                          otherCharges
                        ).toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mb-6 pb-4 border-b">
                  <div className="font-semibold text-gray-700 mb-3 uppercase text-sm tracking-wider">
                    🎯 Profit Breakdown
                  </div>
                  <div className="bg-green-100 rounded-md p-3 mb-2">
                    <div className="flex justify-between font-semibold text-green-900">
                      <span>Hidden Vehicle Profit:</span>
                      <span>₹{hiddenProfit.toLocaleString("en-IN")}</span>
                    </div>
                    <div className="text-xs text-green-700 mt-1">
                      (₹{partyTotal.toLocaleString("en-IN")} - ₹
                      {vehicleActualCost.toLocaleString("en-IN")})
                    </div>
                  </div>
                  <div className="bg-green-100 rounded-md p-3 mb-2">
                    <div className="flex justify-between font-semibold text-green-900">
                      <span>Commission Earned:</span>
                      <span>₹{commission.toLocaleString("en-IN")}</span>
                    </div>
                  </div>
                  <div className="bg-green-100 rounded-md p-3 mb-2">
                    <div className="flex justify-between font-semibold text-green-900">
                      <span>Service Charges:</span>
                      <span>₹{stCharges.toLocaleString("en-IN")}</span>
                    </div>
                  </div>
                  <div className="bg-green-100 rounded-md p-3">
                    <div className="flex justify-between font-semibold text-green-900">
                      <span>TDS Recovered:</span>
                      <span>₹{tds.toLocaleString("en-IN")}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-gray-800 to-gray-900 text-white p-4 rounded-lg mb-6 text-center">
                  <div className="text-2xl font-bold text-green-400 mb-2">
                    NET PROFIT: ₹{netProfit.toLocaleString("en-IN")}
                  </div>
                  <div>
                    Profit Margin: {profitMargin}% | ROI: {roi}%
                  </div>
                  <div className="text-xs opacity-80 mt-2">
                    Revenue: ₹{totalBillToParty.toLocaleString("en-IN")} -
                    Expenses: ₹
                    {(
                      vehicleActualCost +
                      hamali +
                      stCharges +
                      otherCharges
                    ).toLocaleString("en-IN")}{" "}
                    = Profit: ₹{(netProfit - tds).toLocaleString("en-IN")} +
                    TDS: ₹{tds.toLocaleString("en-IN")}
                  </div>
                </div>

                <div className="mb-6">
                  <div className="font-semibold text-gray-700 mb-3 uppercase text-sm tracking-wider">
                    💳 Payment Status
                  </div>
                  <div className="flex justify-between py-2 border-b border-dashed">
                    <span>Party Outstanding:</span>
                    <span className="text-red-600">
                      ₹{partyBalance.toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span>Vehicle Outstanding:</span>
                    <span className="text-red-600">
                      ₹{vehicleBalance.toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className="flex justify-between py-3 font-bold text-lg bg-gray-100 rounded-md px-3 mt-3 border-2 border-indigo-500">
                    <span>Cash Flow Status:</span>
                    <span className="text-green-600">
                      {partyBalance + vehicleBalance > 0
                        ? "POSITIVE"
                        : "NEGATIVE"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-center">
            <button
              onClick={() => window.print()}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg flex items-center gap-2 hover:bg-blue-700 text-lg"
            >
              <FaPrint /> Print All Bills
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderSection = () => {
    switch (activeSection) {
      case "basic":
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                  Booking No
                </label>
                <input
                  type="text"
                  value={formData.bookingNo}
                  readOnly
                  className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                  <FaCalendarAlt /> Booking Date
                </label>
                <input
                  type="date"
                  value={formData.bookingDate}
                  onChange={handleDateChange}
                  className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                  Our GST No
                </label>
                <input
                  type="text"
                  value={formData.ourGstNo}
                  readOnly
                  className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white"
                />
              </div>
            </div>
          </div>
        );
      case "party":
        return (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <FaUser /> Party Details
            </h2>
            <AutoCompleteInput
              data={parties}
              labelKey="name"
              placeholder="Search party name..."
              value={formData.party.name}
              onChangeValue={(val) =>
                setFormData((prev) => ({
                  ...prev,
                  party: { ...prev.party, name: val },
                }))
              }
              onSelect={handleSelectParty}
              darkMode
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                  Party Address
                </label>
                <input
                  type="text"
                  value={formData.party.address}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      party: { ...prev.party, address: e.target.value },
                    }))
                  }
                  placeholder="Party address"
                  className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                  Party Contact
                </label>
                <input
                  type="text"
                  value={formData.party.contact}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      party: { ...prev.party, contact: e.target.value },
                    }))
                  }
                  placeholder="Party contact"
                  className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">
                Party GST No
              </label>
              <input
                type="text"
                value={formData.party.gstNo}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    party: { ...prev.party, gstNo: e.target.value },
                  }))
                }
                placeholder="Party GST No"
                className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white"
              />
            </div>
          </div>
        );
      case "vehicle":
        return (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <FaTruck /> Vehicle Details
            </h2>
            <AutoCompleteInput
              data={vehicles}
              labelKey="vehicleNumber"
              placeholder="Search vehicle number..."
              value={formData.vehicle.vehicleNumber}
              onChangeValue={(val) =>
                setFormData((prev) => ({
                  ...prev,
                  vehicle: { ...prev.vehicle, vehicleNumber: val },
                }))
              }
              onSelect={handleSelectVehicle}
              darkMode
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                  Owner Name
                </label>
                <input
                  type="text"
                  value={formData.vehicle.ownerName}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      vehicle: { ...prev.vehicle, ownerName: e.target.value },
                    }))
                  }
                  placeholder="Owner name"
                  className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                  Owner Contact
                </label>
                <input
                  type="text"
                  value={formData.vehicle.contactNumber}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      vehicle: {
                        ...prev.vehicle,
                        contactNumber: e.target.value,
                      },
                    }))
                  }
                  placeholder="Owner contact"
                  className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">
                Vehicle Type
              </label>
              <input
                type="text"
                value={formData.vehicle.vehicleType}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    vehicle: { ...prev.vehicle, vehicleType: e.target.value },
                  }))
                }
                placeholder="Vehicle type"
                className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white"
              />
            </div>
          </div>
        );
      case "journey":
        return (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <FaRoute /> Journey Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                  From Location
                </label>
                <AutoCompleteInput
                  data={masters}
                  labelKey="name"
                  placeholder="From Location..."
                  value={formData.journey.fromLocation}
                  onChangeValue={(val) =>
                    setFormData((prev) => ({
                      ...prev,
                      journey: { ...prev.journey, fromLocation: val },
                    }))
                  }
                  onSelect={(val) =>
                    setFormData((prev) => ({
                      ...prev,
                      journey: { ...prev.journey, fromLocation: val },
                    }))
                  }
                  darkMode
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                  To Location
                </label>
                <AutoCompleteInput
                  data={masters}
                  labelKey="name"
                  placeholder="To Location..."
                  value={formData.journey.toLocation}
                  onChangeValue={(val) =>
                    setFormData((prev) => ({
                      ...prev,
                      journey: { ...prev.journey, toLocation: val },
                    }))
                  }
                  onSelect={(val) =>
                    setFormData((prev) => ({
                      ...prev,
                      journey: { ...prev.journey, toLocation: val },
                    }))
                  }
                  darkMode
                />
              </div>
            </div>
          </div>
        );
      case "charges":
        return (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <FaMoneyBillWave /> Party Charges
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                  Vehicle Cost Party
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-400">
                    <FaRupeeSign />
                  </span>
                  <input
                    type="text"
                    value={formData.charges.vehicleCostParty}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        charges: {
                          ...prev.charges,
                          vehicleCostParty: e.target.value,
                        },
                      }))
                    }
                    className="w-full bg-gray-700 border border-gray-600 rounded-md pl-8 pr-3 py-2 text-white"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                  Commission
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-400">
                    <FaRupeeSign />
                  </span>
                  <input
                    type="text"
                    value={formData.charges.commission}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        charges: {
                          ...prev.charges,
                          commission: e.target.value,
                        },
                      }))
                    }
                    className="w-full bg-gray-700 border border-gray-600 rounded-md pl-8 pr-3 py-2 text-white"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                  TDS
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-400">
                    <FaRupeeSign />
                  </span>
                  <input
                    type="text"
                    value={formData.charges.tds}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        charges: { ...prev.charges, tds: e.target.value },
                      }))
                    }
                    className="w-full bg-gray-700 border border-gray-600 rounded-md pl-8 pr-3 py-2 text-white"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                  Hamali
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-400">
                    <FaRupeeSign />
                  </span>
                  <input
                    type="text"
                    value={formData.charges.hamali}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        charges: { ...prev.charges, hamali: e.target.value },
                      }))
                    }
                    className="w-full bg-gray-700 border border-gray-600 rounded-md pl-8 pr-3 py-2 text-white"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                  ST Charges
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-400">
                    <FaRupeeSign />
                  </span>
                  <input
                    type="text"
                    value={formData.charges.stCharges}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        charges: { ...prev.charges, stCharges: e.target.value },
                      }))
                    }
                    className="w-full bg-gray-700 border border-gray-600 rounded-md pl-8 pr-3 py-2 text-white"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                  Other Charges
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-400">
                    <FaRupeeSign />
                  </span>
                  <input
                    type="text"
                    value={formData.charges.otherCharges}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        charges: {
                          ...prev.charges,
                          otherCharges: e.target.value,
                        },
                      }))
                    }
                    className="w-full bg-gray-700 border border-gray-600 rounded-md pl-8 pr-3 py-2 text-white"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                  Total Amount
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-400">
                    <FaRupeeSign />
                  </span>
                  <input
                    type="text"
                    value={formData.charges.totalAmount}
                    readOnly
                    className="w-full bg-gray-600 border border-gray-500 rounded-md pl-8 pr-3 py-2 text-white"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                  Party Advance
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-400">
                    <FaRupeeSign />
                  </span>
                  <input
                    type="text"
                    value={formData.charges.partyAdvance}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        charges: {
                          ...prev.charges,
                          partyAdvance: e.target.value,
                        },
                      }))
                    }
                    className="w-full bg-gray-700 border border-gray-600 rounded-md pl-8 pr-3 py-2 text-white"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                  Party Balance
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-400">
                    <FaRupeeSign />
                  </span>
                  <input
                    type="text"
                    value={formData.charges.partyBalance}
                    readOnly
                    className="w-full bg-gray-600 border border-gray-500 rounded-md pl-8 pr-3 py-2 text-white"
                  />
                </div>
              </div>
            </div>
          </div>
        );
      case "vehiclePayments":
        return (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <FaTruckLoading /> Vehicle Payments
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                  Actual Vehicle Cost
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-400">
                    <FaRupeeSign />
                  </span>
                  <input
                    type="text"
                    value={formData.vehiclePayment.actualVehicleCost}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        vehiclePayment: {
                          ...prev.vehiclePayment,
                          actualVehicleCost: e.target.value,
                        },
                      }))
                    }
                    className="w-full bg-gray-700 border border-gray-600 rounded-md pl-8 pr-3 py-2 text-white"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                  Vehicle Advance
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-400">
                    <FaRupeeSign />
                  </span>
                  <input
                    type="text"
                    value={formData.vehiclePayment.vehicleAdvance}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        vehiclePayment: {
                          ...prev.vehiclePayment,
                          vehicleAdvance: e.target.value,
                        },
                      }))
                    }
                    className="w-full bg-gray-700 border border-gray-600 rounded-md pl-8 pr-3 py-2 text-white"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                  Vehicle Balance
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-400">
                    <FaRupeeSign />
                  </span>
                  <input
                    type="text"
                    value={formData.vehiclePayment.vehicleBalance}
                    readOnly
                    className="w-full bg-gray-600 border border-gray-500 rounded-md pl-8 pr-3 py-2 text-white"
                  />
                </div>
              </div>
            </div>
          </div>
        );
      case "delivery":
        return (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <FaTruckLoading /> Delivery Status
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                  Status
                </label>
                <select
                  value={formData.delivery.status}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      delivery: { ...prev.delivery, status: e.target.value },
                    }))
                  }
                  className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white"
                >
                  <option value="pending">Pending</option>
                  <option value="received">Received</option>
                </select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="block text-sm font-medium text-gray-300">
                  Remarks
                </label>
                <input
                  type="text"
                  value={formData.delivery.remarks}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      delivery: { ...prev.delivery, remarks: e.target.value },
                    }))
                  }
                  className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white"
                />
              </div>
              <div className="space-y-2 md:col-span-3">
                <label className="block text-sm font-medium text-gray-300">
                  Proof Image
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      delivery: {
                        ...prev.delivery,
                        proofImage: e.target.files[0],
                      },
                    }))
                  }
                  className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white"
                />
              </div>
            </div>
          </div>
        );
      case "paymentStatus":
        return (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <FaCreditCard /> Payment Status
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                  Party Payment Status
                </label>
                <select
                  value={formData.paymentStatus.partyPaymentStatus}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      paymentStatus: {
                        ...prev.paymentStatus,
                        partyPaymentStatus: e.target.value,
                      },
                    }))
                  }
                  className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white"
                >
                  <option value="pending">Pending</option>
                  <option value="partial">Partial</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                  Vehicle Payment Status
                </label>
                <select
                  value={formData.paymentStatus.vehiclePaymentStatus}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      paymentStatus: {
                        ...prev.paymentStatus,
                        vehiclePaymentStatus: e.target.value,
                      },
                    }))
                  }
                  className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white"
                >
                  <option value="pending">Pending</option>
                  <option value="partial">Partial</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-gray-900 min-h-screen p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <FaFileInvoice /> Booking Form
          </h1>
          <div className="flex gap-3">
            <button
              onClick={handlePrint}
              disabled={!formData.bookingNo}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                !formData.bookingNo
                  ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700 text-white"
              }`}
            >
              <FaPrint /> Print Preview
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex overflow-x-auto mb-6 scrollbar-hide">
          <button
            onClick={() => setActiveSection("basic")}
            className={`px-4 py-2 whitespace-nowrap ${
              activeSection === "basic"
                ? "bg-blue-600 text-white"
                : "bg-gray-800 text-gray-300 hover:bg-gray-700"
            }`}
          >
            Basic Info
          </button>
          <button
            onClick={() => setActiveSection("party")}
            className={`px-4 py-2 whitespace-nowrap ${
              activeSection === "party"
                ? "bg-blue-600 text-white"
                : "bg-gray-800 text-gray-300 hover:bg-gray-700"
            }`}
          >
            Party Details
          </button>
          <button
            onClick={() => setActiveSection("vehicle")}
            className={`px-4 py-2 whitespace-nowrap ${
              activeSection === "vehicle"
                ? "bg-blue-600 text-white"
                : "bg-gray-800 text-gray-300 hover:bg-gray-700"
            }`}
          >
            Vehicle Details
          </button>
          <button
            onClick={() => setActiveSection("journey")}
            className={`px-4 py-2 whitespace-nowrap ${
              activeSection === "journey"
                ? "bg-blue-600 text-white"
                : "bg-gray-800 text-gray-300 hover:bg-gray-700"
            }`}
          >
            Journey
          </button>
          <button
            onClick={() => setActiveSection("charges")}
            className={`px-4 py-2 whitespace-nowrap ${
              activeSection === "charges"
                ? "bg-blue-600 text-white"
                : "bg-gray-800 text-gray-300 hover:bg-gray-700"
            }`}
          >
            Party Charges
          </button>
          <button
            onClick={() => setActiveSection("vehiclePayments")}
            className={`px-4 py-2 whitespace-nowrap ${
              activeSection === "vehiclePayments"
                ? "bg-blue-600 text-white"
                : "bg-gray-800 text-gray-300 hover:bg-gray-700"
            }`}
          >
            Vehicle Payments
          </button>
          <button
            onClick={() => setActiveSection("delivery")}
            className={`px-4 py-2 whitespace-nowrap ${
              activeSection === "delivery"
                ? "bg-blue-600 text-white"
                : "bg-gray-800 text-gray-300 hover:bg-gray-700"
            }`}
          >
            Delivery
          </button>
          <button
            onClick={() => setActiveSection("paymentStatus")}
            className={`px-4 py-2 whitespace-nowrap ${
              activeSection === "paymentStatus"
                ? "bg-blue-600 text-white"
                : "bg-gray-800 text-gray-300 hover:bg-gray-700"
            }`}
          >
            Payment Status
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700"
        >
          {renderSection()}

          {/* Form Actions - Always visible at bottom */}
          <div className="flex justify-end gap-4 mt-8 pt-4 border-t border-gray-700">
            <button
              type="button"
              onClick={resetForm}
              className="px-6 py-2 border border-gray-600 rounded-md text-gray-300 hover:bg-gray-700"
            >
              Reset
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              <FaSave /> {loading ? "Saving..." : "Save Booking"}
            </button>
          </div>
        </form>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div
          style={{ zIndex: 9999 }}
          className={`fixed top-5 right-5 px-4 py-2 rounded shadow-lg text-white transition-opacity duration-300
    ${toast.type === "success" ? "bg-green-600" : "bg-red-600"}`}
        >
          {toast.message}
        </div>
      )}

      {/* Print Preview Modal */}
      {showPrintPreview && <PrintBill />}
    </div>
  );
};

export default AdminBookingForm;
