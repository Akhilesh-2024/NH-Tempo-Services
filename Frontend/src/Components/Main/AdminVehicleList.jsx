import React, { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchVehicles,
  deleteVehicle,
  setSelectedVehicle,
  deleteMultipleVehicles,
} from "../../Store/Slices/vehicleSlice";
import {
  FaSearch,
  FaSort,
  FaPlus,
  FaEdit,
  FaTrash,
  FaCheck,
  FaTimes,
  FaCalendarAlt,
  FaSortAlphaDown,
} from "react-icons/fa";
import * as XLSX from "xlsx";

const AdminVehicleList = ({ setActiveTab }) => {
  const dispatch = useDispatch();
  const { vehicles, status } = useSelector((state) => state.vehicle);

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

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    dispatch(fetchVehicles());
  }, [dispatch]);

  const showNotification = (msg, type = "success") => {
    setNotification({ message: msg, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const dismissNotification = () => setNotification(null);

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this vehicle?")) {
      await dispatch(deleteVehicle(id));
      showNotification("Vehicle deleted successfully", "success");
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return;
    if (window.confirm("Are you sure you want to delete selected vehicles?")) {
      await dispatch(deleteMultipleVehicles(selectedIds));
      setSelectedIds([]);
      showNotification("Selected vehicles deleted successfully", "success");
    }
  };

  const handleEdit = (vehicle) => {
    dispatch(setSelectedVehicle(vehicle));
    setActiveTab("vehicle");
  };

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
    setCurrentPage(1);
  };

  const toggleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(filteredAndSortedVehicles.map((v) => v._id));
    } else {
      setSelectedIds([]);
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Date Filter Logic
  const getDateFilteredVehicles = (vehicles) => {
    const now = new Date();

    return vehicles.filter((v) => {
      if (!v.createdAt) return true;
      const vDate = new Date(v.createdAt);

      switch (dateFilter) {
        case "today":
          return vDate.toDateString() === now.toDateString();
        case "week":
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          return vDate >= weekAgo;
        case "month":
          if (selectedMonth && selectedYear) {
            return (
              vDate.getMonth() === parseInt(selectedMonth) &&
              vDate.getFullYear() === parseInt(selectedYear)
            );
          }
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          return vDate >= monthAgo;
        case "custom":
          if (customStartDate && customEndDate) {
            const start = new Date(customStartDate);
            const end = new Date(customEndDate);
            end.setHours(23, 59, 59, 999);
            return vDate >= start && vDate <= end;
          }
          return true;
        default:
          return true;
      }
    });
  };

  // Filter + Sort
  const filteredAndSortedVehicles = useMemo(() => {
    let filtered = vehicles.filter((v) =>
      [
        v.vehicleNumber,
        v.vehicleType,
        v.contactNumber,
        v.ownerName,
        v.address,
      ]
        .join(" ")
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
    );

    filtered = getDateFilteredVehicles(filtered);

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
    vehicles,
    searchTerm,
    sortConfig,
    dateFilter,
    customStartDate,
    customEndDate,
    selectedMonth,
    selectedYear,
  ]);

  // Pagination
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedVehicles = filteredAndSortedVehicles.slice(
    startIndex,
    startIndex + itemsPerPage
  );
  const totalPages = Math.ceil(filteredAndSortedVehicles.length / itemsPerPage);

  // Month & Year
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

  // Export to Excel
  const handleExportExcel = () => {
    const data = filteredAndSortedVehicles.map((v) => ({
      "Vehicle Number": v.vehicleNumber,
      "Vehicle Type": v.vehicleType,
      "Contact Number": v.contactNumber,
      Owner: v.ownerName,
      Ownership: v.ownership,
      "Created On": v.createdAt
        ? new Date(v.createdAt).toLocaleDateString("en-IN")
        : "N/A",
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Vehicles");
    XLSX.writeFile(wb, "Vehicles_List.xlsx");
  };

  if (status === "loading") {
    return (
      <div className="p-6 text-gray-400 text-center">Loading vehicles...</div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-800 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Notification */}
        {notification && (
          <div className="fixed top-6 right-6 z-50 max-w-sm w-full">
            <div
              className={`rounded-xl shadow-2xl border-l-4 p-4 ${
                notification.type === "success"
                  ? "bg-gray-800 border-emerald-500 text-emerald-300"
                  : "bg-gray-800 border-red-500 text-red-300"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {notification.type === "success" ? <FaCheck /> : <FaTimes />}
                  <span>{notification.message}</span>
                </div>
                <button onClick={dismissNotification}>
                  <FaTimes size={12} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="mb-8 flex flex-col items-center text-center gap-4">
          <h1 className="text-3xl font-bold text-white">Vehicle Management</h1>
          <button
            onClick={() => setActiveTab("add-vehicle")}
            className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-6 py-3 rounded-xl flex items-center gap-2"
          >
            <FaPlus /> Add Vehicle
          </button>
        </div>

        {/* Search & Filters */}
        <div className="bg-gray-800 rounded-2xl shadow-xl border border-gray-700 p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 lg:gap-6">
            {/* Search */}
            <div className="relative w-full lg:w-1/2">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by vehicle number, type, owner, contact..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Date Filter & Export */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 w-full lg:w-auto">
              <div className="flex items-center gap-2">
                <FaCalendarAlt className="text-gray-400" />
                <select
                  value={dateFilter}
                  onChange={(e) => {
                    setDateFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="bg-gray-700 border border-gray-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                  <option value="custom">Custom Range</option>
                </select>
              </div>

              <button
                onClick={handleExportExcel}
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-5 py-3 rounded-xl flex items-center gap-2 font-medium shadow-lg transform hover:scale-105 transition-all"
              >
                <FaSortAlphaDown /> Export to Excel
              </button>
            </div>
          </div>

          {/* Month & Custom Date */}
          {dateFilter === "month" && (
            <div className="mt-4 flex gap-3">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-gray-700 border border-gray-600 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Month</option>
                {months.map((month, i) => (
                  <option key={month} value={i}>
                    {month}
                  </option>
                ))}
              </select>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
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
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="bg-gray-700 border border-gray-600 rounded-xl px-4 py-2 text-white"
              />
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="bg-gray-700 border border-gray-600 rounded-xl px-4 py-2 text-white"
              />
            </div>
          )}
        </div>

        {/* Table */}
        <div className="bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-700">
          <div className="overflow-x-auto">
            <table className="w-full text-white table-auto">
              <thead>
                <tr className="bg-gray-750 text-left border border-gray-700">
                  <th className="p-4 w-12">
                    <input
                      type="checkbox"
                      onChange={toggleSelectAll}
                      checked={
                        paginatedVehicles.length > 0 &&
                        paginatedVehicles.every((v) => selectedIds.includes(v._id))
                      }
                    />
                  </th>
                  <th
                    className="p-4 cursor-pointer"
                    onClick={() => handleSort("vehicleNumber")}
                  >
                    <div className="inline-flex items-center gap-2">
                      Vehicle Number <FaSort />
                    </div>
                  </th>
                  <th className="p-4">Type</th>
                  <th className="p-4">Contact</th>
                  <th className="p-4">Owner</th>
                  <th className="p-4">Ownership</th>
                  <th
                    className="p-4 cursor-pointer"
                    onClick={() => handleSort("createdAt")}
                  >
                    <div className="inline-flex items-center gap-2">
                      Added On <FaSort />
                    </div>
                  </th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedVehicles.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="p-8 text-center text-gray-500">
                      No vehicles found
                    </td>
                  </tr>
                ) : (
                  paginatedVehicles.map((v) => (
                    <tr key={v._id} className="hover:bg-gray-750">
                      <td className="p-4">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(v._id)}
                          onChange={() => toggleSelect(v._id)}
                        />
                      </td>
                      <td className="p-4">{v.vehicleNumber}</td>
                      <td className="p-4">{v.vehicleType}</td>
                      <td className="p-4">{v.contactNumber}</td>
                      <td className="p-4">{v.ownerName}</td>
                      <td className="p-4">{v.ownership}</td>
                      <td className="p-4">
                        {v.createdAt
                          ? new Date(v.createdAt).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })
                          : "N/A"}
                      </td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => handleEdit(v)}
                          className="p-2 text-blue-400 hover:text-blue-300"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => handleDelete(v._id)}
                          className="p-2 text-red-400 hover:text-red-300"
                        >
                          <FaTrash />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-4 flex justify-between items-center bg-gray-750">
              <span className="text-gray-400">
                Page {currentPage} of {totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-gray-700 text-white rounded"
                >
                  Previous
                </button>
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(p + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 bg-gray-700 text-white rounded"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminVehicleList;
