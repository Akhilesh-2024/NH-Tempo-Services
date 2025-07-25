import mongoose from "mongoose";

const masterSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      unique: true,
    },
  },
  { timestamps: true }
);

const Master = mongoose.model("Master", masterSchema);
export default Master;
