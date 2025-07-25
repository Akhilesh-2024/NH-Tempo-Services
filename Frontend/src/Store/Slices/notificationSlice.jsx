import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

// Helper function to check if a bill is pending more than 3 days
const isPendingMoreThan3Days = (bookingDate) => {
  const booking = new Date(bookingDate);
  const now = new Date();
  const diffTime = Math.abs(now - booking);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 3;
};

// Generate notifications based on data
export const generateNotifications = createAsyncThunk(
  "notification/generate",
  async ({ bookings, parties, vehicles }, { rejectWithValue }) => {
    try {
      const notifications = [];

      // Ensure we have valid data arrays
      const validBookings = Array.isArray(bookings) ? bookings : [];
      const validParties = Array.isArray(parties) ? parties : [];
      const validVehicles = Array.isArray(vehicles) ? vehicles : [];

      if (validBookings.length === 0) {
        return notifications; // Return empty array if no bookings
      }

      // Check for bills pending more than 3 days - using correct nested structure
      const pendingBills = validBookings.filter(booking => {
        const hasPartyPending = booking.paymentStatus?.partyPaymentStatus === 'pending' || 
                               booking.paymentStatus?.partyPaymentStatus === 'partial';
        const hasVehiclePending = booking.paymentStatus?.vehiclePaymentStatus === 'pending' || 
                                 booking.paymentStatus?.vehiclePaymentStatus === 'partial';
        
        return (hasPartyPending || hasVehiclePending) && isPendingMoreThan3Days(booking.bookingDate);
      });

      pendingBills.forEach(booking => {
        const daysOverdue = Math.ceil((new Date() - new Date(booking.bookingDate)) / (1000 * 60 * 60 * 24)) - 3;
        notifications.push({
          id: `pending-bill-${booking._id}`,
          type: 'warning',
          title: 'Overdue Payment',
          message: `Bill for booking ${booking.bookingNo} is ${daysOverdue} days overdue`,
          bookingId: booking._id,
          timestamp: new Date().toISOString(),
          priority: 'high'
        });
      });

      // Check for pending deliveries
      const pendingDeliveries = validBookings.filter(booking => 
        booking.delivery?.status === 'pending' || 
        booking.delivery?.status === 'in-transit' ||
        booking.delivery?.status === 'delivered'
      );

      if (pendingDeliveries.length > 0) {
        notifications.push({
          id: 'pending-deliveries',
          type: 'info',
          title: 'Pending Deliveries',
          message: `${pendingDeliveries.length} deliveries are pending completion`,
          timestamp: new Date().toISOString(),
          priority: 'medium'
        });
      }

      // Check for pending party payments - using correct nested structure
      const pendingPartyPayments = validBookings.filter(booking => 
        booking.paymentStatus?.partyPaymentStatus === 'pending' || 
        booking.paymentStatus?.partyPaymentStatus === 'partial'
      );

      if (pendingPartyPayments.length > 0) {
        notifications.push({
          id: 'pending-party-payments',
          type: 'warning',
          title: 'Pending Party Payments',
          message: `${pendingPartyPayments.length} party payments are pending`,
          timestamp: new Date().toISOString(),
          priority: 'medium'
        });
      }

      // Check for pending vehicle payments - using correct nested structure
      const pendingVehiclePayments = validBookings.filter(booking => 
        booking.paymentStatus?.vehiclePaymentStatus === 'pending' || 
        booking.paymentStatus?.vehiclePaymentStatus === 'partial'
      );

      if (pendingVehiclePayments.length > 0) {
        notifications.push({
          id: 'pending-vehicle-payments',
          type: 'warning',
          title: 'Pending Vehicle Payments',
          message: `${pendingVehiclePayments.length} vehicle payments are pending`,
          timestamp: new Date().toISOString(),
          priority: 'medium'
        });
      }

      return notifications;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const notificationSlice = createSlice({
  name: "notification",
  initialState: {
    notifications: [],
    unreadCount: 0,
    loading: false,
    error: null,
  },
  reducers: {
    markAsRead: (state, action) => {
      const notification = state.notifications.find(n => n.id === action.payload);
      if (notification && !notification.read) {
        notification.read = true;
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    },
    markAllAsRead: (state) => {
      state.notifications.forEach(n => n.read = true);
      state.unreadCount = 0;
    },
    removeNotification: (state, action) => {
      const index = state.notifications.findIndex(n => n.id === action.payload);
      if (index !== -1) {
        const notification = state.notifications[index];
        if (!notification.read) {
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
        state.notifications.splice(index, 1);
      }
    },
    clearAllNotifications: (state) => {
      state.notifications = [];
      state.unreadCount = 0;
    },
    addNotification: (state, action) => {
      const newNotification = {
        ...action.payload,
        read: false,
        timestamp: new Date().toISOString()
      };
      state.notifications.unshift(newNotification);
      state.unreadCount += 1;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(generateNotifications.pending, (state) => {
        state.loading = true;
      })
      .addCase(generateNotifications.fulfilled, (state, action) => {
        state.loading = false;
        // Add new notifications and mark them as unread
        const newNotifications = action.payload.map(notification => ({
          ...notification,
          read: false
        }));
        
        // Remove old notifications of the same type and add new ones
        const existingIds = new Set(state.notifications.map(n => n.id));
        const uniqueNewNotifications = newNotifications.filter(n => !existingIds.has(n.id));
        
        state.notifications = [...uniqueNewNotifications, ...state.notifications];
        state.unreadCount += uniqueNewNotifications.length;
      })
      .addCase(generateNotifications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { 
  markAsRead, 
  markAllAsRead, 
  removeNotification, 
  clearAllNotifications, 
  addNotification 
} = notificationSlice.actions;

export default notificationSlice.reducer;