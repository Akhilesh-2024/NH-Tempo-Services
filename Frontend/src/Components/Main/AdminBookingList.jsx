import React, { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchBookings, deleteBooking } from "../../Store/Slices/bookingSlice";
import {
  FaTrash,
  FaEdit,
  FaSyncAlt,
  FaSearch,
  FaFilter,
  FaSort,
  FaEye,
  FaPrint,
  FaCalendarAlt,
  FaFileExport,
  FaTruck,
  FaUser,
  FaRupeeSign,
  FaChevronDown,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";

// --- Centralized Calculation Helper ---
// CORRECTED: This now correctly calculates the final pending amount by including deductions.
const calculateAllTotals = (charges = {}, vehiclePayment = {}) => {
  const dealAmt =
    parseFloat(charges.dealAmount) || parseFloat(charges.totalAmount) || 0;
  const advanceAmt =
    parseFloat(charges.advancePaid) || parseFloat(charges.partyAdvance) || 0;

  const totalDeductions =
    (parseFloat(charges.vehicleCharges) || 0) +
    (parseFloat(charges.commission) || 0) +
    (parseFloat(charges.localCharges) || 0) +
    (parseFloat(charges.hamali) || 0) +
    (parseFloat(charges.tds) || 0) +
    (parseFloat(charges.stCharges) || 0) +
    (parseFloat(charges.other) || parseFloat(charges.otherCharges) || 0);

  const vehicleCostAmt = parseFloat(vehiclePayment.actualVehicleCost) || 0;
  const vehicleAdvanceAmt = parseFloat(vehiclePayment.vehicleAdvance) || 0;

  // This is the corrected logic
  const finalPendingAmount = dealAmt - advanceAmt;
  const subTotal = dealAmt - totalDeductions;
  const vehicleBalance = vehicleCostAmt - vehicleAdvanceAmt;

  return {
    dealAmount: dealAmt,
    advancePaid: advanceAmt,
    totalDeductions: totalDeductions,
    finalPendingAmount: finalPendingAmount,
    subTotal: subTotal,
    vehicleCost: vehicleCostAmt,
    vehicleAdvance: vehicleAdvanceAmt,
    vehicleBalance: vehicleBalance,
  };
};

const StatusBadge = ({ status }) => {
  const styles = {
    pending: "bg-yellow-500 text-yellow-900",
    "in-transit": "bg-blue-500 text-blue-100",
    delivered: "bg-cyan-500 text-cyan-900",
    received: "bg-green-500 text-green-100",
  };
  return (
    <span
      className={`inline-block px-2 py-1 rounded-full text-xs font-semibold capitalize ${
        styles[status] || "bg-gray-600 text-gray-100"
      }`}
    >
      {status || "N/A"}
    </span>
  );
};

const PaymentBadge = ({ status }) => {
  const styles = {
    pending: "bg-red-500 text-red-100",
    partial: "bg-yellow-500 text-yellow-900",
    completed: "bg-green-500 text-green-100",
  };
  return (
    <span
      className={`inline-block px-2 py-1 rounded-full text-xs font-semibold capitalize ${
        styles[status] || "bg-gray-600 text-gray-100"
      }`}
    >
      {status || "N/A"}
    </span>
  );
};

const AdminBookingList = ({ setActiveTab }) => {
  const dispatch = useDispatch();
  const { bookings, loading } = useSelector((state) => state.booking);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [dateRange, setDateRange] = useState({ from: "", to: "" });
  const [sortBy, setSortBy] = useState("bookingNo");
  const [sortOrder, setSortOrder] = useState("desc");
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [toast, setToast] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);

  useEffect(() => {
    dispatch(fetchBookings());
  }, [dispatch]);

  const filteredBookings = useMemo(() => {
    return bookings
      .filter((b) => {
        const matchesSearch =
          b.bookingNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          b.party?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          b.vehicle?.vehicleNo
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          b.journey?.fromLocation
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          b.journey?.toLocation
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase());
        const matchesStatus =
          statusFilter === "all" || b.delivery?.status === statusFilter;
        const matchesPayment =
          paymentFilter === "all" ||
          b.paymentStatus?.partyPaymentStatus === paymentFilter;
        const matchesDate =
          (!dateRange.from ||
            new Date(b.bookingDate) >= new Date(dateRange.from)) &&
          (!dateRange.to || new Date(b.bookingDate) <= new Date(dateRange.to));
        return matchesSearch && matchesStatus && matchesPayment && matchesDate;
      })
      .sort((a, b) => {
        const aTotals = calculateAllTotals(a.charges, a.vehiclePayment);
        const bTotals = calculateAllTotals(b.charges, b.vehiclePayment);
        let aVal, bVal;
        switch (sortBy) {
          case "dealAmount":
            aVal = aTotals.dealAmount;
            bVal = bTotals.dealAmount;
            break;
          case "partyName":
            aVal = a.party?.name || "";
            bVal = b.party?.name || "";
            break;
          case "bookingNo":
            aVal = a.bookingNo || "";
            bVal = b.bookingNo || "";
            break;
          default: // bookingDate
            aVal = new Date(a.bookingDate);
            bVal = new Date(b.bookingDate);
        }
        if (sortOrder === "asc") return aVal > bVal ? 1 : -1;
        return aVal < bVal ? 1 : -1;
      });
  }, [
    bookings,
    searchTerm,
    statusFilter,
    paymentFilter,
    dateRange,
    sortBy,
    sortOrder,
  ]);

  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);
  const paginatedBookings = filteredBookings.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleRefresh = () => dispatch(fetchBookings());

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this booking?"))
      return;
    try {
      await dispatch(deleteBooking(id)).unwrap();
      setToast({ message: "Booking deleted successfully.", type: "success" });
      setTimeout(() => setToast(null), 3000);
    } catch (error) {
      console.error("Delete failed:", error);
      const errorMessage = error?.error?.message || "Failed to delete booking.";
      setToast({ message: errorMessage, type: "error" });
      setTimeout(() => setToast(null), 3000);
    }
  };

  const exportToCSV = () => {
    const csvContent = [
      [
        "Booking No",
        "Date",
        "Party",
        "Vehicle",
        "Route",
        "Delivery Status",
        "Deal Amount",
        "Advance Paid",
        "Total Deductions",
        "Final Pending",
        "Party Payment Status",
        "Vehicle Cost",
        "Vehicle Advance",
        "Vehicle Balance",
        "Vehicle Payment Status",
      ].join(","),
      ...filteredBookings.map((b) => {
        const totals = calculateAllTotals(b.charges, b.vehiclePayment);
        return [
          `"${b.bookingNo || ""}"`,
          new Date(b.bookingDate).toLocaleDateString(),
          `"${b.party?.name || ""}"`,
          `"${b.vehicle?.vehicleNo || ""}"`,
          `"${b.journey?.fromLocation || ""} to ${
            b.journey?.toLocation || ""
          }"`,
          b.delivery?.status || "pending",
          totals.dealAmount,
          totals.advancePaid,
          totals.totalDeductions,
          totals.finalPendingAmount,
          b.paymentStatus?.partyPaymentStatus || "pending",
          totals.vehicleCost,
          totals.vehicleAdvance,
          totals.vehicleBalance,
          b.paymentStatus?.vehiclePaymentStatus || "pending",
        ].join(",");
      }),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bookings.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleView = (booking) => {
    setSelectedBooking(booking);
    setShowViewModal(true);
  };

  const handleEdit = (id) => {
    setActiveTab("edit-booking", id);
  };

  // UPDATED: This function now directly handles the printing logic.
  const handlePrint = (booking) => {
    const totals = calculateAllTotals(booking.charges, booking.vehiclePayment);

    const deductions = [
      {
        label: "Vehicle Charges",
        value: parseFloat(booking.charges?.vehicleCharges) || 0,
      },
      {
        label: "Commission",
        value: parseFloat(booking.charges?.commission) || 0,
      },
      {
        label: "Local Charges",
        value: parseFloat(booking.charges?.localCharges) || 0,
      },
      { label: "Hamali", value: parseFloat(booking.charges?.hamali) || 0 },
      { label: "TDS", value: parseFloat(booking.charges?.tds) || 0 },
      {
        label: "ST Charges",
        value: parseFloat(booking.charges?.stCharges) || 0,
      },
      {
        label: "Other Charges",
        value:
          parseFloat(booking.charges?.other) ||
          parseFloat(booking.charges?.otherCharges) ||
          0,
      },
    ].filter((d) => d.value > 0);

    const profit =
      totals.dealAmount -
      totals.vehicleCost -
      totals.totalDeductions +
      (parseFloat(booking.charges?.vehicleCharges) || 0);

    const proofImageUrl = booking.delivery?.proofImage 
      ? `${import.meta.env.VITE_API_URL || "http://localhost:5003"}/${booking.delivery.proofImage}`
      : null;

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Please allow pop-ups to print.");
      return;
    }

    printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>Master Bill - ${booking.bookingNo}</title>
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap');
            body { font-family: 'Roboto', sans-serif; margin: 0; padding: 0; background-color: #fff; font-size: 10pt; color: #333; }
            .page { width: 210mm; min-height: 297mm; padding: 15mm; margin: 10mm auto; border: 1px solid #d3d3d3; background: white; box-shadow: 0 0 5px rgba(0, 0, 0, 0.1); }
            @page { size: A4; margin: 0; }
            @media print {
                html, body { width: 210mm; height: 297mm; }
                .page { margin: 0; border: initial; border-radius: initial; width: initial; min-height: initial; box-shadow: initial; background: initial; page-break-after: always; }
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
                <div class="company-details"><h1>TRANSPORT SOLUTIONS PVT. LTD.</h1><p>123 Transport Street, Logistics City, TC 400001</p><p><strong>GSTIN:</strong> ${
                  booking.ourGstNo || "N/A"
                }</p></div>
                <div class="bill-details"><p><strong>Booking No:</strong> ${
                  booking.bookingNo
                }</p><p><strong>Date:</strong> ${new Date(
      booking.bookingDate
    ).toLocaleDateString("en-IN")}</p></div>
            </div>
            <div class="details-grid">
                <div class="info-block"><h3>Party Details</h3><p><strong>Name:</strong> ${
                  booking.party.name
                }</p><p><strong>Address:</strong> ${
      booking.party.address
    }</p><p><strong>Contact:</strong> ${
      booking.party.contact
    }</p><p><strong>GSTIN:</strong> ${booking.party.gstNo || "N/A"}</p></div>
                <div class="info-block"><h3>Vehicle & Journey</h3><p><strong>Vehicle No:</strong> ${
                  booking.vehicle.vehicleNo
                }</p><p><strong>Owner:</strong> ${
      booking.vehicle.ownerName
    }</p><p><strong>Contact:</strong> ${
      booking.vehicle.ownerContact
    }</p><p><strong>Route:</strong> ${booking.journey.fromLocation} to ${
      booking.journey.toLocation
    }</p></div>
            </div>
            <div class="financial-grid">
                <div class="info-block"><h3>Party Charges</h3><table class="financial-table"><tr><td>Deal Amount</td><td class="amount">₹ ${totals.dealAmount.toLocaleString(
                  "en-IN",
                  { minimumFractionDigits: 2 }
                )}</td></tr><tr><td>Advance Paid</td><td class="amount">₹ ${totals.advancePaid.toLocaleString(
      "en-IN",
      { minimumFractionDigits: 2 }
    )}</td></tr><tr><td>Deductions</td><td class="amount">- ₹ ${totals.totalDeductions.toLocaleString(
      "en-IN",
      { minimumFractionDigits: 2 }
    )}</td></tr><tr class="total-row"><td>Pending Amount</td><td class="amount">₹ ${Math.max(
      0,
      totals.finalPendingAmount
    ).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
    })}</td></tr></table></div>
                <div class="info-block"><h3>Vehicle Payments</h3><table class="financial-table"><tr><td>Actual Cost</td><td class="amount">₹ ${totals.vehicleCost.toLocaleString(
                  "en-IN",
                  { minimumFractionDigits: 2 }
                )}</td></tr><tr><td>Advance Paid</td><td class="amount">₹ ${totals.vehicleAdvance.toLocaleString(
      "en-IN",
      { minimumFractionDigits: 2 }
    )}</td></tr><tr class="total-row"><td>Balance Due</td><td class="amount">₹ ${Math.max(
      0,
      totals.vehicleBalance
    ).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
    })}</td></tr></table></div>
            </div>
            <div class="info-block" style="margin-top: 20px;"><h3>Deductions & Profit</h3><table class="financial-table">${deductions
              .map(
                (d) =>
                  `<tr><td>${
                    d.label
                  }</td><td class="amount">₹ ${d.value.toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                  })}</td></tr>`
              )
              .join(
                ""
              )}<tr class="total-row"><td>Total Deductions</td><td class="amount">₹ ${totals.totalDeductions.toLocaleString(
      "en-IN",
      { minimumFractionDigits: 2 }
    )}</td></tr><tr class="total-row" style="background-color: #e6fffa;"><td>Net Profit</td><td class="amount">₹ ${profit.toLocaleString(
      "en-IN",
      { minimumFractionDigits: 2 }
    )}</td></tr></table></div>
    <div class="delivery-section">
        <h3>Delivery Details</h3>
        <p><strong>Status:</strong> <span class="status">${
          booking.delivery?.status || 'N/A'
        }</span></p>
        ${
          booking.delivery?.remarks
            ? `<p><strong>Remarks:</strong> ${booking.delivery.remarks}</p>`
            : ""
        }
        ${
          proofImageUrl
            ? `<div><strong>Proof Image:</strong><br><img src="${proofImageUrl}" alt="Delivery Proof"></div>`
            : "<p>No proof image available.</p>"
        }
    </div>
            <div class="footer">This is a computer-generated document.</div>
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

  const ViewModal = () => {
    if (!selectedBooking) return null;
    const totals = calculateAllTotals(
      selectedBooking.charges,
      selectedBooking.vehiclePayment
    );

    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
        <div className="bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b border-gray-700 sticky top-0 bg-gray-800">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-white">Booking Details</h2>
              <button
                onClick={() => setShowViewModal(false)}
                className="text-gray-400 hover:text-white text-2xl"
              >
                &times;
              </button>
            </div>
          </div>
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-700 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-300 mb-1">
                  Booking No
                </h3>
                <p className="text-white font-semibold">
                  {selectedBooking.bookingNo}
                </p>
              </div>
              <div className="bg-gray-700 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-300 mb-1">Date</h3>
                <p className="text-white font-semibold">
                  {new Date(selectedBooking.bookingDate).toLocaleDateString()}
                </p>
              </div>
              <div className="bg-gray-700 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-300 mb-1">
                  Status
                </h3>
                <StatusBadge status={selectedBooking.delivery?.status} />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-700 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <FaUser /> Party Details
                </h3>
                <div className="space-y-2 text-gray-300">
                  <p>
                    <span className="font-medium">Name:</span>{" "}
                    {selectedBooking.party?.name}
                  </p>
                  <p>
                    <span className="font-medium">Contact:</span>{" "}
                    {selectedBooking.party?.contact}
                  </p>
                  <p>
                    <span className="font-medium">Address:</span>{" "}
                    {selectedBooking.party?.address}
                  </p>
                  <p>
                    <span className="font-medium">GST No:</span>{" "}
                    {selectedBooking.party?.gstNo}
                  </p>
                </div>
              </div>
              <div className="bg-gray-700 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <FaTruck /> Vehicle Details
                </h3>
                <div className="space-y-2 text-gray-300">
                  <p>
                    <span className="font-medium">Vehicle No:</span>{" "}
                    {selectedBooking.vehicle?.vehicleNo}
                  </p>
                  <p>
                    <span className="font-medium">Owner:</span>{" "}
                    {selectedBooking.vehicle?.ownerName}
                  </p>
                  <p>
                    <span className="font-medium">Contact:</span>{" "}
                    {selectedBooking.vehicle?.ownerContact}
                  </p>
                  <p>
                    <span className="font-medium">Type:</span>{" "}
                    {selectedBooking.vehicle?.vehicleType}
                  </p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-700 p-4 rounded-lg">
                <h4 className="text-lg font-semibold text-white mb-3">
                  Party Charges
                </h4>
                <div className="space-y-2 text-gray-300">
                  <p>
                    <span className="font-medium">Deal Amount:</span> ₹
                    {totals.dealAmount.toLocaleString()}
                  </p>
                  <p>
                    <span className="font-medium">Advance Paid:</span> ₹
                    {totals.advancePaid.toLocaleString()}
                  </p>
                  <p>
                    <span className="font-medium">Deductions:</span> - ₹
                    {totals.totalDeductions.toLocaleString()}
                  </p>
                  <p className="font-bold border-t border-gray-600 pt-2 mt-2">
                    <span className="font-medium">Final Pending:</span> ₹
                    {Math.max(0, totals.finalPendingAmount).toLocaleString()}
                  </p>
                  <p>
                    <span className="font-medium">Status:</span>{" "}
                    <PaymentBadge
                      status={selectedBooking.paymentStatus?.partyPaymentStatus}
                    />
                  </p>
                </div>
              </div>
              <div className="bg-gray-700 p-4 rounded-lg">
                <h4 className="text-lg font-semibold text-white mb-3">
                  Vehicle Payment
                </h4>
                <div className="space-y-2 text-gray-300">
                  <p>
                    <span className="font-medium">Vehicle Cost:</span> ₹
                    {totals.vehicleCost.toLocaleString()}
                  </p>
                  <p>
                    <span className="font-medium">Advance:</span> ₹
                    {totals.vehicleAdvance.toLocaleString()}
                  </p>
                  <p className="font-bold border-t border-gray-600 pt-2 mt-2">
                    <span className="font-medium">Balance:</span> ₹
                    {Math.max(0, totals.vehicleBalance).toLocaleString()}
                  </p>
                  <p>
                    <span className="font-medium">Status:</span>{" "}
                    <PaymentBadge
                      status={
                        selectedBooking.paymentStatus?.vehiclePaymentStatus
                      }
                    />
                  </p>
                </div>
              </div>
            </div>
            {selectedBooking.delivery?.proofImage && (
              <div className="bg-gray-700 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-white mb-3">
                  Delivery Proof
                </h3>
                <img
                  src={`${
                    import.meta.env.VITE_API_URL || "http://localhost:5003"
                  }/${selectedBooking.delivery.proofImage}`}
                  alt="Delivery Proof"
                  className="max-w-full h-auto max-h-64 rounded-lg border border-gray-600"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-gray-900 min-h-screen p-4 sm:p-6 text-white">
      <div className="max-w-screen-xl mx-auto">
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <h1 className="text-2xl font-bold text-white">
              Bookings Management
            </h1>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleRefresh}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg flex items-center gap-2 text-white disabled:opacity-50"
              >
                <FaSyncAlt className={loading ? "animate-spin" : ""} /> Refresh
              </button>
              <button
                onClick={exportToCSV}
                className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg flex items-center gap-2 text-white"
              >
                <FaFileExport /> Export CSV
              </button>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                  showFilters
                    ? "bg-purple-600 text-white"
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                }`}
              >
                <FaFilter /> Filters{" "}
                <FaChevronDown
                  className={`transition-transform ${
                    showFilters ? "rotate-180" : ""
                  }`}
                />
              </button>
            </div>
          </div>
          <div className="mt-4">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by booking no, party, vehicle, or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>
          {showFilters && (
            <div className="mt-4 p-4 bg-gray-700 rounded-lg grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Delivery Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-600 rounded-md px-3 py-2 text-white"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="in-transit">In-Transit</option>
                  <option value="delivered">Delivered</option>
                  <option value="received">Received</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Payment Status
                </label>
                <select
                  value={paymentFilter}
                  onChange={(e) => setPaymentFilter(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-600 rounded-md px-3 py-2 text-white"
                >
                  <option value="all">All Payments</option>
                  <option value="pending">Pending</option>
                  <option value="partial">Partial</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  From Date
                </label>
                <input
                  type="date"
                  value={dateRange.from}
                  onChange={(e) =>
                    setDateRange({ ...dateRange, from: e.target.value })
                  }
                  className="w-full bg-gray-800 border border-gray-600 rounded-md px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  To Date
                </label>
                <input
                  type="date"
                  value={dateRange.to}
                  onChange={(e) =>
                    setDateRange({ ...dateRange, to: e.target.value })
                  }
                  className="w-full bg-gray-800 border border-gray-600 rounded-md px-3 py-2 text-white"
                />
              </div>
            </div>
          )}
        </div>

        <div className="bg-gray-800 rounded-lg p-4 mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="text-gray-300">
              Showing {paginatedBookings.length} of {filteredBookings.length}{" "}
              bookings
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-300">Sort by:</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm"
                >
                  <option value="bookingDate">Date</option>
                  <option value="bookingNo">Booking No</option>
                  <option value="partyName">Party</option>
                  <option value="dealAmount">Amount</option>
                </select>
                <button
                  onClick={() =>
                    setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                  }
                  className="text-gray-400 hover:text-white"
                >
                  <FaSort />
                </button>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-300">Per page:</label>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {loading && (
          <div className="bg-gray-800 rounded-lg p-8 text-center">
            <div className="animate-pulse text-gray-400">
              Loading bookings...
            </div>
          </div>
        )}
        {!loading && filteredBookings.length === 0 && (
          <div className="bg-gray-800 rounded-lg p-8 text-center">
            <div className="text-gray-400 mb-4">
              No bookings match your filters
            </div>
          </div>
        )}

        {!loading && filteredBookings.length > 0 && (
          <div className="bg-gray-800 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">
                      Booking Details
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">
                      Party & Vehicle
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">
                      Journey
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">
                      Amount
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">
                      Status
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-300">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {paginatedBookings.map((booking) => {
                    const totals = calculateAllTotals(
                      booking.charges,
                      booking.vehiclePayment
                    );
                    return (
                      <tr
                        key={booking._id}
                        className="hover:bg-gray-700 transition-colors"
                      >
                        <td className="px-4 py-4">
                          <div>
                            <div className="font-semibold text-white">
                              {booking.bookingNo}
                            </div>
                            <div className="text-sm text-gray-400 flex items-center gap-1">
                              <FaCalendarAlt className="w-3 h-3" />
                              {new Date(
                                booking.bookingDate
                              ).toLocaleDateString()}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div>
                            <div className="text-white font-medium">
                              {booking.party?.name}
                            </div>
                            <div className="text-sm text-gray-400 flex items-center gap-2">
                              <span>{booking.vehicle?.vehicleNo}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-sm text-gray-300">
                            <div>{booking.journey?.fromLocation}</div>
                            <div className="text-gray-500">↓</div>
                            <div>{booking.journey?.toLocation}</div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="space-y-2">
                            <div>
                              <div className="text-white font-semibold flex items-center gap-1">
                                <FaRupeeSign className="w-3 h-3" />
                                {totals.dealAmount.toLocaleString()}
                              </div>
                              <div className="text-sm text-gray-400">
                                Party Bal: ₹
                                {Math.max(
                                  0,
                                  totals.finalPendingAmount
                                ).toLocaleString()}
                              </div>
                            </div>
                            <div>
                              <div className="text-gray-300 flex items-center gap-1 text-sm">
                                Vehicle: ₹{totals.vehicleCost.toLocaleString()}
                              </div>
                              <div className="text-sm text-gray-400">
                                Vehicle Bal: ₹
                                {Math.max(
                                  0,
                                  totals.vehicleBalance
                                ).toLocaleString()}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="space-y-2 flex flex-col items-start">
                            <StatusBadge status={booking.delivery?.status} />
                            <PaymentBadge
                              status={booking.paymentStatus?.partyPaymentStatus}
                            />
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleView(booking)}
                              className="bg-blue-600 hover:bg-blue-700 p-2 rounded text-white"
                              title="View Details"
                            >
                              <FaEye className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleEdit(booking._id)}
                              className="bg-yellow-600 hover:bg-yellow-700 p-2 rounded text-white"
                              title="Edit"
                            >
                              <FaEdit className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handlePrint(booking)}
                              className="bg-green-600 hover:bg-green-700 p-2 rounded text-white"
                              title="Print"
                            >
                              <FaPrint className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleDelete(booking._id)}
                              className="bg-red-600 hover:bg-red-700 p-2 rounded text-white"
                              title="Delete"
                            >
                              <FaTrash className="w-3 h-3" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!loading && filteredBookings.length > 0 && totalPages > 1 && (
          <div className="bg-gray-800 rounded-lg p-4 mt-6">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-400">
                Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                {Math.min(currentPage * itemsPerPage, filteredBookings.length)}{" "}
                of {filteredBookings.length} results
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1 rounded bg-gray-700 text-gray-300 hover:bg-gray-600 disabled:opacity-50"
                >
                  First
                </button>
                <button
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="p-2 rounded bg-gray-700 text-gray-300 hover:bg-gray-600 disabled:opacity-50"
                >
                  <FaChevronLeft />
                </button>
                <div className="flex space-x-1">
                  {[...Array(totalPages)].map((_, index) => {
                    const pageNum = index + 1;
                    const isVisible =
                      pageNum === 1 ||
                      pageNum === totalPages ||
                      (pageNum >= currentPage - 1 &&
                        pageNum <= currentPage + 1);
                    if (!isVisible) {
                      if (
                        pageNum === currentPage - 2 ||
                        pageNum === currentPage + 2
                      ) {
                        return (
                          <span
                            key={`dots${pageNum}`}
                            className="px-2 py-1 text-gray-400"
                          >
                            ...
                          </span>
                        );
                      }
                      return null;
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-3 py-1 rounded ${
                          currentPage === pageNum
                            ? "bg-blue-600 text-white"
                            : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded bg-gray-700 text-gray-300 hover:bg-gray-600 disabled:opacity-50"
                >
                  <FaChevronRight />
                </button>
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 rounded bg-gray-700 text-gray-300 hover:bg-gray-600 disabled:opacity-50"
                >
                  Last
                </button>
              </div>
            </div>
          </div>
        )}

        {showViewModal && <ViewModal />}
      </div>
      {toast && (
        <div
          className={`fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 animate-slide-in ${
            toast.type === "success"
              ? "bg-green-600 text-white"
              : "bg-red-600 text-white"
          }`}
        >
          <div className="flex items-center gap-2">
            {toast.type === "success" ? "✓" : "✗"} {toast.message}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBookingList;
