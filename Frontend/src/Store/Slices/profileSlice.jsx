import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Helper function to add Authorization header
const getAuthHeader = (isFormData = false) => {
  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };
  
  // Don't set Content-Type for FormData, let browser set it with boundary
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }
  
  return { headers };
};

// ---------------- FETCH PROFILE ----------------
export const fetchProfile = createAsyncThunk('profile/fetchProfile', async () => {
  const response = await axios.get('/api/admin/profile', getAuthHeader());
  return response.data;  // Backend returns admin object without password
});

// ---------------- UPDATE PROFILE ----------------
export const updateProfile = createAsyncThunk(
  'profile/updateProfile',
  async (updatedData) => {
    // Check if it's FormData (for file uploads)
    const isFormData = updatedData instanceof FormData;
    const response = await axios.put('/api/admin/profile', updatedData, getAuthHeader(isFormData));
    return response.data.admin; // We return updated admin object
  }
);

const profileSlice = createSlice({
  name: 'profile',
  initialState: {
    user: null,
    status: 'idle',   // 'idle' | 'loading' | 'succeeded' | 'failed'
    error: null,
  },
  reducers: {
    clearProfile(state) {
      state.user = null;
      state.status = 'idle';
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // -------- Fetch Profile --------
      .addCase(fetchProfile.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchProfile.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.user = action.payload;
      })
      .addCase(fetchProfile.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      })

      // -------- Update Profile --------
      .addCase(updateProfile.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.user = action.payload;
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      });
  },
});

export const { clearProfile } = profileSlice.actions;
export default profileSlice.reducer;
