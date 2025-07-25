import React, { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
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
  FaFileInvoice,
  FaTruck,
  FaUser,
  FaRupeeSign,
  FaChevronLeft,
  FaChevronRight,
  FaChevronDown
} from "react-icons/fa";
import { 
  fetchBookings, 
  deleteBooking, 
  clearBookingError,
  migrateBookingsToNewStructure 
} from "../../Store/Slices/bookingSlice";

const AdminBookingList = ({ setActiveTab }) => {
  const dispatch = useDispatch();
  
  // Redux state
  const { bookings, loading, error } = useSelector((state) => state.booking);
  
  // Local state
  const [toast, setToast] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);

  // Filter and Search State
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [dateRange, setDateRange] = useState({ from: "", to: "" });
  const [sortBy, setSortBy] = useState("bookingDate");
  const [sortOrder, setSortOrder] = useState("desc");
  const [showFilters, setShowFilters] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Fetch bookings on component mount
  useEffect(() => {
    dispatch(fetchBookings());
  }, [dispatch]);

  // Handle errors and show toast
  useEffect(() => {
    if (error) {
      setToast({ message: error.message || "An error occurred", type: "error" });
      setTimeout(() => {
        setToast(null);
        dispatch(clearBookingError());
      }, 3000);
    }
  }, [error, dispatch]);

  // Filter and Search Logic
  const filteredBookings = useMemo(() => {
    let filtered = [...bookings];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(booking =>
        booking.bookingNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.party?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.vehicle?.vehicleNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.journey?.fromLocation?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.journey?.toLocation?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(booking => booking.delivery?.status === statusFilter);
    }

    // Payment filter
    if (paymentFilter !== "all") {
      filtered = filtered.filter(booking => 
        booking.paymentStatus?.partyPaymentStatus === paymentFilter
      );
    }

    // Date range filter
    if (dateRange.from) {
      filtered = filtered.filter(booking => 
        new Date(booking.bookingDate) >= new Date(dateRange.from)
      );
    }
    if (dateRange.to) {
      filtered = filtered.filter(booking => 
        new Date(booking.bookingDate) <= new Date(dateRange.to)
      );
    }

    // Sorting
    filtered.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];

      if (sortBy === 'bookingDate') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      } else if (sortBy === 'totalAmount') {
        // Handle both old and new structure for backward compatibility
        aValue = parseFloat(a.charges?.dealAmount || a.charges?.totalAmount || 0);
        bValue = parseFloat(b.charges?.dealAmount || b.charges?.totalAmount || 0);
      } else if (sortBy === 'partyName') {
        aValue = a.party?.name || '';
        bValue = b.party?.name || '';
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [bookings, searchTerm, statusFilter, paymentFilter, dateRange, sortBy, sortOrder]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);
  const paginatedBookings = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredBookings.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredBookings, currentPage, itemsPerPage]);

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this booking?")) {
      try {
        await dispatch(deleteBooking(id)).unwrap();
        setToast({ message: "Booking deleted successfully!", type: "success" });
        setTimeout(() => setToast(null), 3000);
      } catch (error) {
        setToast({ message: "Failed to delete booking", type: "error" });
        setTimeout(() => setToast(null), 3000);
      }
    }
  };

  const handleEdit = (bookingId) => {
    // Navigate to edit form with booking ID
    setActiveTab("edit-booking", bookingId);
  };

  const handleView = (booking) => {
    setSelectedBooking(booking);
    setShowViewModal(true);
  };

  const handlePrint = (booking) => {
    // Handle both old and new structure for backward compatibility
    const dealAmount = parseFloat(booking.charges?.dealAmount || booking.charges?.vehicleCostParty) || 0;
    const advancePaid = parseFloat(booking.charges?.advancePaid || booking.charges?.partyAdvance) || 0;
    const vehicleCharges = parseFloat(booking.charges?.vehicleCharges) || 0;
    const commission = parseFloat(booking.charges?.commission) || 0;
    const localCharges = parseFloat(booking.charges?.localCharges) || 0;
    const hamali = parseFloat(booking.charges?.hamali) || 0;
    const tds = parseFloat(booking.charges?.tds) || 0;
    const stCharges = parseFloat(booking.charges?.stCharges) || 0;
    const other = parseFloat(booking.charges?.other || booking.charges?.otherCharges) || 0;
    
    const vehicleActualCost = parseFloat(booking.vehiclePayment?.actualVehicleCost) || 0;
    const vehicleAdvance = parseFloat(booking.vehiclePayment?.vehicleAdvance) || 0;
    
    // Calculate with new logic or fallback to old logic
    const pendingAmount = dealAmount - advancePaid;
    const totalDeductions = vehicleCharges + commission + localCharges + hamali + tds + stCharges + other;
    const subTotal = dealAmount - totalDeductions;
    const vehicleBalance = vehicleActualCost - vehicleAdvance;

    // Simple print functionality
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Booking Bill - ${booking.bookingNo}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .header { text-align: center; margin-bottom: 20px; }
            .detail { display: flex; justify-content: space-between; padding: 5px 0; }
            .amount { font-weight: bold; color: #2563eb; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>Transport Bill</h2>
            <p>Booking No: ${booking.bookingNo}</p>
            <p>Date: ${new Date(booking.bookingDate).toLocaleDateString()}</p>
          </div>
          
          <div class="details">
            <div class="detail">
              <span>Party Name:</span>
              <span>${booking.party?.name || 'N/A'}</span>
            </div>
            <div class="detail">
              <span>Vehicle No:</span>
              <span>${booking.vehicle?.vehicleNo || 'N/A'}</span>
            </div>
            <div class="detail">
              <span>Route:</span>
              <span>${booking.journey?.fromLocation || 'N/A'} → ${booking.journey?.toLocation || 'N/A'}</span>
            </div>
            <div class="detail">
              <span>Deal Amount:</span>
              <span class="amount">₹${dealAmount.toLocaleString("en-IN")}</span>
            </div>
            <div class="detail">
              <span>Advance Paid:</span>
              <span>₹${advancePaid.toLocaleString("en-IN")}</span>
            </div>
            <div class="detail">
              <span>Pending Amount:</span>
              <span class="amount">₹${pendingAmount.toLocaleString("en-IN")}</span>
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const exportToCSV = () => {
    const csvContent = [
      ['Booking No', 'Date', 'Party', 'Vehicle', 'Route', 'Status', 'Total Amount', 'Payment Status'].join(','),
      ...filteredBookings.map(booking => [
        booking.bookingNo || '',
        new Date(booking.bookingDate).toLocaleDateString(),
        booking.party?.name || '',
        booking.vehicle?.vehicleNo || '',
        `${booking.journey?.fromLocation || ''} → ${booking.journey?.toLocation || ''}`,
        booking.delivery?.status || 'pending',
        booking.charges?.dealAmount || booking.charges?.vehicleCostParty || 0,
        booking.paymentStatus?.partyPaymentStatus || 'pending'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bookings.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getStatusBadge = (status) => {
    const statusStyles = {
      pending: "bg-yellow-600 text-yellow-100",
      received: "bg-green-600 text-green-100"
    };
    return statusStyles[status] || "bg-gray-600 text-gray-100";
  };

  const ViewModal = () => {
    if (!selectedBooking) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
        <div className="bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b border-gray-700">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-white">Booking Details</h2>
              <button
                onClick={() => setShowViewModal(false)}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>
          </div>
          
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-700 p-4 rounded-lg">
                <h3 className="text-white font-semibold mb-2">Booking Info</h3>
                <p className="text-gray-300">No: {selectedBooking.bookingNo}</p>
                <p className="text-gray-300">Date: {new Date(selectedBooking.bookingDate).toLocaleDateString()}</p>
              </div>
              
              <div className="bg-gray-700 p-4 rounded-lg">
                <h3 className="text-white font-semibold mb-2">Party</h3>
                <p className="text-gray-300">{selectedBooking.party?.name}</p>
                <p className="text-gray-300 text-sm">{selectedBooking.party?.contact}</p>
              </div>
              
              <div className="bg-gray-700 p-4 rounded-lg">
                <h3 className="text-white font-semibold mb-2">Vehicle</h3>
                <p className="text-gray-300">{selectedBooking.vehicle?.vehicleNo}</p>
                <p className="text-gray-300 text-sm">{selectedBooking.vehicle?.vehicleType}</p>
              </div>
            </div>
            
            <div className="bg-gray-700 p-4 rounded-lg">
              <h3 className="text-white font-semibold mb-2">Journey</h3>
              <p className="text-gray-300">
                {selectedBooking.journey?.fromLocation} → {selectedBooking.journey?.toLocation}
              </p>
            </div>
            
            <div className="bg-gray-700 p-4 rounded-lg">
              <h3 className="text-white font-semibold mb-2">Charges</h3>
              <div className="space-y-1 text-gray-300">
                <p>Deal Amount: ₹{(selectedBooking.charges?.dealAmount || selectedBooking.charges?.vehicleCostParty || 0).toLocaleString()}</p>
                <p>Advance: ₹{(selectedBooking.charges?.advancePaid || selectedBooking.charges?.partyAdvance || 0).toLocaleString()}</p>
                <p>Pending: ₹{((selectedBooking.charges?.dealAmount || selectedBooking.charges?.vehicleCostParty || 0) - (selectedBooking.charges?.advancePaid || selectedBooking.charges?.partyAdvance || 0)).toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${
          toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
        }`}>
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Booking Management
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Manage all transport bookings
            </p>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => dispatch(fetchBookings())}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <FaSyncAlt />
              Refresh
            </button>
            
            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <FaFileExport />
              Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search bookings..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="received">Received</option>
          </select>
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full table-auto">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Booking No
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Party
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Vehicle
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Route
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan="8" className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                    Loading...
                  </td>
                </tr>
              ) : paginatedBookings.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                    No bookings found
                  </td>
                </tr>
              ) : (
                paginatedBookings.map((booking) => (
                  <tr key={booking._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {booking.bookingNo}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {new Date(booking.bookingDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {booking.party?.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {booking.vehicle?.vehicleNo}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {booking.journey?.fromLocation} → {booking.journey?.toLocation}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      ₹{(booking.charges?.dealAmount || booking.charges?.vehicleCostParty || 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(booking.delivery?.status)}`}>
                        {booking.delivery?.status || 'pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => handleView(booking)}
                        className="text-blue-600 hover:text-blue-900"
                        title="View"
                      >
                        <FaEye />
                      </button>
                      <button
                        onClick={() => handleEdit(booking._id)}
                        className="text-yellow-600 hover:text-yellow-900"
                        title="Edit"
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={() => handlePrint(booking)}
                        className="text-green-600 hover:text-green-900"
                        title="Print"
                      >
                        <FaPrint />
                      </button>
                      <button
                        onClick={() => handleDelete(booking._id)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete"
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
          <div className="px-6 py-3 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700 dark:text-gray-300">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredBookings.length)} of {filteredBookings.length} results
              </div>
              
              <div className="flex space-x-1">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded disabled:opacity-50"
                >
                  <FaChevronLeft />
                </button>
                
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`px-3 py-1 text-sm rounded ${
                      currentPage === i + 1
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
                
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded disabled:opacity-50"
                >
                  <FaChevronRight />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* View Modal */}
      {showViewModal && <ViewModal />}
    </div>
  );
};

export default AdminBookingList;