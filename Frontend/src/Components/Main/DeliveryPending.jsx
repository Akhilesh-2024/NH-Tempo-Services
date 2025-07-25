import React, { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchBookings, updateBooking } from '../../Store/Slices/bookingSlice'; 
import { FaShippingFast, FaSave, FaUpload, FaSearch, FaFileExcel, FaCalendarAlt, FaUser, FaTruck } from 'react-icons/fa';
import AutoCompleteInput from './AutoCompleteInput';

// Helper component to display status with appropriate colors
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

const DeliveryPending = () => {
    const dispatch = useDispatch();
    const { bookings, loading } = useSelector((state) => state.booking);
    const [toast, setToast] = useState(null);
    const [updateData, setUpdateData] = useState({ 
        bookingId: '', 
        bookingNo: '', 
        partyName: '',
        vehicleNo: '',
        status: 'in-transit', 
        remarks: '', 
        proofImage: null 
    });

    // State for filtering and searching
    const [searchTerm, setSearchTerm] = useState("");
    const [dateRange, setDateRange] = useState({ from: "", to: "" });

    useEffect(() => {
        dispatch(fetchBookings());
    }, [dispatch]);

    const filteredPendingDeliveries = useMemo(() => {
        return bookings.filter(b => {
            // A delivery is considered pending if:
            // 1. Status is 'pending' or 'in-transit'
            // 2. Status is 'delivered' (should stay until marked as 'received')
            // 3. Only exclude if status is 'received' (final status)
            const isPending = b.delivery?.status === 'pending' || 
                              b.delivery?.status === 'in-transit' ||
                              b.delivery?.status === 'delivered';

            // Only exclude if the status is 'received' (final completed status)
            if (b.delivery?.status === 'received') return false;
            if (!isPending) return false;

            const searchString = `${b.bookingNo} ${b.party?.name} ${b.vehicle?.vehicleNo} ${b.journey?.fromLocation} ${b.journey?.toLocation}`.toLowerCase();
            const matchesSearch = searchTerm === "" || searchString.includes(searchTerm.toLowerCase());
            
            const matchesDate =
                (!dateRange.from || new Date(b.bookingDate) >= new Date(dateRange.from)) &&
                (!dateRange.to || new Date(b.bookingDate) <= new Date(dateRange.to));

            return matchesSearch && matchesDate;
        });
    }, [bookings, searchTerm, dateRange]);

    const handleSelectBookingForUpdate = (booking) => {
        if (booking) {
            // Set default status based on current status progression
            let defaultStatus = 'in-transit';
            if (booking.delivery?.status === 'pending') {
                defaultStatus = 'in-transit';
            } else if (booking.delivery?.status === 'in-transit') {
                defaultStatus = 'delivered';
            } else if (booking.delivery?.status === 'delivered') {
                defaultStatus = 'received';
            }
            
            setUpdateData({
                bookingId: booking._id,
                bookingNo: booking.bookingNo,
                partyName: booking.party?.name || 'N/A',
                vehicleNo: booking.vehicle?.vehicleNo || 'N/A',
                status: defaultStatus,
                remarks: booking.delivery?.remarks || '',
                proofImage: null
            });
        }
    };

    const handleImageChange = (e) => {
        setUpdateData({ ...updateData, proofImage: e.target.files[0] });
    };

    const handleUpdateSubmit = async (e) => {
        e.preventDefault();
        if (!updateData.bookingId) {
            setToast({ message: "Please select a booking from the list to update.", type: "error" });
            setTimeout(() => setToast(null), 3000);
            return;
        }

        if (updateData.status === 'received' && !updateData.proofImage) {
            setToast({ message: "Please upload a proof image for 'received' status.", type: "error" });
            setTimeout(() => setToast(null), 3000);
            return;
        }

        const formData = new FormData();
        const deliveryData = {
            status: updateData.status,
            remarks: updateData.remarks,
        };
        formData.append('delivery', JSON.stringify(deliveryData));
        if (updateData.proofImage) {
            formData.append('proofImage', updateData.proofImage);
        }

        try {
            await dispatch(updateBooking({ id: updateData.bookingId, formData })).unwrap();
            setToast({ message: "Delivery status updated successfully!", type: "success" });
            setUpdateData({ bookingId: '', bookingNo: '', partyName: '', vehicleNo: '', status: 'in-transit', remarks: '', proofImage: null });
            dispatch(fetchBookings());
        } catch (error) {
            setToast({ message: error.message || "Failed to update status.", type: "error" });
        } finally {
            setTimeout(() => setToast(null), 3000);
        }
    };

    const exportToCSV = () => {
        const csvContent = [
            ["Booking No", "Party Name", "Vehicle No", "Route", "Current Status", "Booking Date"].join(","),
            ...filteredPendingDeliveries.map(b => [
                b.bookingNo,
                `"${b.party?.name || ''}"`,
                `"${b.vehicle?.vehicleNo || ''}"`,
                `"${b.journey?.fromLocation || ''} to ${b.journey?.toLocation || ''}"`,
                b.delivery?.status,
                new Date(b.bookingDate).toLocaleDateString()
            ].join(","))
        ].join("\n");
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.setAttribute('download', 'pending_deliveries.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const inputBaseStyle = "w-full bg-gray-700 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow";
    const readOnlyStyle = "bg-gray-800 cursor-not-allowed";

    return (
        <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-6">
            {toast && (
                <div className={`fixed top-5 right-5 z-[100] p-4 rounded-lg text-white shadow-lg ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
                    {toast.message}
                </div>
            )}
            <div className="max-w-screen-2xl mx-auto">
                <div className="bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-700 mb-6">
                    <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><FaShippingFast /> Update Delivery Status</h2>
                    <form onSubmit={handleUpdateSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Selected Booking</label>
                                <input type="text" value={updateData.bookingNo || "Select a booking from the list below"} readOnly className={`${inputBaseStyle} ${readOnlyStyle}`} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Party Name</label>
                                <input type="text" value={updateData.partyName} readOnly className={`${inputBaseStyle} ${readOnlyStyle}`} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Vehicle No</label>
                                <input type="text" value={updateData.vehicleNo} readOnly className={`${inputBaseStyle} ${readOnlyStyle}`} />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">New Status</label>
                                <select value={updateData.status} onChange={(e) => setUpdateData({ ...updateData, status: e.target.value })} className={inputBaseStyle}>
                                    <option value="in-transit">In Transit</option>
                                    <option value="delivered">Delivered</option>
                                    <option value="received">Received</option>
                                </select>
                            </div>
                            <div className={updateData.status === 'received' ? 'md:col-span-1' : 'md:col-span-2'}>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Remarks</label>
                                <input type="text" value={updateData.remarks} onChange={e => setUpdateData({...updateData, remarks: e.target.value})} className={inputBaseStyle} placeholder="Optional remarks"/>
                            </div>
                            {updateData.status === 'received' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">Proof Image*</label>
                                    <label htmlFor="file-upload" className={`${inputBaseStyle} flex items-center justify-between cursor-pointer`}>
                                        <span className="truncate text-gray-400 max-w-[calc(100%-100px)]">{updateData.proofImage?.name || "Choose File"}</span>
                                        <span className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded-lg text-sm"><FaUpload className="inline-block mr-1" /></span>
                                    </label>
                                    <input id="file-upload" type="file" className="sr-only" onChange={handleImageChange} accept="image/*" />
                                </div>
                            )}
                        </div>
                        {updateData.proofImage && updateData.status === 'received' && (
                            <div className="mt-2"><img src={URL.createObjectURL(updateData.proofImage)} alt="Preview" className="w-48 h-24 object-cover rounded-xl border border-gray-500" /></div>
                        )}
                        <div className="flex justify-end pt-2">
                            <button type="submit" disabled={loading || !updateData.bookingId} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 disabled:opacity-50">
                                <FaSave /> {loading ? 'Updating...' : 'Update Status'}
                            </button>
                        </div>
                    </form>
                </div>

                <div className="bg-gray-800 rounded-lg overflow-hidden">
                    <div className="p-4 border-b border-gray-700 space-y-4">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-bold text-white">Pending Deliveries ({filteredPendingDeliveries.length})</h2>
                            <button onClick={exportToCSV} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2">
                                <FaFileExcel/> Export to CSV
                            </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="relative">
                                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input type="text" placeholder="Search by Booking, Party, Vehicle, Route..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg"/>
                            </div>
                            <div className="relative">
                                <FaCalendarAlt className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input type="date" value={dateRange.from} onChange={e => setDateRange({...dateRange, from: e.target.value})} className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg"/>
                            </div>
                            <div className="relative">
                                <FaCalendarAlt className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input type="date" value={dateRange.to} onChange={e => setDateRange({...dateRange, to: e.target.value})} className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg"/>
                            </div>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-700">
                                <tr>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Booking No</th>
                                    {/* ADDED Columns for context */}
                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Party Name</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Vehicle No</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Route</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Current Status</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700">
                                {filteredPendingDeliveries.map(booking => (
                                    <tr key={booking._id} onClick={() => handleSelectBookingForUpdate(booking)} className="hover:bg-gray-700 cursor-pointer">
                                        <td className="px-4 py-4 text-white">{booking.bookingNo}</td>
                                        {/* ADDED Data for new columns */}
                                        <td className="px-4 py-4 text-gray-300">{booking.party?.name}</td>
                                        <td className="px-4 py-4 text-gray-300">{booking.vehicle?.vehicleNo}</td>
                                        <td className="px-4 py-4 text-gray-300">{`${booking.journey?.fromLocation} to ${booking.journey?.toLocation}`}</td>
                                        <td className="px-4 py-4"><StatusBadge status={booking.delivery?.status} /></td>
                                        <td className="px-4 py-4 text-gray-400">{new Date(booking.bookingDate).toLocaleDateString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DeliveryPending;
