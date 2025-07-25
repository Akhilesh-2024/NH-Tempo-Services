import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  FaTrash,
  FaSortAlphaDown,
  FaPlus,
  FaEdit,
  FaSave,
  FaSearch,
  FaCheck,
  FaTimes,
} from "react-icons/fa";
import {
  fetchMasters,
  addMaster,
  updateMaster,
  deleteMaster,
  deleteMultipleMasters,
} from "../../Store/Slices/masterSlice";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

// Import India states/cities JSON
import indiaData from "../../Data/indiaData.json";

const AdminMaster = () => {
  const dispatch = useDispatch();
  const { masters, status } = useSelector((state) => state.master);

  const [name, setName] = useState("");
  const [search, setSearch] = useState("");
  const [sortAsc, setSortAsc] = useState(true);
  const [selectedIds, setSelectedIds] = useState([]);
  const [notification, setNotification] = useState(null);

  // For editing
  const [editId, setEditId] = useState(null);

  // Autocomplete states
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const exportToExcel = () => {
    if (!masters || masters.length === 0) {
      showNotification("No data to export!", "error");
      return;
    }

    // Prepare data
    const dataToExport = masters.map((m, index) => ({
      "S.No.": index + 1,
      "Destination Name": m.name,
    }));

    // Convert to worksheet
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Destinations");

    // Export
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const dataBlob = new Blob([excelBuffer], {
      type: "application/octet-stream",
    });
    saveAs(
      dataBlob,
      `Destinations_${new Date().toISOString().split("T")[0]}.xlsx`
    );
  };

  // Build list of suggestions (state + city,state)
  const allSuggestions = Object.keys(indiaData).flatMap((state) => [
    state,
    ...indiaData[state].map((city) => `${city}, ${state}`),
  ]);

  useEffect(() => {
    dispatch(fetchMasters());
  }, [dispatch]);

  // Handle Add or Update
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editId) {
      await dispatch(updateMaster({ id: editId, name }));
      setEditId(null);
      showNotification("Destination updated successfully", "success");
    } else {
      await dispatch(addMaster(name));
      showNotification("Destination added successfully", "success");
    }

    setName("");
    setShowSuggestions(false);
  };

  // Handle Edit
  const handleEdit = (id, currentName) => {
    setEditId(id);
    setName(currentName);
  };

  // Handle Delete Single
  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this record?")) {
      await dispatch(deleteMaster(id));
      showNotification("Destination deleted successfully", "success");
    }
  };

  // Handle Delete Selected
  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return;
    if (window.confirm("Are you sure you want to delete selected records?")) {
      await dispatch(deleteMultipleMasters(selectedIds));
      setSelectedIds([]);
      showNotification("Selected destinations deleted successfully", "success");
    }
  };

  // Enhanced Notification with type
  const showNotification = (msg, type = "success") => {
    setNotification({ message: msg, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Autocomplete input handler
  const handleNameChange = (e) => {
    const value = e.target.value;
    setName(value);

    if (value.length > 0) {
      const matches = allSuggestions.filter((s) =>
        s.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredSuggestions(matches.slice(0, 10));
      setShowSuggestions(true);
      setHighlightIndex(-1); // reset highlight
    } else {
      setShowSuggestions(false);
    }
  };

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (!showSuggestions || filteredSuggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIndex((prev) =>
        prev < filteredSuggestions.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex((prev) =>
        prev > 0 ? prev - 1 : filteredSuggestions.length - 1
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (highlightIndex >= 0) {
        setName(filteredSuggestions[highlightIndex]);
        setShowSuggestions(false);
      }
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  };
  // Filter and Sort
  const filtered = masters
    .filter((m) => m.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) =>
      sortAsc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)
    );

  // Pagination logic
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginated = filtered.slice(startIndex, startIndex + itemsPerPage);
  const totalPages = Math.ceil(filtered.length / itemsPerPage);

  const toggleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(paginated.map((m) => m._id));
    } else {
      setSelectedIds([]);
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const dismissNotification = () => {
    setNotification(null);
  };

  return (
    <div className="min-h-screen bg-gray-800 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Enhanced Notification */}
        {notification && (
          <div
            className={`fixed top-6 right-6 z-50 max-w-sm w-full transform transition-all duration-300 ease-in-out ${
              notification
                ? "translate-x-0 opacity-100"
                : "translate-x-full opacity-0"
            }`}
          >
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
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-white mb-2">
            Destination Master
          </h1>
          <p className="text-gray-400">Manage your travel destinations</p>
        </div>

        {/* Add/Edit Form with Autocomplete */}
        <div className="bg-gray-800 rounded-2xl shadow-xl border border-gray-700 p-6 mb-6">
          <form
            onSubmit={handleSubmit}
            className="flex flex-col md:flex-row gap-4 items-center "
          >
            <div className="flex-1 relative">
              <input
                type="text"
                value={name}
                onChange={handleNameChange}
                onKeyDown={handleKeyDown}
                placeholder="Enter destination (State/City)"
                className="w-full bg-gray-700 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              />

              {showSuggestions && filteredSuggestions.length > 0 && (
                <ul className="absolute z-10 w-full bg-gray-800 border border-gray-600 rounded-xl mt-1 max-h-60 overflow-auto shadow-lg">
                  {filteredSuggestions.map((suggestion, index) => (
                    <li
                      key={index}
                      onClick={() => {
                        setName(suggestion);
                        setShowSuggestions(false);
                      }}
                      className={`px-4 py-2 cursor-pointer text-white transition ${
                        index === highlightIndex
                          ? "bg-blue-600"
                          : "hover:bg-gray-700"
                      }`}
                    >
                      {suggestion}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <button
              type="submit"
              className={`${
                editId
                  ? "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                  : "bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
              } text-white px-6 py-3 rounded-xl flex items-center gap-2 font-medium shadow-lg transform hover:scale-105 transition-all duration-200`}
            >
              {editId ? <FaSave /> : <FaPlus />}
              {editId ? "Save Changes" : "Add Destination"}
            </button>
            {editId && (
              <button
                type="button"
                onClick={() => {
                  setEditId(null);
                  setName("");
                }}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-3 rounded-xl transition-all duration-200"
              >
                Cancel
              </button>
            )}
          </form>
        </div>

        {/* Search & Sort Controls */}
        <div className="bg-gray-800 rounded-2xl shadow-xl border border-gray-700 p-6 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            {/* Search Input (Left) */}
            <div className="relative flex-1 max-w-md w-full sm:w-auto">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search destinations..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              />
            </div>

            {/* Right Controls (Sort, Delete, Export) */}
            <div className="flex flex-wrap gap-4 justify-end w-full sm:w-auto">
              <button
                onClick={() => setSortAsc(!sortAsc)}
                className="bg-gray-700 hover:bg-gray-600 border border-gray-600 text-white px-4 py-3 rounded-xl flex items-center gap-2 font-medium transition-all duration-200"
              >
                <FaSortAlphaDown
                  className={`transition-transform duration-200 ${
                    !sortAsc ? "rotate-180" : ""
                  }`}
                />
                Sort {sortAsc ? "A-Z" : "Z-A"}
              </button>

              {selectedIds.length > 0 && (
                <button
                  onClick={handleDeleteSelected}
                  className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white px-6 py-3 rounded-xl font-medium shadow-lg transform hover:scale-105 transition-all duration-200"
                >
                  <FaTrash className="inline mr-2" />
                  Delete Selected ({selectedIds.length})
                </button>
              )}

              {/* Export Button */}
              <button
                onClick={exportToExcel}
                className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-6 py-3 rounded-xl font-medium shadow-lg transform hover:scale-105 transition-all duration-200"
              >
                Export to Excel
              </button>
            </div>
          </div>
        </div>

        {/* Data Table */}
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
                        paginated.length > 0 &&
                        paginated.every((m) => selectedIds.includes(m._id))
                      }
                      className="w-4 h-4 text-blue-500 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
                    />
                  </th>
                  <th className="p-4 text-left text-gray-300 font-semibold uppercase tracking-wider">
                    Destination Name
                  </th>
                  <th className="p-4 text-right text-gray-300 font-semibold uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {status === "loading" ? (
                  <tr>
                    <td colSpan="3" className="p-8 text-center">
                      <div className="flex items-center justify-center space-x-2">
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
                      <p className="text-gray-400 mt-2">
                        Loading destinations...
                      </p>
                    </td>
                  </tr>
                ) : paginated.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="p-8 text-center">
                      <div className="text-gray-500">
                        <FaSearch className="mx-auto text-4xl mb-4 opacity-50" />
                        <p className="text-lg font-medium">
                          No destinations found
                        </p>
                        <p className="text-sm">
                          Try adjusting your search criteria
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginated.map((m) => (
                    <tr
                      key={m._id}
                      className="hover:bg-gray-750 transition-colors duration-200"
                    >
                      <td className="p-4">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(m._id)}
                          onChange={() => toggleSelect(m._id)}
                          className="w-4 h-4 text-blue-500 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
                        />
                      </td>
                      <td className="p-4">
                        <span className="text-white font-medium">{m.name}</span>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => handleEdit(m._id, m.name)}
                            className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-500/20 rounded-lg transition-all duration-200"
                            title="Edit destination"
                          >
                            <FaEdit />
                          </button>
                          <button
                            onClick={() => handleDelete(m._id)}
                            className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-lg transition-all duration-200"
                            title="Delete destination"
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
                  {Math.min(startIndex + itemsPerPage, filtered.length)} of{" "}
                  {filtered.length} destinations
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
      </div>
    </div>
  );
};

export default AdminMaster;
