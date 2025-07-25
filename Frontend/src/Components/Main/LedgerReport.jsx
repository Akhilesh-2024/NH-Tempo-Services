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

// A badge for payment status
const PaymentStatusBadge = ({ status }) => {
    const styles = {
        completed: "bg-green-500 text-green-100",
        partial: "bg-yellow-500 text-yellow-900",
        pending: "bg-red-500 text-red-100",
    };
    return (
        <span
            className={`inline-flex items-center justify-center px-2 py-1 rounded-full text-xs font-semibold capitalize ${
                styles[status] || "bg-gray-600 text-gray-100"
            }`}
        >
            {status || "N/A"}
        </span>
    );
};


const LedgerReport = () => {
  // State for data and UI
  const [ledgerData, setLedgerData] = useState([]);
  const [parties, setParties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  // State for filters
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState({ fromDate: "", toDate: "" });
  const [selectedParty, setSelectedParty] = useState("");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Fetch initial data
  useEffect(() => {
    fetchLedgerData();
    fetchParties();
  }, []);

  const fetchLedgerData = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get("/api/reports/ledger");
      setLedgerData(data);
    } catch (error) {
      console.error("Error fetching ledger data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchParties = async () => {
    try {
      const { data } = await axios.get("/api/party");
      setParties(data);
    } catch (error) {
      console.error("Error fetching parties:", error);
    }
  };

  // Memoized filtering logic
  const filteredData = useMemo(() => {
    return ledgerData
      .filter((item) => {
        const lowercasedTerm = searchTerm.toLowerCase();
        const matchesSearch =
          !searchTerm ||
          item.partyName?.toLowerCase().includes(lowercasedTerm) ||
          item.bookingNo?.toLowerCase().includes(lowercasedTerm) ||
          item.vehicleNo?.toLowerCase().includes(lowercasedTerm);

        const matchesDate =
          (!dateFilter.fromDate || new Date(item.date) >= new Date(dateFilter.fromDate)) &&
          (!dateFilter.toDate || new Date(item.date) <= new Date(dateFilter.toDate));

        const matchesParty = !selectedParty || item.partyName === selectedParty;

        return matchesSearch && matchesDate && matchesParty;
      });
  }, [ledgerData, searchTerm, dateFilter, selectedParty]);
  
  // Reset page when filters change
  useEffect(() => {
      setCurrentPage(1);
  }, [searchTerm, dateFilter, selectedParty]);

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
    setSelectedParty("");
  };

  const exportToExcel = () => {
    const exportData = filteredData.map((item) => ({
      "Booking No": item.bookingNo,
      "Date": new Date(item.date).toLocaleDateString(),
      "Party Name": item.partyName,
      "Vehicle No": item.vehicleNo,
      "Route": `${item.fromLocation} to ${item.toLocation}`,
      "Debit": item.debitAmount || 0,
      "Credit": item.creditAmount || 0,
      "Balance": item.balance || 0,
      "Payment Status": item.paymentStatus,
      "Remarks": item.remarks || "",
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Ledger Report");
    const fileName = `Ledger_Report_${new Date().toISOString().split("T")[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount || 0);

  const totalCredit = useMemo(() => filteredData.reduce((sum, item) => sum + (item.creditAmount || 0), 0), [filteredData]);
  const totalDebit = useMemo(() => filteredData.reduce((sum, item) => sum + (item.debitAmount || 0), 0), [filteredData]);


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
                <h1 className="text-2xl font-bold text-white">Ledger Report</h1>
                <p className="text-gray-400 text-sm mt-1">View and manage party ledger transactions</p>
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
                placeholder="Search by booking no, party, or vehicle..."
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
                <label className="block text-sm font-medium text-gray-300 mb-1">Party</label>
                <select value={selectedParty} onChange={(e) => setSelectedParty(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white">
                  <option value="">All Parties</option>
                  {parties.map((party) => (
                    <option key={party._id} value={party.name}>{party.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <button onClick={clearFilters} className="w-full bg-gray-600 hover:bg-gray-500 px-4 py-2 rounded-lg flex items-center justify-center gap-2 text-white text-sm">
                  <FaTimes /> Clear
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-800 p-4 rounded-lg"><h3 className="text-sm font-medium text-green-400">Total Credit</h3><p className="text-2xl font-bold text-white">{formatCurrency(totalCredit)}</p></div>
            <div className="bg-gray-800 p-4 rounded-lg"><h3 className="text-sm font-medium text-red-400">Total Debit</h3><p className="text-2xl font-bold text-white">{formatCurrency(totalDebit)}</p></div>
            <div className="bg-gray-800 p-4 rounded-lg"><h3 className="text-sm font-medium text-blue-400">Net Balance</h3><p className="text-2xl font-bold text-white">{formatCurrency(totalCredit - totalDebit)}</p></div>
        </div>

        {/* Table */}
        <div className="bg-gray-800 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full w-full">
              <thead className="bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Booking No</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Party Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Vehicle No</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Route</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">Debit</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">Credit</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">Balance</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {paginatedData.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-700/50 transition-colors">
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-200">{new Date(item.date).toLocaleDateString()}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-blue-400">{item.bookingNo}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-200">{item.partyName}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-200">{item.vehicleNo}</td>
                    <td className="px-4 py-4 text-sm text-gray-200">
                        <div>{item.fromLocation}</div>
                        <div className="text-gray-500">↓</div>
                        <div>{item.toLocation}</div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-right text-red-400">{item.debitAmount ? formatCurrency(item.debitAmount) : "-"}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-right text-green-400">{item.creditAmount ? formatCurrency(item.creditAmount) : "-"}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-right font-medium text-white">{formatCurrency(item.balance)}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-center">
                      <PaymentStatusBadge status={item.paymentStatus} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
           {filteredData.length === 0 && (
             <div className="text-center py-12 text-gray-500">
               <p>No records match your filters.</p>
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

export default LedgerReport;
