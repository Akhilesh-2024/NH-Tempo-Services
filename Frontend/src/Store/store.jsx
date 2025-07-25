// store.js
import { configureStore } from '@reduxjs/toolkit';
import profileReducer from './Slices/profileSlice';
import masterReducer from './Slices/masterSlice';
import partyReducer from './Slices/partySlice';
import vehicleReducer from './Slices/vehicleSlice';
import bookingReducer from './Slices/bookingSlice';
import notificationReducer from './Slices/notificationSlice';
import dashboardReducer from './Slices/dashboardSlice';

export const store = configureStore({
  reducer: {
    profile: profileReducer,
    master: masterReducer,
    party: partyReducer,
    vehicle: vehicleReducer,
    booking: bookingReducer,
    notification: notificationReducer,
    dashboard: dashboardReducer,
  },
});
