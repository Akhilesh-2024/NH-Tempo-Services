import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

// Define the base API URL. Ensure your environment variable is set correctly.
const API = (import.meta.env.VITE_API_URL || 'http://localhost:5003') + "/api/bookings";

// -------------------- ASYNC THUNKS --------------------

// Create a new booking
export const createBooking = createAsyncThunk("booking/create", async (formData, { rejectWithValue }) => {
  try {
    const response = await axios.post(API, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data.booking;
  } catch (err) {
    return rejectWithValue(err.response?.data || { message: err.message });
  }
});

// Fetch all bookings
export const fetchBookings = createAsyncThunk("booking/fetchAll", async (_, { rejectWithValue }) => {
  try {
    const response = await axios.get(API);
    return response.data.bookings || [];
  } catch (err) {
    return rejectWithValue(err.response?.data || { message: err.message });
  }
});

// Fetch the last booking number for auto-incrementing
export const fetchLastBookingNo = createAsyncThunk("booking/fetchLastNo", async (_, { rejectWithValue }) => {
  try {
    const response = await axios.get(`${API}/last`);
    return response.data.lastBookingNo;
  } catch (err) {
    return rejectWithValue(err.response?.data || { message: err.message });
  }
});

// Fetch a single booking by its ID
export const fetchBookingById = createAsyncThunk("booking/fetchById", async (id, { rejectWithValue }) => {
  try {
    const response = await axios.get(`${API}/${id}`);
    return response.data.booking;
  } catch (err) {
    return rejectWithValue(err.response?.data || { message: err.message });
  }
});

// Update an existing booking
export const updateBooking = createAsyncThunk("booking/update", async ({ id, formData }, { rejectWithValue }) => {
  try {
    const headers = formData instanceof FormData ? { "Content-Type": "multipart/form-data" } : {};
    const response = await axios.put(`${API}/${id}`, formData, { headers });
    return response.data.booking;
  } catch (err) {
    return rejectWithValue(err.response?.data || { message: err.message });
  }
});

// Delete a booking
export const deleteBooking = createAsyncThunk("booking/delete", async (id, { rejectWithValue }) => {
  try {
    await axios.delete(`${API}/${id}`);
    return id;
  } catch (err) {
    return rejectWithValue(err.response?.data || { message: err.message });
  }
});

// Add a payment received from a party
export const addPartyPayment = createAsyncThunk(
  "booking/addPartyPayment",
  async ({ id, paymentData }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API}/${id}/party-payment`, paymentData);
      return response.data.booking;
    } catch (err) {
      return rejectWithValue(err.response?.data || { message: err.message });
    }
  }
);

// Add a payment made to a vehicle owner
export const addVehiclePayment = createAsyncThunk(
  "booking/addVehiclePayment",
  async ({ id, paymentData }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API}/${id}/vehicle-payment`, paymentData);
      return response.data.booking;
    } catch (err) {
      return rejectWithValue(err.response?.data || { message: err.message });
    }
  }
);

// Update the delivery status of a booking
export const updateDeliveryStatus = createAsyncThunk(
  "booking/updateDeliveryStatus",
  async ({ id, statusData }, { rejectWithValue }) => {
    try {
      const response = await axios.put(`${API}/${id}/delivery-status`, statusData);
      return response.data.booking;
    } catch (err) {
      return rejectWithValue(err.response?.data || { message: err.message });
    }
  }
);

// -------------------- SLICE DEFINITION --------------------
const bookingSlice = createSlice({
  name: "booking",
  initialState: {
    bookings: [],
    lastBookingNo: null,
    currentBooking: null,
    loading: false,
    error: null,
  },
  reducers: {
    clearBookingError: (state) => {
      state.error = null;
    },
    clearCurrentBooking: (state) => {
      state.currentBooking = null;
    },
  },
  extraReducers: (builder) => {
    const updateBookingInState = (state, action) => {
        state.loading = false;
        const index = state.bookings.findIndex((b) => b._id === action.payload._id);
        if (index !== -1) {
            state.bookings[index] = action.payload;
        }
        if (state.currentBooking?._id === action.payload._id) {
            state.currentBooking = action.payload;
        }
    };

    const handlePending = (state) => { state.loading = true; };
    const handleRejected = (state, action) => {
        state.loading = false;
        state.error = action.payload;
    };

    builder
      // Create Booking
      .addCase(createBooking.pending, handlePending)
      .addCase(createBooking.fulfilled, (state, action) => {
        state.loading = false;
        state.bookings.unshift(action.payload);
      })
      .addCase(createBooking.rejected, handleRejected)

      // Fetch All Bookings
      .addCase(fetchBookings.pending, handlePending)
      .addCase(fetchBookings.fulfilled, (state, action) => {
        state.loading = false;
        state.bookings = action.payload;
      })
      .addCase(fetchBookings.rejected, handleRejected)

      // Fetch Last Booking Number
      .addCase(fetchLastBookingNo.fulfilled, (state, action) => {
        state.lastBookingNo = action.payload;
      })

      // Fetch Booking by ID
      .addCase(fetchBookingById.fulfilled, (state, action) => {
        state.currentBooking = action.payload;
      })

      // Update Booking
      .addCase(updateBooking.pending, handlePending)
      .addCase(updateBooking.fulfilled, updateBookingInState)
      .addCase(updateBooking.rejected, handleRejected)

      // Delete Booking
      .addCase(deleteBooking.pending, handlePending)
      .addCase(deleteBooking.fulfilled, (state, action) => {
        state.loading = false;
        state.bookings = state.bookings.filter((b) => b._id !== action.payload);
        if (state.currentBooking?._id === action.payload) {
          state.currentBooking = null;
        }
      })
      .addCase(deleteBooking.rejected, handleRejected)
      
      // Add Party Payment
      .addCase(addPartyPayment.pending, handlePending)
      .addCase(addPartyPayment.fulfilled, updateBookingInState)
      .addCase(addPartyPayment.rejected, handleRejected)

      // Add Vehicle Payment
      .addCase(addVehiclePayment.pending, handlePending)
      .addCase(addVehiclePayment.fulfilled, updateBookingInState)
      .addCase(addVehiclePayment.rejected, handleRejected)

      // Update Delivery Status
      .addCase(updateDeliveryStatus.pending, handlePending)
      .addCase(updateDeliveryStatus.fulfilled, updateBookingInState)
      .addCase(updateDeliveryStatus.rejected, handleRejected);
  },
});

export const { clearBookingError, clearCurrentBooking } = bookingSlice.actions;
export default bookingSlice.reducer;