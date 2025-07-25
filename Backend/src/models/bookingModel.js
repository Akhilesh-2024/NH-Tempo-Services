import mongoose from "mongoose";

// A reusable schema for tracking individual payments
const paymentHistorySchema = new mongoose.Schema({
  amount: { type: Number, required: true },
  paymentDate: { type: Date, default: Date.now },
  mode: {
    type: String,
    enum: ["Cash", "Cheque", "Bank Transfer", "UPI"],
    required: true,
  },
  bankName: { type: String }, // For Cheque or Bank Transfer
  remarks: { type: String },
});

const bookingSchema = new mongoose.Schema(
  {
    bookingNo: { type: String, required: true, unique: true, default: "NH0001" },
    bookingDate: { type: Date, required: true },
    ourGstNo: { type: String },

    // Party Details
    party: {
      name: { type: String, required: true },
      address: { type: String },
      contact: { type: String },
      gstNo: { type: String },
    },

    // Vehicle Details
    vehicle: {
      vehicleNo: { type: String, required: true },
      ownerName: { type: String },
      ownerContact: { type:String },
      vehicleType: { type: String },
    },

    // Journey Details
    journey: {
      fromLocation: { type: String, required: true },
      toLocation: { type: String, required: true },
    },

    // Delivery Status
    delivery: {
      status: { type: String, enum: ["pending", "in-transit", "delivered", "received"], default: "pending" },
      remarks: { type: String },
      proofImage: { type: String }, // path or URL
    },

    // Party Charges
    charges: {
      dealAmount: { type: Number, default: 0 },
      advancePaid: { type: Number, default: 0 },
      pendingAmount: { type: Number, default: 0 },
      vehicleCharges: { type: Number, default: 0 },
      commission: { type: Number, default: 0 },
      localCharges: { type: Number, default: 0 },
      hamali: { type: Number, default: 0 },
      tds: { type: Number, default: 0 },
      stCharges: { type: Number, default: 0 },
      other: { type: Number, default: 0 },
      subTotal: { type: Number, default: 0 },
      finalPendingAmount: { type: Number, default: 0 },
      paymentHistory: [paymentHistorySchema],

      // Legacy fields for backward compatibility
      vehicleCostParty: { type: Number, default: 0 },
      otherCharges: { type: Number, default: 0 },
      totalAmount: { type: Number, default: 0 },
      partyAdvance: { type: Number, default: 0 },
      partyBalance: { type: Number, default: 0 },
    },

    // Vehicle Payments
    vehiclePayment: {
      actualVehicleCost: { type: Number, default: 0 },
      vehicleAdvance: { type: Number, default: 0 },
      vehicleBalance: { type: Number, default: 0 },
      paymentHistory: [paymentHistorySchema],
    },

    // Payment Status
    paymentStatus: {
      partyPaymentStatus: {
        type: String,
        enum: ["pending", "partial", "completed"],
        default: "pending",
      },
      vehiclePaymentStatus: {
        type: String,
        enum: ["pending", "partial", "completed"],
        default: "pending",
      },
    },
  },
  { timestamps: true }
);

export default mongoose.model("Booking", bookingSchema);