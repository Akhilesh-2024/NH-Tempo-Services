import mongoose from "mongoose";

const vehicleSchema = new mongoose.Schema(
  {
    vehicleNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    ownerName: {
      type: String,
      required: true,
      trim: true,
    },
    contactNumber: {
      type: String,
      required: true,
      trim: true,
    },
    address: {
      type: String,
      required: true,
    },
    vehicleType: {
      type: String,
      required: true,
    },
    ownership: {
      type: String,
      required: true,
      enum: ["Owner", "Vendor"], // Distinguish between owner or vendor
    },
  },
  { timestamps: true }
);

export default mongoose.model("Vehicle", vehicleSchema);
