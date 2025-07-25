import React, { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchParties,
  deleteParty,
  setSelectedParty,
  deleteMultipleParties,
} from "../../Store/Slices/partySlice";
import {
  FaSearch,
  FaSort,
  FaPlus,
  FaEdit,
  FaTrash,
  FaCalendarAlt,
  FaFilter,
  FaCheck,
  FaTimes,
  FaSortAlphaDown,
} from "react-icons/fa";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

const AdminPartyList = ({ setActiveTab }) => {
  const dispatch = useDispatch();
  const { parties, status } = useSelector((state) => state.party);

  // Search and Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({
    key: "createdAt",
    direction: "desc",
  });
  const [selectedIds, setSelectedIds] = useState([]);
  const [notification, setNotification] = useState(null);

  // Date Filter States
  const [dateFilter, setDateFilter] = useState("all");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState("");

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const handleExportExcel = () => {
    if (filteredAndSortedParties.length === 0) {
      alert("No data available to export!");
      return;
    }

    const exportData = filteredAndSortedParties.map((party, index) => ({
      "#": index + 1,
      Name: party.name || "",
      Contact: party.contactNumber || "",
      Email: party.email || "",
      City: party.city || "",
      "GST No": party.gstNo || "",
      "Date Added": party.createdAt
        ? new Date(party.createdAt).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })
        : "N/A",
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Parties");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    const data = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(data, `parties_${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  useEffect(() => {
    dispatch(fetchParties());
  }, [dispatch]);

  // Notification handler
  const showNotification = (msg, type = "success") => {
    setNotification({ message: msg, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const dismissNotification = () => {
    setNotification(null);
  };

  // Delete handlers
  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this party?")) {
      await dispatch(deleteParty(id));
      showNotification("Party deleted successfully", "success");
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return;
    if (window.confirm("Are you sure you want to delete selected parties?")) {
      await dispatch(deleteMultipleParties(selectedIds));
      setSelectedIds([]);
      showNotification("Selected parties deleted successfully", "success");
    }
  };

  const handleEdit = (party) => {
    dispatch(setSelectedParty(party));
    setActiveTab("party");
  };

  // Sorting handler
  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
    setCurrentPage(1); // Reset to first page when sorting
  };

  // Selection handlers
  const toggleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(filteredAndSortedParties.map((p) => p._id));
    } else {
      setSelectedIds([]);
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Date filter logic
  const getDateFilteredParties = (parties) => {
    const now = new Date();

    return parties.filter((party) => {
      if (!party.createdAt) return true;

      const partyDate = new Date(party.createdAt);

      switch (dateFilter) {
        case "today":
          return partyDate.toDateString() === now.toDateString();
        case "week":
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          return partyDate >= weekAgo;
        case "month":
          if (selectedMonth && selectedYear) {
            return (
              partyDate.getMonth() === parseInt(selectedMonth) &&
              partyDate.getFullYear() === parseInt(selectedYear)
            );
          }
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          return partyDate >= monthAgo;
        case "custom":
          if (customStartDate && customEndDate) {
            const start = new Date(customStartDate);
            const end = new Date(customEndDate);
            end.setHours(23, 59, 59, 999); // Include full end date
            return partyDate >= start && partyDate <= end;
          }
          return true;
        default:
          return true;
      }
    });
  };

  // Main filtering and sorting logic
  const filteredAndSortedParties = useMemo(() => {
    // First apply search filter
    let filtered = parties.filter((party) =>
      [party.name, party.city, party.contactNumber, party.email, party.gstNo]
        .join(" ")
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
    );

    // Then apply date filter
    filtered = getDateFilteredParties(filtered);

    // Finally apply sorting
    return filtered.sort((a, b) => {
      let valueA = a[sortConfig.key] || "";
      let valueB = b[sortConfig.key] || "";

      if (sortConfig.key === "createdAt") {
        return sortConfig.direction === "asc"
          ? new Date(a.createdAt) - new Date(b.createdAt)
          : new Date(b.createdAt) - new Date(a.createdAt);
      }

      valueA = valueA.toString().toLowerCase();
      valueB = valueB.toString().toLowerCase();

      if (valueA < valueB) return sortConfig.direction === "asc" ? -1 : 1;
      if (valueA > valueB) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [
    parties,
    searchTerm,
    sortConfig,
    dateFilter,
    customStartDate,
    customEndDate,
    selectedMonth,
    selectedYear,
  ]);

  // Pagination logic
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedParties = filteredAndSortedParties.slice(
    startIndex,
    startIndex + itemsPerPage
  );
  const totalPages = Math.ceil(filteredAndSortedParties.length / itemsPerPage);

  // Generate month/year options
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-900 p-6 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-blue-500 rounded-full animate-pulse"></div>
          <div
            className="w-4 h-4 bg-blue-500 rounded-full animate-pulse"
            style={{ animationDelay: "0.1s" }}
          ></div>
          <div
            className="w-4 h-4 bg-blue-500 rounded-full animate-pulse"
            style={{ animationDelay: "0.2s" }}
          ></div>
        </div>
        <p className="text-gray-400 mt-2 ml-4">Loading parties...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-800 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Notification */}
        {notification && (
          <div className="fixed top-6 right-6 z-50 max-w-sm w-full transform transition-all duration-300 ease-in-out">
            <div
              className={`rounded-xl shadow-2xl border-l-4 p-4 backdrop-blur-sm ${
                notification.type === "success"
                  ? "bg-gray-800/90 border-emerald-500 text-emerald-300"
                  : "bg-gray-800/90 border-red-500 text-red-300"
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
        <div className="mb-8 flex flex-col items-center text-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Party Management
            </h1>
            <p className="text-gray-400">
              Manage your business parties and contacts
            </p>
          </div>
          <button
            onClick={() => setActiveTab("add-party")}
            className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-6 py-3 rounded-xl flex items-center gap-2 font-medium shadow-lg transform hover:scale-105 transition-all duration-200"
          >
            <FaPlus /> Add New Party
          </button>
        </div>

        {/* Search & Filters */}
        <div className="bg-gray-800 rounded-2xl shadow-xl border border-gray-700 p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 lg:gap-6">
            {/* Search Bar (Left) */}
            <div className="relative w-full lg:w-1/2">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, city, contact, email, or GST..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-gray-700 border border-gray-600 rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              />
            </div>

            {/* Right Side: Date Filter + Export */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 w-full lg:w-auto">
              {/* Date Filter */}
              <div className="flex items-center gap-2">
                <FaCalendarAlt className="text-gray-400" />
                <select
                  value={dateFilter}
                  onChange={(e) => {
                    setDateFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="bg-gray-700 border border-gray-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                  <option value="custom">Custom Range</option>
                </select>
              </div>

              {/* Export Button */}
              <button
                onClick={handleExportExcel}
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-5 py-3 rounded-xl flex items-center gap-2 font-medium shadow-lg transform hover:scale-105 transition-all duration-200"
              >
                <FaSortAlphaDown /> Export to Excel
              </button>
            </div>
          </div>

          {/* Date Filter Options */}
          {dateFilter === "month" && (
            <div className="mt-4 flex gap-3">
              <select
                value={selectedMonth}
                onChange={(e) => {
                  setSelectedMonth(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-gray-700 border border-gray-600 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Month</option>
                {months.map((month, index) => (
                  <option key={month} value={index}>
                    {month}
                  </option>
                ))}
              </select>
              <select
                value={selectedYear}
                onChange={(e) => {
                  setSelectedYear(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-gray-700 border border-gray-600 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Year</option>
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          )}

          {dateFilter === "custom" && (
            <div className="mt-4 flex gap-3">
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => {
                  setCustomStartDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-gray-700 border border-gray-600 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => {
                  setCustomEndDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-gray-700 border border-gray-600 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
        </div>

        {/* Actions Bar */}
        {selectedIds.length > 0 && (
          <div className="mb-6">
            <button
              onClick={handleDeleteSelected}
              className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white px-6 py-3 rounded-xl font-medium shadow-lg transform hover:scale-105 transition-all duration-200"
            >
              <FaTrash className="inline mr-2" />
              Delete Selected ({selectedIds.length})
            </button>
          </div>
        )}

        {/* Table */}
        <div className="bg-gray-800 rounded-2xl shadow-xl border border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-750 border-b border-gray-600">
                  <th className="p-4 text-left">
                    <input
                      type="checkbox"
                      onChange={toggleSelectAll}
                      checked={
                        paginatedParties.length > 0 &&
                        paginatedParties.every((p) =>
                          selectedIds.includes(p._id)
                        )
                      }
                      className="w-4 h-4 text-blue-500 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
                    />
                  </th>
                  <th
                    className="p-4 text-left text-gray-300 font-semibold uppercase tracking-wider cursor-pointer hover:text-white transition-colors"
                    onClick={() => handleSort("name")}
                  >
                    <div className="flex items-center gap-2">
                      Name
                      <FaSort
                        className={`text-xs ${
                          sortConfig.key === "name"
                            ? "text-blue-400"
                            : "text-gray-500"
                        }`}
                      />
                    </div>
                  </th>
                  <th className="p-4 text-left text-gray-300 font-semibold uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="p-4 text-left text-gray-300 font-semibold uppercase tracking-wider">
                    Email
                  </th>
                  <th
                    className="p-4 text-left text-gray-300 font-semibold uppercase tracking-wider cursor-pointer hover:text-white transition-colors"
                    onClick={() => handleSort("city")}
                  >
                    <div className="flex items-center gap-2">
                      City
                      <FaSort
                        className={`text-xs ${
                          sortConfig.key === "city"
                            ? "text-blue-400"
                            : "text-gray-500"
                        }`}
                      />
                    </div>
                  </th>
                  <th className="p-4 text-left text-gray-300 font-semibold uppercase tracking-wider">
                    GST No
                  </th>
                  <th
                    className="p-4 text-left text-gray-300 font-semibold uppercase tracking-wider cursor-pointer hover:text-white transition-colors"
                    onClick={() => handleSort("createdAt")}
                  >
                    <div className="flex items-center gap-2">
                      Date Added
                      <FaSort
                        className={`text-xs ${
                          sortConfig.key === "createdAt"
                            ? "text-blue-400"
                            : "text-gray-500"
                        }`}
                      />
                    </div>
                  </th>
                  <th className="p-4 text-center text-gray-300 font-semibold uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {paginatedParties.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="p-8 text-center">
                      <div className="text-gray-500">
                        <FaSearch className="mx-auto text-4xl mb-4 opacity-50" />
                        <p className="text-lg font-medium">No parties found</p>
                        <p className="text-sm">
                          Try adjusting your search or filter criteria
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedParties.map((party) => (
                    <tr
                      key={party._id}
                      className="hover:bg-gray-750 transition-colors duration-200"
                    >
                      <td className="p-4">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(party._id)}
                          onChange={() => toggleSelect(party._id)}
                          className="w-4 h-4 text-blue-500 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
                        />
                      </td>
                      <td className="p-4">
                        <span className="text-white font-medium">
                          {party.name}
                        </span>
                      </td>
                      <td className="">
                        <span className="text-gray-300">
                          {party.contactNumber}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="text-gray-300">{party.email}</span>
                      </td>
                      <td className="p-4">
                        <span className="text-gray-300">{party.city}</span>
                      </td>
                      <td className="p-4">
                        <span className="text-gray-300">{party.gstNo}</span>
                      </td>
                      <td className="p-4">
                        <span className="text-gray-300">
                          {party.createdAt
                            ? new Date(party.createdAt).toLocaleDateString(
                                "en-IN",
                                {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                }
                              )
                            : "N/A"}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2 justify-center">
                          <button
                            onClick={() => handleEdit(party)}
                            className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-500/20 rounded-lg transition-all duration-200"
                            title="Edit party"
                          >
                            <FaEdit />
                          </button>
                          <button
                            onClick={() => handleDelete(party._id)}
                            className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-lg transition-all duration-200"
                            title="Delete party"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="border-t border-gray-700 bg-gray-750 px-6 py-4">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="text-gray-400">
                  Showing {startIndex + 1} to{" "}
                  {Math.min(
                    startIndex + itemsPerPage,
                    filteredAndSortedParties.length
                  )}{" "}
                  of {filteredAndSortedParties.length} parties
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 text-sm">
                    Page {currentPage} of {totalPages}
                  </span>
                  <div className="flex gap-1 ml-4">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                      disabled={currentPage === 1}
                      className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-600 text-white rounded-lg transition-all duration-200 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() =>
                        setCurrentPage((p) => Math.min(p + 1, totalPages))
                      }
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-600 text-white rounded-lg transition-all duration-200 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Results Summary */}
        {filteredAndSortedParties.length > 0 && (
          <div className="mt-6 text-center">
            <p className="text-gray-400">
              {filteredAndSortedParties.length === parties.length
                ? `Showing all ${parties.length} parties`
                : `Found ${filteredAndSortedParties.length} of ${parties.length} parties`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPartyList;
