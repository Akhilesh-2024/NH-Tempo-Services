import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const API = import.meta.env.VITE_API_URL + "/api/master";

// Async thunks
export const fetchMasters = createAsyncThunk("master/fetchMasters", async () => {
  const response = await axios.get(API);
  return response.data.data;
});

export const addMaster = createAsyncThunk("master/addMaster", async (name) => {
  const response = await axios.post(API, { name });
  return response.data.data;
});

export const updateMaster = createAsyncThunk(
  "master/updateMaster",
  async ({ id, name }) => {
    const response = await axios.put(`${API}/${id}`, { name });
    return response.data.data;
  }
);

export const deleteMaster = createAsyncThunk("master/deleteMaster", async (id) => {
  await axios.delete(`${API}/${id}`);
  return id;
});

export const deleteMultipleMasters = createAsyncThunk(
  "master/deleteMultipleMasters",
  async (ids) => {
    const deletePromises = ids.map((id) => axios.delete(`${API}/${id}`));
    await Promise.all(deletePromises);
    return ids;
  }
);

const masterSlice = createSlice({
  name: "master",
  initialState: {
    masters: [],
    status: "idle",
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchMasters.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchMasters.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.masters = action.payload;
      })
      .addCase(fetchMasters.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message;
      })
      .addCase(addMaster.fulfilled, (state, action) => {
        state.masters.unshift(action.payload);
      })
      .addCase(updateMaster.fulfilled, (state, action) => {
        const index = state.masters.findIndex((m) => m._id === action.payload._id);
        if (index !== -1) {
          state.masters[index] = action.payload;
        }
      })
      .addCase(deleteMaster.fulfilled, (state, action) => {
        state.masters = state.masters.filter((m) => m._id !== action.payload);
      })
      .addCase(deleteMultipleMasters.fulfilled, (state, action) => {
        state.masters = state.masters.filter((m) => !action.payload.includes(m._id));
      });
  },
});

export default masterSlice.reducer;
