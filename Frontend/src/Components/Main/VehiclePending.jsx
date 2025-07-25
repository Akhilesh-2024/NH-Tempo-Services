import React, { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchBookings,
  addVehiclePayment,
} from "../../Store/Slices/bookingSlice";
import {
  FaTruckMoving,
  FaSave,
  FaSearch,
  FaFileExcel,
  FaHistory,
  FaCalendarAlt,
} from "react-icons/fa";

// --- Centralized Calculation Helper ---
const calculateAllTotals = (charges = {}, vehiclePayment = {}) => {
  const dealAmt =
    parseFloat(charges.dealAmount) || parseFloat(charges.totalAmount) || 0;
  const advanceAmt =
    parseFloat(charges.advancePaid) || parseFloat(charges.partyAdvance) || 0;

  const vehicleCostAmt = parseFloat(vehiclePayment.actualVehicleCost) || 0;
  const vehicleAdvanceAmt = parseFloat(vehiclePayment.vehicleAdvance) || 0;

  const finalPendingAmount = dealAmt - advanceAmt;
  const vehicleBalance = vehicleCostAmt - vehicleAdvanceAmt;

  return {
    dealAmount: dealAmt,
    advancePaid: advanceAmt,
    finalPendingAmount: finalPendingAmount,
    vehicleBalance: vehicleBalance,
    actualVehicleCost: vehicleCostAmt,
    vehicleAdvancePaid: vehicleAdvanceAmt,
  };
};

const VehiclePending = () => {
  const dispatch = useDispatch();
  const { bookings, loading } = useSelector((state) => state.booking);

  const [toast, setToast] = useState(null);
  const [paymentData, setPaymentData] = useState({
    bookingId: "",
    bookingNo: "",
    partyName: "",
    amount: "",
    mode: "Cash",
    remarks: "",
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState({ from: "", to: "" });

  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [selectedBookingForHistory, setSelectedBookingForHistory] =
    useState(null);

  const [isAllHistoryModalOpen, setIsAllHistoryModalOpen] = useState(false);

  useEffect(() => {
    dispatch(fetchBookings());
  }, [dispatch]);

  const filteredPendingBookings = useMemo(() => {
    return bookings.filter((b) => {
      const totals = calculateAllTotals(b.charges, b.vehiclePayment);
      const isPending = totals.vehicleBalance > 0;
      if (!isPending) return false;

      const matchesSearch =
        searchTerm === "" ||
        b.bookingNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.vehicle?.vehicleNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.vehicle?.ownerName?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesDate =
        (!dateRange.from ||
          new Date(b.bookingDate) >= new Date(dateRange.from)) &&
        (!dateRange.to || new Date(b.bookingDate) <= new Date(dateRange.to));

      return matchesSearch && matchesDate;
    });
  }, [bookings, searchTerm, dateRange]);

  const handleSelectBookingForPayment = (booking) => {
    if (booking) {
      const totals = calculateAllTotals(
        booking.charges,
        booking.vehiclePayment
      );
      const pendingAmount = Math.max(0, totals.vehicleBalance);

      setPaymentData({
        bookingId: booking._id,
        bookingNo: booking.bookingNo,
        partyName: booking.party?.name || "",
        amount: pendingAmount,
        mode: "Cash",
        remarks: "",
      });
    }
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    if (
      !paymentData.bookingId ||
      !paymentData.amount ||
      parseFloat(paymentData.amount) <= 0
    ) {
      setToast({
        message: "Please select a booking and enter a valid amount.",
        type: "error",
      });
      setTimeout(() => setToast(null), 3000);
      return;
    }
    try {
      await dispatch(
        addVehiclePayment({ id: paymentData.bookingId, paymentData })
      ).unwrap();
      setToast({
        message: "Vehicle payment added successfully!",
        type: "success",
      });
      setPaymentData({
        bookingId: "",
        bookingNo: "",
        partyName: "",
        amount: "",
        mode: "Cash",
        remarks: "",
      });
      dispatch(fetchBookings());
    } catch (error) {
      setToast({
        message: error.message || "Failed to add payment.",
        type: "error",
      });
    } finally {
      setTimeout(() => setToast(null), 3000);
    }
  };

  const openHistoryModal = (booking) => {
    setSelectedBookingForHistory(booking);
    setIsHistoryModalOpen(true);
  };

  const exportToCSV = () => {
    const csvContent = [
      [
        "Booking No",
        "Vehicle No",
        "Owner Name",
        "Booking Date",
        "Actual Cost",
        "Paid",
        "Balance Due",
      ].join(","),
      ...filteredPendingBookings.map((b) => {
        const totals = calculateAllTotals(b.charges, b.vehiclePayment);
        return [
          b.bookingNo,
          `"${b.vehicle?.vehicleNo || ""}"`,
          `"${b.vehicle?.ownerName || ""}"`,
          new Date(b.bookingDate).toLocaleDateString(),
          totals.actualVehicleCost,
          totals.vehicleAdvancePaid,
          Math.max(0, totals.vehicleBalance),
        ].join(",");
      }),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", "pending_vehicle_payments.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportAllHistoryToCSV = () => {
    const csvContent = [
      ["Booking No", "Vehicle No", "Owner Name", "Date", "Mode", "Amount", "Remarks"].join(","),
      ...bookings.flatMap((b) =>
        (b.vehiclePayment?.paymentHistory || []).map((p) =>
          [
            b.bookingNo,
            `"${b.vehicle?.vehicleNo || ""}"`,
            `"${b.vehicle?.ownerName || ""}"`,
            new Date(p.paymentDate).toLocaleDateString(),
            p.mode,
            p.amount,
            p.remarks || "",
          ].join(",")
        )
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", "all_vehicle_payment_history.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const inputBaseStyle =
    "w-full bg-gray-700 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow";

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

      <div className="max-w-screen-2xl mx-auto">
        {/* Add Payment Form */}
        <div className="bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-700 mb-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <FaTruckMoving /> Add Vehicle Payment
          </h2>
          <form
            onSubmit={handlePaymentSubmit}
            className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end"
          >
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Party Name
              </label>
              <input
                type="text"
                value={paymentData.partyName || ""}
                readOnly
                className={`${inputBaseStyle} bg-gray-800 cursor-not-allowed`}
                placeholder="Select a booking from below"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Amount *
              </label>
              <input
                type="number"
                value={paymentData.amount}
                onChange={(e) =>
                  setPaymentData({ ...paymentData, amount: e.target.value })
                }
                className={inputBaseStyle}
                placeholder="Enter Amount"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Mode
              </label>
              <select
                value={paymentData.mode}
                onChange={(e) =>
                  setPaymentData({ ...paymentData, mode: e.target.value })
                }
                className={inputBaseStyle}
              >
                <option>Cash</option>
                <option>Cheque</option>
                <option>Bank Transfer</option>
                <option>UPI</option>
              </select>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading || !paymentData.bookingId}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <FaSave /> {loading ? "Saving..." : "Save"}
              </button>
            </div>
          </form>
        </div>

        {/* Pending List */}
        <div className="bg-gray-800 rounded-lg overflow-hidden">
          <div className="p-4 border-b border-gray-700 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">
                Pending Vehicle Payments ({filteredPendingBookings.length})
              </h2>
              <div className="flex gap-3">
                <button
                  onClick={exportToCSV}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2"
                >
                  <FaFileExcel /> Export to CSV
                </button>
                <button
                  onClick={() => setIsAllHistoryModalOpen(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2"
                >
                  <FaHistory /> View All History
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by Booking, Vehicle, or Owner..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg"
                />
              </div>
              <div className="relative">
                <FaCalendarAlt className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="date"
                  value={dateRange.from}
                  onChange={(e) =>
                    setDateRange({ ...dateRange, from: e.target.value })
                  }
                  className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg"
                />
              </div>
              <div className="relative">
                <FaCalendarAlt className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="date"
                  value={dateRange.to}
                  onChange={(e) =>
                    setDateRange({ ...dateRange, to: e.target.value })
                  }
                  className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg"
                />
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">
                    Booking No
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">
                    Vehicle No
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">
                    Actual Cost
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">
                    Paid
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">
                    Balance Due
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">
                    Date
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-300">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {filteredPendingBookings.map((booking) => {
                  const totals = calculateAllTotals(
                    booking.charges,
                    booking.vehiclePayment
                  );
                  return (
                    <tr
                      key={booking._id}
                      onClick={() => handleSelectBookingForPayment(booking)}
                      className="hover:bg-gray-700 cursor-pointer"
                    >
                      <td className="px-4 py-4 text-white">
                        {booking.bookingNo}
                      </td>
                      <td className="px-4 py-4 text-gray-300">
                        {booking.vehicle?.vehicleNo}
                      </td>
                      <td className="px-4 py-4 text-gray-300">
                        ₹{totals.actualVehicleCost.toLocaleString("en-IN")}
                      </td>
                      <td className="px-4 py-4 text-green-400">
                        ₹{totals.vehicleAdvancePaid.toLocaleString("en-IN")}
                      </td>
                      <td className="px-4 py-4 text-red-400 font-semibold">
                        ₹
                        {Math.max(0, totals.vehicleBalance).toLocaleString(
                          "en-IN"
                        )}
                      </td>
                      <td className="px-4 py-4 text-gray-400">
                        {new Date(booking.bookingDate).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openHistoryModal(booking);
                          }}
                          className="text-blue-400 hover:text-blue-300"
                        >
                          <FaHistory />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Single History Modal */}
      {isHistoryModalOpen && selectedBookingForHistory && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
            <div className="p-4 border-b border-gray-700 flex justify-between items-center">
              <h3 className="text-lg font-bold">
                Payment History for{" "}
                {selectedBookingForHistory.vehicle?.vehicleNo}
              </h3>
              <button
                onClick={() => setIsHistoryModalOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                &times;
              </button>
            </div>
            <div className="p-4 max-h-96 overflow-y-auto">
              {selectedBookingForHistory.vehiclePayment?.paymentHistory
                ?.length > 0 ? (
                <ul className="space-y-3">
                  {selectedBookingForHistory.vehiclePayment.paymentHistory.map(
                    (p, index) => (
                      <li
                        key={index}
                        className="bg-gray-700 p-3 rounded-lg text-sm"
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-green-400">
                            ₹{p.amount.toLocaleString("en-IN")}
                          </span>
                          <span className="text-gray-400">
                            {new Date(p.paymentDate).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="text-gray-300 mt-1">Mode: {p.mode}</div>
                        {p.remarks && (
                          <div className="text-xs text-gray-400 mt-1">
                            Remark: {p.remarks}
                          </div>
                        )}
                      </li>
                    )
                  )}
                </ul>
              ) : (
                <p className="text-center text-gray-500">
                  No payment history found.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* All History Modal */}
      {isAllHistoryModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-3xl max-h-[80vh] overflow-y-auto">
            <div className="p-4 border-b border-gray-700 flex justify-between items-center">
              <h3 className="text-lg font-bold">All Vehicle Payment History</h3>
              <div className="flex gap-3">
                <button
                  onClick={exportAllHistoryToCSV}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2"
                >
                  <FaFileExcel /> Export History CSV
                </button>
                <button
                  onClick={() => setIsAllHistoryModalOpen(false)}
                  className="text-gray-400 hover:text-white text-2xl"
                >
                  &times;
                </button>
              </div>
            </div>
            <div className="p-4">
              {bookings.some(
                (b) => b.vehiclePayment?.paymentHistory?.length > 0
              ) ? (
                bookings.map(
                  (b) =>
                    b.vehiclePayment?.paymentHistory?.length > 0 && (
                      <div
                        key={b._id}
                        className="bg-gray-700 p-4 rounded-lg mb-4"
                      >
                        <h4 className="text-white font-bold mb-2">
                          {b.bookingNo} - {b.vehicle?.vehicleNo}
                        </h4>
                        <ul className="space-y-2 text-sm">
                          {b.vehiclePayment.paymentHistory.map((p, idx) => (
                            <li
                              key={idx}
                              className="flex justify-between bg-gray-600 p-2 rounded"
                            >
                              <span className="text-green-400">
                                ₹{p.amount.toLocaleString("en-IN")}
                              </span>
                              <span className="text-gray-300">{p.mode}</span>
                              <span className="text-gray-400">
                                {new Date(p.paymentDate).toLocaleDateString()}
                              </span>
                              {p.remarks && (
                                <span className="text-xs text-gray-400">
                                  {p.remarks}
                                </span>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )
                )
              ) : (
                <p className="text-center text-gray-500">
                  No payment history available.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VehiclePending;