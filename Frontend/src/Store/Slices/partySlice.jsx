import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const API = import.meta.env.VITE_API_URL + "/api/parties";

// Thunks
export const fetchParties = createAsyncThunk("party/fetchParties", async (_, { rejectWithValue }) => {
  try {
    const res = await axios.get(API);
    return res.data.data || [];
  } catch (err) {
    return rejectWithValue(err.response?.data || { message: err.message });
  }
});

export const addParty = createAsyncThunk("party/addParty", async (party) => {
  const res = await axios.post(API, party);
  return res.data.data;
});

export const updateParty = createAsyncThunk(
  "party/updateParty",
  async ({ id, data }) => {
    const res = await axios.put(`${API}/${id}`, data);
    return res.data.data;
  }
);

export const deleteParty = createAsyncThunk("party/deleteParty", async (id) => {
  await axios.delete(`${API}/${id}`);
  return id;
});

export const deleteMultipleParties = createAsyncThunk(
  "party/deleteMultipleParties",
  async (ids) => {
    await axios.post(`${API}/delete-multiple`, { ids });
    return ids;
  }
);

// Slice
const partySlice = createSlice({
  name: "party",
  initialState: {
    parties: [],
    selectedParty: null,
    status: "idle",
    error: null,
  },
  reducers: {
    setSelectedParty: (state, action) => {
      state.selectedParty = action.payload;
    },
    clearSelectedParty: (state) => {
      state.selectedParty = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchParties.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchParties.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.parties = action.payload;
      })
      .addCase(fetchParties.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message;
      })
      .addCase(addParty.fulfilled, (state, action) => {
        state.parties.unshift(action.payload);
      })
      .addCase(updateParty.fulfilled, (state, action) => {
        const index = state.parties.findIndex((p) => p._id === action.payload._id);
        if (index !== -1) state.parties[index] = action.payload;
      })
      .addCase(deleteParty.fulfilled, (state, action) => {
        state.parties = state.parties.filter((p) => p._id !== action.payload);
      })
      .addCase(deleteMultipleParties.fulfilled, (state, action) => {
        state.parties = state.parties.filter((p) => !action.payload.includes(p._id));
      });
  },
});

export const { setSelectedParty, clearSelectedParty } = partySlice.actions;
export default partySlice.reducer;
