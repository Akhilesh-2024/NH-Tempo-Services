import mongoose from "mongoose";

const adminSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, default: "Admin" },
  profileImage: { type: String, default: "" },  // Profile image URL
  gstNumber: { type: String, default: "" },
  description: { type: String, default: "" },
  role: { type: String, default: "admin" },
},
{ timestamps: true }
);

export const Admin = mongoose.model("Admin", adminSchema);
