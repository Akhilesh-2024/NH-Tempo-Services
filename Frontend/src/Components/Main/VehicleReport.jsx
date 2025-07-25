import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import {
  FaSearch,
  FaCalendarAlt,
  FaFileExcel,
  FaFilter,
  FaTimes,
  FaChevronLeft,
  FaChevronRight,
  FaChevronDown,
} from "react-icons/fa";
import * as XLSX from "xlsx";

// Reusable Pagination component
const Pagination = ({
  totalItems,
  itemsPerPage,
  currentPage,
  onPageChange,
}) => {
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  if (totalPages <= 1) {
    return null;
  }

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      onPageChange(page);
    }
  };

  return (
    <div className="flex items-center justify-end gap-2">
      <button
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="p-2 rounded bg-gray-700 text-gray-300 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <FaChevronLeft />
      </button>
      <span className="text-sm text-gray-400">
        Page {currentPage} of {totalPages}
      </span>
      <button
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="p-2 rounded bg-gray-700 text-gray-300 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <FaChevronRight />
      </button>
    </div>
  );
};

// Reusable badge components for status
const StatusBadge = ({ status, type }) => {
    const styles = {
        payment: {
            completed: "bg-green-500 text-green-100",
            partial: "bg-yellow-500 text-yellow-900",
            pending: "bg-red-500 text-red-100",
        },
        delivery: {
            delivered: "bg-cyan-500 text-cyan-900",
            received: "bg-green-500 text-green-100",
            "in-transit": "bg-blue-500 text-blue-100",
            pending: "bg-yellow-500 text-yellow-900",
        }
    };
    
    const styleSet = type === 'payment' ? styles.payment : styles.delivery;

    return (
        <span
            className={`inline-flex items-center justify-center px-2 py-1 rounded-full text-xs font-semibold capitalize ${
                styleSet[status] || "bg-gray-600 text-gray-100"
            }`}
        >
            {status || "N/A"}
        </span>
    );
};


const VehicleReport = () => {
  // State for data and UI
  const [vehicleData, setVehicleData] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  // State for filters
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState({ fromDate: "", toDate: "" });
  const [selectedVehicle, setSelectedVehicle] = useState("");
  const [selectedOwnership, setSelectedOwnership] = useState("");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Fetch initial data
  useEffect(() => {
    fetchVehicleReportData();
    fetchVehicles();
  }, []);

  const fetchVehicleReportData = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get("/api/reports/vehicle");
      setVehicleData(data);
    } catch (error) {
      console.error("Error fetching vehicle report data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchVehicles = async () => {
    try {
      const { data } = await axios.get("/api/vehicle");
      setVehicles(data);
    } catch (error) {
      console.error("Error fetching vehicles:", error);
    }
  };

  // Memoized filtering logic
  const filteredData = useMemo(() => {
    return vehicleData
      .filter((item) => {
        const lowercasedTerm = searchTerm.toLowerCase();
        const matchesSearch =
          !searchTerm ||
          item.vehicleNo?.toLowerCase().includes(lowercasedTerm) ||
          item.ownerName?.toLowerCase().includes(lowercasedTerm) ||
          item.bookingNo?.toLowerCase().includes(lowercasedTerm) ||
          item.partyName?.toLowerCase().includes(lowercasedTerm);

        const matchesDate =
          (!dateFilter.fromDate || new Date(item.date) >= new Date(dateFilter.fromDate)) &&
          (!dateFilter.toDate || new Date(item.date) <= new Date(dateFilter.toDate));
        
        const matchesVehicle = !selectedVehicle || item.vehicleNo === selectedVehicle;
        const matchesOwnership = !selectedOwnership || item.ownership === selectedOwnership;

        return matchesSearch && matchesDate && matchesVehicle && matchesOwnership;
      });
  }, [vehicleData, searchTerm, dateFilter, selectedVehicle, selectedOwnership]);
  
  // Reset page when filters change
  useEffect(() => {
      setCurrentPage(1);
  }, [searchTerm, dateFilter, selectedVehicle, selectedOwnership]);

  // Memoized pagination logic
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredData, currentPage, itemsPerPage]);


  const handleDateChange = (field, value) => {
    setDateFilter((prev) => ({ ...prev, [field]: value }));
  };

  const clearFilters = () => {
    setSearchTerm("");
    setDateFilter({ fromDate: "", toDate: "" });
    setSelectedVehicle("");
    setSelectedOwnership("");
  };

  const exportToExcel = () => {
    const exportData = filteredData.map((item) => ({
      "Date": new Date(item.date).toLocaleDateString(),
      "Booking No": item.bookingNo,
      "Vehicle No": item.vehicleNo,
      "Owner Name": item.ownerName,
      "Owner Contact": item.ownerContact,
      "Vehicle Type": item.vehicleType,
      "Ownership": item.ownership,
      "Party Name": item.partyName,
      "Route": `${item.fromLocation} to ${item.toLocation}`,
      "Vehicle Cost": item.vehicleCost || 0,
      "Advance Paid": item.advancePaid || 0,
      "Balance Amount": item.balanceAmount || 0,
      "Payment Status": item.paymentStatus,
      "Delivery Status": item.deliveryStatus,
      "Remarks": item.remarks || "",
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Vehicle Report");
    const fileName = `Vehicle_Report_${new Date().toISOString().split("T")[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount || 0);

  const totalVehicleCost = useMemo(() => filteredData.reduce((sum, item) => sum + (item.vehicleCost || 0), 0), [filteredData]);
  const totalAdvancePaid = useMemo(() => filteredData.reduce((sum, item) => sum + (item.advancePaid || 0), 0), [filteredData]);
  const totalBalance = useMemo(() => filteredData.reduce((sum, item) => sum + (item.balanceAmount || 0), 0), [filteredData]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 min-h-screen p-4 sm:p-6 text-white">
      <div className="max-w-screen-xl mx-auto">
        {/* Header and Main Controls */}
        <div className="bg-gray-800 rounded-lg p-4 sm:p-6 mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                <h1 className="text-2xl font-bold text-white">Vehicle Report</h1>
                <p className="text-gray-400 text-sm mt-1">View and manage vehicle transactions</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={exportToExcel}
                className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg flex items-center gap-2 text-white text-sm"
              >
                <FaFileExcel /> Export
              </button>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 text-sm ${
                  showFilters
                    ? "bg-purple-600 text-white"
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                }`}
              >
                <FaFilter /> Filters <FaChevronDown className={`transition-transform ${showFilters ? "rotate-180" : ""}`} />
              </button>
            </div>
          </div>
          <div className="mt-4">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by vehicle no, owner, booking, or party..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-700 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">From Date</label>
                <input type="date" value={dateFilter.fromDate} onChange={(e) => handleDateChange("fromDate", e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">To Date</label>
                <input type="date" value={dateFilter.toDate} onChange={(e) => handleDateChange("toDate", e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Vehicle</label>
                <select value={selectedVehicle} onChange={(e) => setSelectedVehicle(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white">
                  <option value="">All Vehicles</option>
                  {vehicles.map((vehicle) => (
                    <option key={vehicle._id} value={vehicle.vehicleNumber}>{vehicle.vehicleNumber}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Ownership</label>
                <select value={selectedOwnership} onChange={(e) => setSelectedOwnership(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white">
                  <option value="">All Types</option>
                  <option value="Owner">Owner</option>
                  <option value="Vendor">Vendor</option>
                </select>
              </div>
              <div className="flex items-end lg:col-span-4">
                <button onClick={clearFilters} className="bg-gray-600 hover:bg-gray-500 px-4 py-2 rounded-lg flex items-center justify-center gap-2 text-white text-sm">
                  <FaTimes /> Clear All Filters
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-800 p-4 rounded-lg"><h3 className="text-sm font-medium text-blue-400">Total Trips</h3><p className="text-2xl font-bold text-white">{filteredData.length}</p></div>
            <div className="bg-gray-800 p-4 rounded-lg"><h3 className="text-sm font-medium text-green-400">Total Cost</h3><p className="text-2xl font-bold text-white">{formatCurrency(totalVehicleCost)}</p></div>
            <div className="bg-gray-800 p-4 rounded-lg"><h3 className="text-sm font-medium text-yellow-400">Total Advance</h3><p className="text-2xl font-bold text-white">{formatCurrency(totalAdvancePaid)}</p></div>
            <div className="bg-gray-800 p-4 rounded-lg"><h3 className="text-sm font-medium text-red-400">Total Balance</h3><p className="text-2xl font-bold text-white">{formatCurrency(totalBalance)}</p></div>
        </div>

        {/* Table */}
        <div className="bg-gray-800 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full w-full">
              <thead className="bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Booking & Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Vehicle Details</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Party & Route</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">Financials</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {paginatedData.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-700/50 transition-colors">
                    <td className="px-4 py-4 align-top whitespace-nowrap">
                        <div className="text-sm font-medium text-blue-400">{item.bookingNo}</div>
                        <div className="text-xs text-gray-400">{new Date(item.date).toLocaleDateString()}</div>
                    </td>
                    <td className="px-4 py-4 align-top whitespace-nowrap">
                        <div className="text-sm font-medium text-white">{item.vehicleNo}</div>
                        <div className="text-xs text-gray-400">{item.ownerName} ({item.ownership})</div>
                        <div className="text-xs text-gray-500">{item.ownerContact}</div>
                    </td>
                    <td className="px-4 py-4 align-top text-sm text-gray-200">
                        <div className="font-medium">{item.partyName}</div>
                        <div className="text-xs text-gray-400 mt-1">
                            {item.fromLocation} <span className="text-gray-500">→</span> {item.toLocation}
                        </div>
                    </td>
                    <td className="px-4 py-4 align-top whitespace-nowrap text-right">
                        <div className="text-sm font-medium text-white">{formatCurrency(item.vehicleCost)}</div>
                        <div className="text-xs text-green-400">Adv: {formatCurrency(item.advancePaid)}</div>
                        <div className="text-xs text-red-400">Bal: {formatCurrency(item.balanceAmount)}</div>
                    </td>
                    <td className="px-4 py-4 align-top whitespace-nowrap text-center">
                      <div className="flex flex-col items-center gap-2">
                        <StatusBadge status={item.paymentStatus} type="payment" />
                        <StatusBadge status={item.deliveryStatus} type="delivery" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
           {filteredData.length === 0 && (
             <div className="text-center py-12 text-gray-500">
               <p>No vehicle records match your filters.</p>
             </div>
           )}
        </div>

        {/* Pagination Controls */}
        {filteredData.length > 0 && (
            <div className="bg-gray-800 rounded-lg p-4 mt-6 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="text-sm text-gray-400">
                    Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredData.length)} of {filteredData.length} results
                </div>
                <Pagination
                    totalItems={filteredData.length}
                    itemsPerPage={itemsPerPage}
                    currentPage={currentPage}
                    onPageChange={setCurrentPage}
                />
            </div>
        )}
      </div>
    </div>
  );
};

export default VehicleReport;