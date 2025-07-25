import { useEffect, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { fetchBookings } from '../Store/Slices/bookingSlice';
import { fetchParties } from '../Store/Slices/partySlice';
import { fetchVehicles } from '../Store/Slices/vehicleSlice';
import { generateNotifications } from '../Store/Slices/notificationSlice';
import { generateDashboardStats } from '../Store/Slices/dashboardSlice';

export const useRealTimeUpdates = (intervalMinutes = 5) => {
  const dispatch = useDispatch();

  const updateAllData = useCallback(async () => {
    try {
      
      // Fetch all data
      const [bookingsAction, partiesAction, vehiclesAction] = await Promise.all([
        dispatch(fetchBookings()),
        dispatch(fetchParties()),
        dispatch(fetchVehicles())
      ]);

      // Extract the data from the fulfilled actions
      const bookingsResult = bookingsAction.payload || [];
      const partiesResult = partiesAction.payload || [];
      const vehiclesResult = vehiclesAction.payload || [];

      // Always generate notifications and dashboard stats (even with empty arrays)
      await Promise.all([
        dispatch(generateNotifications({ 
          bookings: bookingsResult, 
          parties: partiesResult, 
          vehicles: vehiclesResult 
        })),
        dispatch(generateDashboardStats({ 
          bookings: bookingsResult, 
          parties: partiesResult, 
          vehicles: vehiclesResult 
        }))
      ]);

    } catch (error) {
      console.error(error);
    }
  }, [dispatch]);

  useEffect(() => {
    // Initial data fetch
    updateAllData();

    // Set up interval for real-time updates
    const interval = setInterval(updateAllData, intervalMinutes * 60 * 1000);

    return () => clearInterval(interval);
  }, [updateAllData, intervalMinutes]);

  return { updateAllData };
};

export default useRealTimeUpdates;