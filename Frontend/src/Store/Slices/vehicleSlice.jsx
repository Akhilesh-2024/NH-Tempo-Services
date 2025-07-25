import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const API = import.meta.env.VITE_API_URL + "/api/vehicles";

// Thunks
export const fetchVehicles = createAsyncThunk("vehicle/fetchVehicles", async (_, { rejectWithValue }) => {
  try {
    const res = await axios.get(API);
    return res.data.data || [];
  } catch (err) {
    return rejectWithValue(err.response?.data || { message: err.message });
  }
});

export const addVehicle = createAsyncThunk("vehicle/addVehicle", async (vehicle) => {
  const res = await axios.post(API, vehicle);
  return res.data.data;
});

export const updateVehicle = createAsyncThunk(
  "vehicle/updateVehicle",
  async ({ id, data }) => {
    const res = await axios.put(`${API}/${id}`, data);
    return res.data.data;
  }
);

export const deleteVehicle = createAsyncThunk("vehicle/deleteVehicle", async (id) => {
  await axios.delete(`${API}/${id}`);
  return id;
});

export const deleteMultipleVehicles = createAsyncThunk(
  "vehicle/deleteMultipleVehicles",
  async (ids) => {
    await axios.post(`${API}/delete-multiple`, { ids });
    return ids;
  }
);

// Slice
const vehicleSlice = createSlice({
  name: "vehicle",
  initialState: {
    vehicles: [],
    selectedVehicle: null,
    status: "idle",
    error: null,
  },
  reducers: {
    setSelectedVehicle: (state, action) => {
      state.selectedVehicle = action.payload;
    },
    clearSelectedVehicle: (state) => {
      state.selectedVehicle = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchVehicles.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchVehicles.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.vehicles = action.payload;
      })
      .addCase(fetchVehicles.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message;
      })
      .addCase(addVehicle.fulfilled, (state, action) => {
        state.vehicles.unshift(action.payload);
      })
      .addCase(updateVehicle.fulfilled, (state, action) => {
        const index = state.vehicles.findIndex((v) => v._id === action.payload._id);
        if (index !== -1) state.vehicles[index] = action.payload;
      })
      .addCase(deleteVehicle.fulfilled, (state, action) => {
        state.vehicles = state.vehicles.filter((v) => v._id !== action.payload);
      })
      .addCase(deleteMultipleVehicles.fulfilled, (state, action) => {
        state.vehicles = state.vehicles.filter((v) => !action.payload.includes(v._id));
      });
  },
});

export const { setSelectedVehicle, clearSelectedVehicle } = vehicleSlice.actions;
export default vehicleSlice.reducer;
