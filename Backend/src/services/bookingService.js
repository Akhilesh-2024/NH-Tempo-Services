/**
 * Booking Service - Business logic for booking calculations and operations
 */

/**
 * Calculate booking totals using the new Party Charges structure
 * @param {Object} charges - Charges object with new structure
 * @param {Object} vehiclePayment - Vehicle payment object
 * @returns {Object} Calculated totals
 */
export const calculateBookingTotals = (charges = {}, vehiclePayment = {}) => {
  try {
    // Ensure charges and vehiclePayment are objects
    if (typeof charges !== 'object' || charges === null) {
      charges = {};
    }
    if (typeof vehiclePayment !== 'object' || vehiclePayment === null) {
      vehiclePayment = {};
    }

    // Extract values and convert to numbers with better error handling
    const safeParseFloat = (value) => {
      if (value === "" || value === null || value === undefined) return 0;
      const parsed = parseFloat(value);
      return isNaN(parsed) ? 0 : parsed;
    };

    const dealAmount = safeParseFloat(charges.dealAmount);
    const advancePaid = safeParseFloat(charges.advancePaid);
    const vehicleCharges = safeParseFloat(charges.vehicleCharges);
    const commission = safeParseFloat(charges.commission);
    const localCharges = safeParseFloat(charges.localCharges);
    const hamali = safeParseFloat(charges.hamali);
    const tds = safeParseFloat(charges.tds);
    const stCharges = safeParseFloat(charges.stCharges);
    const other = safeParseFloat(charges.other);

    const actualVehicleCost = safeParseFloat(vehiclePayment.actualVehicleCost);
    const vehicleAdvance = safeParseFloat(vehiclePayment.vehicleAdvance);

    // Calculate new logic values
    const pendingAmount = dealAmount - advancePaid;
    const totalDeductions = vehicleCharges + commission + localCharges + hamali + tds + stCharges + other;
    const subTotal = dealAmount - totalDeductions;
    const vehicleBalance = actualVehicleCost - vehicleAdvance;

    return {
      dealAmount,
      pendingAmount: isNaN(pendingAmount) ? 0 : pendingAmount,
      subTotal: isNaN(subTotal) ? 0 : subTotal,
      previousAmount: dealAmount,
      finalPendingAmount: isNaN(pendingAmount) ? 0 : pendingAmount,
      vehicleBalance: isNaN(vehicleBalance) ? 0 : vehicleBalance,
      totalDeductions,
      // Individual values for reference
      vehicleCharges,
      commission,
      localCharges,
      hamali,
      tds,
      stCharges,
      other,
      actualVehicleCost,
      vehicleAdvance,
    };

  } catch (error) {
    console.error('❌ Error in calculateBookingTotals:', error);
    throw new Error(`Cannot convert object to primitive value: ${error.message}`);
  }
};

/**
 * Validate booking data before save
 * @param {Object} bookingData - Complete booking data
 * @returns {Object} Validation result
 */
export const validateBookingData = (bookingData) => {
  const errors = [];
  const requiredFields = [
    { field: 'bookingNo', path: 'bookingNo' },
    { field: 'party.name', path: 'party.name' },
    { field: 'vehicle.vehicleNo', path: 'vehicle.vehicleNo' },
    { field: 'journey.fromLocation', path: 'journey.fromLocation' },
    { field: 'journey.toLocation', path: 'journey.toLocation' }
  ];

  requiredFields.forEach(({ field, path }) => {
    const value = getNestedValue(bookingData, path);
    if (!value || String(value).trim() === '') {
      errors.push(`${field} is required`);
    }
  });

  // Validate delivery status enum
  const validDeliveryStatuses = ['pending', 'in-transit', 'delivered', 'received'];
  if (bookingData.delivery?.status && !validDeliveryStatuses.includes(bookingData.delivery.status)) {
    errors.push(`delivery.status must be one of: ${validDeliveryStatuses.join(', ')}`);
  }

  // Validate payment status enum
  const validPaymentStatuses = ['pending', 'partial', 'completed'];
  if (bookingData.paymentStatus?.partyPaymentStatus && !validPaymentStatuses.includes(bookingData.paymentStatus.partyPaymentStatus)) {
    errors.push(`paymentStatus.partyPaymentStatus must be one of: ${validPaymentStatuses.join(', ')}`);
  }
  if (bookingData.paymentStatus?.vehiclePaymentStatus && !validPaymentStatuses.includes(bookingData.paymentStatus.vehiclePaymentStatus)) {
    errors.push(`paymentStatus.vehiclePaymentStatus must be one of: ${validPaymentStatuses.join(', ')}`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Get nested object value by dot notation path
 * @param {Object} obj - Source object
 * @param {string} path - Dot notation path (e.g., 'party.name')
 * @returns {any} Value or undefined
 */
const getNestedValue = (obj, path) => {
  return path.split('.').reduce((current, key) => current && current[key], obj);
};

/**
 * Migrate old booking structure to new structure
 * @param {Object} oldBooking - Booking with old structure
 * @returns {Object} Booking with new structure
 */
export const migrateBookingStructure = (oldBooking) => {
  const newBooking = { ...oldBooking };

  if (oldBooking.charges) {
    const oldCharges = oldBooking.charges;
    
    if (!oldCharges.dealAmount && oldCharges.vehicleCostParty) {
      newBooking.charges = {
        ...oldCharges,
        dealAmount: oldCharges.vehicleCostParty || 0,
        advancePaid: oldCharges.partyAdvance || 0,
        vehicleCharges: 0,
        localCharges: 0,
        other: oldCharges.otherCharges || 0,
        pendingAmount: (oldCharges.vehicleCostParty || 0) - (oldCharges.partyAdvance || 0),
        subTotal: oldCharges.totalAmount || 0,
        previousAmount: oldCharges.vehicleCostParty || 0,
        finalPendingAmount: oldCharges.partyBalance || 0,
      };
    }
  }

  return newBooking;
};

/**
 * Determine payment status based on balances and advance paid
 * @param {number} partyBalance - Party pending amount
 * @param {number} vehicleBalance - Vehicle pending amount
 * @param {number} partyAdvancePaid - Amount already paid by party (optional)
 * @param {number} vehicleAdvancePaid - Amount already paid for vehicle (optional)
 * @returns {Object} Payment status object
 */
export const determinePaymentStatus = (partyBalance, vehicleBalance, partyAdvancePaid = 0, vehicleAdvancePaid = 0) => {
  let partyPaymentStatus = 'pending';
  if (partyBalance <= 0) {
    partyPaymentStatus = 'completed';
  } else if (partyAdvancePaid > 0) {
    partyPaymentStatus = 'pending';
  }

  let vehiclePaymentStatus = 'pending';
  if (vehicleBalance <= 0) {
    vehiclePaymentStatus = 'completed';
  } else if (vehicleAdvancePaid > 0) {
    vehiclePaymentStatus = 'pending';
  }

  return {
    partyPaymentStatus,
    vehiclePaymentStatus
  };
};

export default {
  calculateBookingTotals,
  validateBookingData,
  migrateBookingStructure,
  determinePaymentStatus
};