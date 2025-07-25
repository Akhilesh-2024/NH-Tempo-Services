import mongoose from "mongoose";

const partySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    contactNumber: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    city: {
      type: String,
      required: true,
      trim: true,
    },
    gstNo: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { timestamps: true }
);

const Party = mongoose.model("Party", partySchema);

export default Party;
