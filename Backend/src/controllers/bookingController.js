import Booking from "../models/bookingModel.js";
import mongoose from "mongoose";
import path from "path";
import fs from "fs";
import {
  calculateBookingTotals,
  validateBookingData,
  migrateBookingStructure,
  determinePaymentStatus
} from "../services/bookingService.js";

// -------------------- CREATE BOOKING --------------------
export const createBooking = async (req, res) => {
  try {
    const safeParseJSON = (data) => {
      if (typeof data === 'object' && data !== null) {
        return data; // Already an object
      }
      if (typeof data === 'string') {
        try {
          return JSON.parse(data);
        } catch (e) {
          return {};
        }
      }
      return {};
    };

    const getPartyData = () => {
      if (req.body.party) return safeParseJSON(req.body.party);
      return { name: req.body.partyName, address: req.body.partyAddress, contact: req.body.partyContact, gstNo: req.body.partyGstNo };
    };
    const getVehicleData = () => {
      if (req.body.vehicle) return safeParseJSON(req.body.vehicle);
      return { vehicleNo: req.body.vehicleNo, ownerName: req.body.ownerName, ownerContact: req.body.ownerContact, vehicleType: req.body.vehicleType };
    };
    const getJourneyData = () => {
      if (req.body.journey) return safeParseJSON(req.body.journey);
      return { fromLocation: req.body.fromLocation, toLocation: req.body.toLocation };
    };
    const getDeliveryData = () => {
        const delivery = req.body.delivery ? safeParseJSON(req.body.delivery) : {};
        return {
          status: delivery.status || req.body.deliveryStatus || "pending",
          remarks: delivery.remarks || req.body.deliveryRemarks || "",
          proofImage: req.file ? path.join("upload", "deliveryProof", req.file.filename) : delivery.existingImagePath || "",
        };
    };

    let data = {
      bookingNo: req.body.bookingNo,
      bookingDate: req.body.bookingDate,
      ourGstNo: req.body.ourGstNo,
      party: getPartyData(),
      vehicle: (() => {
        const vehicleData = getVehicleData();
        return {
          vehicleNo: vehicleData.vehicleNumber || vehicleData.vehicleNo,
          ownerName: vehicleData.ownerName,
          ownerContact: vehicleData.contactNumber || vehicleData.ownerContact,
          vehicleType: vehicleData.vehicleType,
        };
      })(),
      journey: getJourneyData(),
      delivery: getDeliveryData(),
      charges: safeParseJSON(req.body.charges) || {},
      vehiclePayment: safeParseJSON(req.body.vehiclePayment) || {},
      paymentStatus: safeParseJSON(req.body.paymentStatus) || {},
    };

    const validation = validateBookingData(data);
    if (!validation.isValid) {
      return res.status(400).json({ success: false, message: "Validation failed", errors: validation.errors });
    }

    const calculatedTotals = calculateBookingTotals(data.charges, data.vehiclePayment);
    data.charges = { ...data.charges, ...calculatedTotals };

    const paymentStatuses = determinePaymentStatus(
      calculatedTotals.finalPendingAmount, 
      calculatedTotals.vehicleBalance,
      data.charges.advancePaid || 0,
      data.vehiclePayment.vehicleAdvance || 0
    );
    data.paymentStatus = { ...data.paymentStatus, ...paymentStatuses };

    const booking = await Booking.create(data);
    return res.status(201).json({ success: true, message: "Booking created successfully", booking: booking.toObject() });
  } catch (error) {
    console.error("Error creating booking:", error);
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: `Booking number "${req.body.bookingNo}" already exists.` });
    }
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ success: false, message: "Validation failed", errors });
    }
    return res.status(500).json({ success: false, message: "Failed to create booking", error: error.message });
  }
};

// -------------------- GET ALL BOOKINGS (FIXED) --------------------
export const getBookings = async (req, res) => {
  try {
    const bookings = await Booking.find().sort({ createdAt: -1 }).lean();

    const sanitizedBookings = bookings.map(booking => {
        return {
            ...booking,
            charges: booking.charges && typeof booking.charges === 'object' ? booking.charges : {},
            vehiclePayment: booking.vehiclePayment && typeof booking.vehiclePayment === 'object' ? booking.vehiclePayment : {},
            party: booking.party && typeof booking.party === 'object' ? booking.party : {},
            vehicle: booking.vehicle && typeof booking.vehicle === 'object' ? booking.vehicle : {},
            journey: booking.journey && typeof booking.journey === 'object' ? booking.journey : {},
            delivery: booking.delivery && typeof booking.delivery === 'object' ? booking.delivery : {},
            paymentStatus: booking.paymentStatus && typeof booking.paymentStatus === 'object' ? booking.paymentStatus : {},
        };
    });

    res.status(200).json({ success: true, bookings: sanitizedBookings });
  } catch (error) {
    console.error("Error fetching bookings:", error);
    res.status(500).json({ success: false, message: "Failed to fetch bookings", error: { message: error.message } });
  }
};

// -------------------- GET BOOKING BY ID --------------------
export const getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking)
      return res.status(404).json({ success: false, message: "Booking not found" });
    res.status(200).json({ success: true, booking });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch booking", error });
  }
};

// -------------------- GET LAST BOOKING NUMBER --------------------
export const getLastBookingNo = async (req, res) => {
  try {
    const lastBooking = await Booking.findOne().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      lastBookingNo: lastBooking ? lastBooking.bookingNo : null,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch last booking number",
      error,
    });
  }
};

// -------------------- UPDATE BOOKING (FIXED) --------------------
export const updateBooking = async (req, res) => {
  try {
    const bookingId = req.params.id;
    let updateData = { ...req.body };

    const safeParseJSON = (data) => {
      if (typeof data === 'object' && data !== null) {
        return data; // Already an object
      }
      if (typeof data === 'string') {
        try {
          return JSON.parse(data);
        } catch (e) {
          return {};
        }
      }
      return {};
    };

    const fieldsToParse = ['party', 'vehicle', 'journey', 'delivery', 'charges', 'vehiclePayment', 'paymentStatus'];
    for (const field of fieldsToParse) {
        if (updateData[field]) {
            updateData[field] = safeParseJSON(updateData[field]);
        }
    }

    const existingBooking = await Booking.findById(bookingId);
    if (!existingBooking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    if (req.file) {
      if (existingBooking.delivery.proofImage) {
        const oldPath = path.resolve("src", existingBooking.delivery.proofImage);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      updateData.delivery.proofImage = path.join("upload", "deliveryProof", req.file.filename);
    }

    if (updateData.charges || updateData.vehiclePayment) {
      const updatedCharges = { ...existingBooking.charges.toObject(), ...updateData.charges };
      const updatedVehiclePayment = { ...existingBooking.vehiclePayment.toObject(), ...updateData.vehiclePayment };
      
      const calculatedTotals = calculateBookingTotals(updatedCharges, updatedVehiclePayment);
      updateData.charges = { ...updatedCharges, ...calculatedTotals };

      const paymentStatuses = determinePaymentStatus(
        calculatedTotals.finalPendingAmount, 
        calculatedTotals.vehicleBalance,
        updatedCharges.advancePaid || 0,
        updatedVehiclePayment.vehicleAdvance || 0
      );
      updateData.paymentStatus = { ...existingBooking.paymentStatus.toObject(), ...updateData.paymentStatus, ...paymentStatuses };
    }

    const updatedBooking = await Booking.findByIdAndUpdate(bookingId, updateData, { new: true });
    
    res.status(200).json({
      success: true,
      message: "Booking updated successfully",
      booking: updatedBooking,
    });
  } catch (error) {
    console.error("Error updating booking:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update booking",
      error: { message: error.message },
    });
  }
};

// -------------------- DELETE BOOKING --------------------
export const deleteBooking = async (req, res) => {
  try {
    const bookingId = req.params.id;
    
    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      return res.status(400).json({ success: false, message: "Invalid booking ID format" });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    if (booking.delivery?.proofImage) {
      const imgPath = path.resolve("src", booking.delivery.proofImage);
      if (fs.existsSync(imgPath)) {
        try {
          fs.unlinkSync(imgPath);
        } catch (fileError) {
          console.warn("Could not delete proof image:", fileError.message);
        }
      }
    }

    await Booking.findByIdAndDelete(bookingId);
    
    res.status(200).json({
      success: true,
      message: "Booking deleted successfully",
      deletedId: bookingId
    });
  } catch (error) {
    console.error("Error deleting booking:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete booking",
      error: { message: error.message }
    });
  }
};

// -------------------- ADD PARTY PAYMENT (CORRECTED) --------------------
export const addPartyPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, mode, bankName, remarks } = req.body;
    const paymentAmount = parseFloat(amount);

    if (!paymentAmount || paymentAmount <= 0) {
      return res.status(400).json({ success: false, message: "Invalid payment amount provided." });
    }

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found." });
    }

    const newPayment = { amount: paymentAmount, mode, bankName, remarks, paymentDate: new Date() };
    booking.charges.paymentHistory.push(newPayment);

    // Update advance paid amount
    booking.charges.advancePaid = (booking.charges.advancePaid || 0) + paymentAmount;

    const charges = booking.charges;
    const dealAmount = parseFloat(charges.dealAmount) || parseFloat(charges.totalAmount) || 0;
    const advancePaid = parseFloat(charges.advancePaid) || parseFloat(charges.partyAdvance) || 0;

    // Calculate pending amount correctly - this should be dealAmount - advancePaid
    // NOT dealAmount - deductions - advancePaid
    const calculatedPendingAmount = dealAmount - advancePaid;

    booking.charges.finalPendingAmount = Math.max(0, calculatedPendingAmount);
    booking.charges.pendingAmount = Math.max(0, calculatedPendingAmount);

    // Determine payment status based on remaining pending amount
    if (booking.charges.finalPendingAmount <= 0) {
      booking.paymentStatus.partyPaymentStatus = "completed";
    } else {
      booking.paymentStatus.partyPaymentStatus = "pending";
    }

    await booking.save();
    res.status(200).json({ success: true, message: "Party payment added successfully.", booking });

  } catch (error) {
    console.error("Error adding party payment:", error);
    res.status(500).json({ success: false, message: "Server error while adding party payment.", error: error.message });
  }
};

// -------------------- ADD VEHICLE PAYMENT (CORRECTED) --------------------
export const addVehiclePayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, mode, bankName, remarks } = req.body;
    const paymentAmount = parseFloat(amount);

    if (!paymentAmount || paymentAmount <= 0) {
      return res.status(400).json({ success: false, message: "Invalid payment amount provided." });
    }

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found." });
    }

    const newPayment = { amount: paymentAmount, mode, bankName, remarks, paymentDate: new Date() };
    if (!booking.vehiclePayment.paymentHistory) {
      booking.vehiclePayment.paymentHistory = [];
    }
    booking.vehiclePayment.paymentHistory.push(newPayment);

    const totalAdvancePaid = (booking.vehiclePayment.vehicleAdvance || 0) + paymentAmount;
    booking.vehiclePayment.vehicleAdvance = totalAdvancePaid;

    const actualCost = booking.vehiclePayment.actualVehicleCost || 0;
    const newBalance = actualCost - totalAdvancePaid;
    booking.vehiclePayment.vehicleBalance = Math.max(0, newBalance);

    if (booking.vehiclePayment.vehicleBalance <= 0) {
      booking.paymentStatus.vehiclePaymentStatus = "completed";
    } else {
      booking.paymentStatus.vehiclePaymentStatus = "pending";
    }

    await booking.save();
    res.status(200).json({ success: true, message: "Vehicle payment added successfully.", booking });

  } catch (error) {
    console.error("Error adding vehicle payment:", error);
    res.status(500).json({ success: false, message: "Server error while adding vehicle payment.", error: error.message });
  }
};

// -------------------- UPDATE DELIVERY STATUS (NEW) --------------------
export const updateDeliveryStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, remarks } = req.body;

        if (!status) {
            return res.status(400).json({ success: false, message: "Delivery status is required." });
        }

        const booking = await Booking.findById(id);
        if (!booking) {
            return res.status(404).json({ success: false, message: "Booking not found." });
        }

        booking.delivery.status = status;
        if (remarks) {
            booking.delivery.remarks = remarks;
        }

        await booking.save();
        res.status(200).json({ success: true, message: "Delivery status updated successfully.", booking });

    } catch (error) {
        console.error("Error updating delivery status:", error);
        res.status(500).json({ success: false, message: "Server error while updating delivery status.", error: error.message });
    }
};

// -------------------- UPLOAD DELIVERY PROOF --------------------
export const uploadDeliveryProof = async (req, res) => {
  try {
    const bookingId = req.params.id;

    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking)
      return res.status(404).json({ success: false, message: "Booking not found" });

    if (booking.delivery.proofImage) {
      const oldPath = path.join("src", booking.delivery.proofImage);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    booking.delivery.proofImage = path.join("upload", "deliveryProof", req.file.filename);
    await booking.save();

    res.status(200).json({ success: true, message: "Proof image uploaded", booking });
  } catch (error) {
    console.error("Error uploading delivery proof:", error);
    res.status(500).json({ success: false, message: "Failed to upload delivery proof", error });
  }
};

// -------------------- MIGRATE BOOKINGS TO NEW STRUCTURE --------------------
export const migrateBookingsToNewStructure = async (req, res) => {
  try {
    const bookings = await Booking.find({});
    let migratedCount = 0;
    let errors = [];

    for (const booking of bookings) {
      try {
        if (booking.charges?.vehicleCostParty && !booking.charges?.dealAmount) {
          const migratedBooking = migrateBookingStructure(booking.toObject());
          
          const calculatedTotals = calculateBookingTotals(
            migratedBooking.charges,
            migratedBooking.vehiclePayment
          );
          
          migratedBooking.charges = { ...migratedBooking.charges, ...calculatedTotals };

          await Booking.findByIdAndUpdate(booking._id, migratedBooking);
          migratedCount++;
        }
      } catch (error) {
        errors.push({ bookingId: booking._id, bookingNo: booking.bookingNo, error: error.message });
      }
    }

    res.status(200).json({
      success: true,
      message: `Migration completed. ${migratedCount} bookings migrated.`,
      migratedCount,
      totalBookings: bookings.length,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error("Error migrating bookings:", error);
    res.status(500).json({ success: false, message: "Failed to migrate bookings", error: error.message });
  }
};