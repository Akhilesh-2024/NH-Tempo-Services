import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

// Generate dashboard statistics
export const generateDashboardStats = createAsyncThunk(
  "dashboard/generateStats",
  async ({ bookings, parties, vehicles }, { rejectWithValue }) => {
    try {
      // Ensure we have valid data arrays
      const validBookings = Array.isArray(bookings) ? bookings : [];
      const validParties = Array.isArray(parties) ? parties : [];
      const validVehicles = Array.isArray(vehicles) ? vehicles : [];

      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      // Basic counts
      const totalBookings = validBookings.length;
      const totalParties = validParties.length;
      const totalVehicles = validVehicles.length;

      // Only show sample data if absolutely no data exists
      const showSampleData = false; // Disable sample data since we have real data

      // Recent bookings (last 30 days)
      const recentBookings = validBookings.filter(b => new Date(b.bookingDate) >= thirtyDaysAgo);
      const weeklyBookings = validBookings.filter(b => new Date(b.bookingDate) >= sevenDaysAgo);

      // Pending counts - using correct nested structure
      const pendingPartyPayments = validBookings.filter(booking => {
        return booking.paymentStatus?.partyPaymentStatus === 'pending' || 
               booking.paymentStatus?.partyPaymentStatus === 'partial';
      }).length;

      const pendingVehiclePayments = validBookings.filter(booking => {
        return booking.paymentStatus?.vehiclePaymentStatus === 'pending' || 
               booking.paymentStatus?.vehiclePaymentStatus === 'partial';
      }).length;

      const pendingDeliveries = validBookings.filter(booking => 
        booking.delivery?.status === 'pending' || 
        booking.delivery?.status === 'in-transit' ||
        booking.delivery?.status === 'delivered'
      ).length;

      // Revenue calculations - using correct charges structure
      const totalRevenue = validBookings.reduce((sum, booking) => {
        let bookingTotal = 0;
        
        // Get revenue from charges.dealAmount (total deal amount)
        if (booking.charges && typeof booking.charges === 'object') {
          bookingTotal = booking.charges.dealAmount || booking.charges.total || 
                        booking.charges.amount || booking.charges.grandTotal || 0;
        } else if (typeof booking.charges === 'number') {
          bookingTotal = booking.charges;
        }
        
        // Only count if party payment is received/completed
        const partyPaymentReceived = booking.paymentStatus?.partyPaymentStatus === 'received' || 
                                   booking.paymentStatus?.partyPaymentStatus === 'completed' || 
                                   booking.paymentStatus?.partyPaymentStatus === 'paid';
        
        if (!partyPaymentReceived) {
          bookingTotal = 0; // Don't count pending payments as revenue
        }
        
        return sum + bookingTotal;
      }, 0);

      const monthlyRevenue = recentBookings.reduce((sum, booking) => {
        let bookingTotal = 0;
        
        // Get revenue from charges.dealAmount
        if (booking.charges && typeof booking.charges === 'object') {
          bookingTotal = booking.charges.dealAmount || booking.charges.total || 
                        booking.charges.amount || booking.charges.grandTotal || 0;
        } else if (typeof booking.charges === 'number') {
          bookingTotal = booking.charges;
        }
        
        // Only count if party payment is received/completed
        const partyPaymentReceived = booking.paymentStatus?.partyPaymentStatus === 'received' || 
                                   booking.paymentStatus?.partyPaymentStatus === 'completed' || 
                                   booking.paymentStatus?.partyPaymentStatus === 'paid';
        
        if (!partyPaymentReceived) {
          bookingTotal = 0;
        }
        
        return sum + bookingTotal;
      }, 0);

      // Chart data for bookings over time (last 7 days)
      const bookingChartData = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const dayBookings = validBookings.filter(b => {
          if (!b.bookingDate) return false;
          const bookingDate = new Date(b.bookingDate);
          return bookingDate.toDateString() === date.toDateString();
        }).length;
        
        bookingChartData.push({
          name: date.toLocaleDateString('en-US', { weekday: 'short' }),
          value: dayBookings,
          date: date.toISOString().split('T')[0]
        });
      }

      // Chart will show actual data or zeros if no bookings

      // Revenue chart data (last 6 months)
      const revenueChartData = [];
      for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
        
        const monthBookings = validBookings.filter(b => {
          const bookingDate = new Date(b.bookingDate);
          return bookingDate >= date && bookingDate <= monthEnd;
        });

        const monthRevenue = monthBookings.reduce((sum, booking) => {
          let bookingTotal = 0;
          
          // Get revenue from charges.dealAmount
          if (booking.charges && typeof booking.charges === 'object') {
            bookingTotal = booking.charges.dealAmount || booking.charges.total || 
                          booking.charges.amount || booking.charges.grandTotal || 0;
          } else if (typeof booking.charges === 'number') {
            bookingTotal = booking.charges;
          }
          
          // Only count if party payment is received
          const partyPaymentReceived = booking.paymentStatus?.partyPaymentStatus === 'received' || 
                                     booking.paymentStatus?.partyPaymentStatus === 'completed' || 
                                     booking.paymentStatus?.partyPaymentStatus === 'paid';
          
          if (partyPaymentReceived) {
            return sum + bookingTotal;
          }
          return sum;
        }, 0);

        revenueChartData.push({
          name: date.toLocaleDateString('en-US', { month: 'short' }),
          value: monthRevenue
        });
      }

      // Revenue chart will show actual data

      // Status distribution for pie chart
      const completedCount = validBookings.filter(b => b.delivery?.status === 'received').length;
      const inProgressCount = validBookings.filter(b => 
        b.delivery?.status === 'pending' || 
        b.delivery?.status === 'in-transit' ||
        b.delivery?.status === 'delivered'
      ).length;
      const pendingCount = validBookings.filter(b => !b.delivery?.status || b.delivery?.status === 'pending').length;

      const statusData = [
        { 
          name: 'Completed', 
          value: completedCount,
          color: '#22c55e'
        },
        { 
          name: 'In Progress', 
          value: inProgressCount,
          color: '#f59e0b'
        },
        { 
          name: 'Pending', 
          value: pendingCount,
          color: '#ef4444'
        }
      ];

      // Recent activities
      const recentActivities = [];
      
      // Add recent bookings
      const latestBookings = [...validBookings]
        .sort((a, b) => new Date(b.createdAt || b.bookingDate) - new Date(a.createdAt || a.bookingDate))
        .slice(0, 3);
      
      latestBookings.forEach(booking => {
        recentActivities.push({
          id: `booking-${booking._id}`,
          type: 'booking',
          title: 'New booking added',
          description: `Booking ${booking.bookingNo} for ${booking.party?.name}`,
          time: new Date(booking.createdAt || booking.bookingDate).toLocaleString(),
          icon: 'Calendar'
        });
      });

      // Add recent vehicles (assuming createdAt field exists)
      const latestVehicles = [...validVehicles]
        .sort((a, b) => new Date(b.createdAt || b.updatedAt || 0) - new Date(a.createdAt || a.updatedAt || 0))
        .slice(0, 2);
      
      latestVehicles.forEach(vehicle => {
        recentActivities.push({
          id: `vehicle-${vehicle._id}`,
          type: 'vehicle',
          title: 'New vehicle added',
          description: `Vehicle ${vehicle.vehicleNo} - ${vehicle.vehicleType}`,
          time: new Date(vehicle.createdAt || vehicle.updatedAt || Date.now()).toLocaleString(),
          icon: 'Truck'
        });
      });

      // Add recent parties
      const latestParties = [...validParties]
        .sort((a, b) => new Date(b.createdAt || b.updatedAt || 0) - new Date(a.createdAt || a.updatedAt || 0))
        .slice(0, 2);
      
      latestParties.forEach(party => {
        recentActivities.push({
          id: `party-${party._id}`,
          type: 'party',
          title: 'New party added',
          description: `${party.name} - ${party.location}`,
          time: new Date(party.createdAt || party.updatedAt || Date.now()).toLocaleString(),
          icon: 'Users'
        });
      });

      // Sort activities by time and take latest 5
      recentActivities.sort((a, b) => new Date(b.time) - new Date(a.time));

      return {
        totalBookings,
        totalParties,
        totalVehicles,
        pendingPartyPayments,
        pendingVehiclePayments,
        pendingDeliveries,
        totalRevenue,
        monthlyRevenue,
        recentBookingsCount: recentBookings.length,
        weeklyBookingsCount: weeklyBookings.length,
        bookingChartData,
        revenueChartData,
        statusData,
        recentActivities: recentActivities.slice(0, 5),
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const dashboardSlice = createSlice({
  name: "dashboard",
  initialState: {
    stats: {
      totalBookings: 0,
      totalParties: 0,
      totalVehicles: 0,
      pendingPartyPayments: 0,
      pendingVehiclePayments: 0,
      pendingDeliveries: 0,
      totalRevenue: 0,
      monthlyRevenue: 0,
      recentBookingsCount: 0,
      weeklyBookingsCount: 0,
      bookingChartData: [],
      revenueChartData: [],
      statusData: [],
      recentActivities: [],
      lastUpdated: null
    },
    loading: false,
    error: null,
  },
  reducers: {
    clearDashboardError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(generateDashboardStats.pending, (state) => {
        state.loading = true;
      })
      .addCase(generateDashboardStats.fulfilled, (state, action) => {
        state.loading = false;
        state.stats = action.payload;
      })
      .addCase(generateDashboardStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearDashboardError } = dashboardSlice.actions;
export default dashboardSlice.reducer;