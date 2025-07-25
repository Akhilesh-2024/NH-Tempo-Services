import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import { Admin } from "../models/adminModel.js";

dotenv.config();

const updateAdminSchema = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL);

    // Check if admin with username from .env exists
    const existingAdmin = await Admin.findOne({ username: process.env.ADMIN });

    if (existingAdmin) {
      console.log("Existing admin found. Updating password...");

      if (process.env.PASSWORD) {
        existingAdmin.password = await bcrypt.hash(process.env.PASSWORD, 10);
        await existingAdmin.save();
        console.log("Admin password updated.");
      } else {
        console.log("No PASSWORD provided in .env, skipping password update.");
      }
    } else {
      console.log("No admin found. Creating a new one...");

      const hashedPassword = await bcrypt.hash(process.env.PASSWORD, 10);
      const newAdmin = new Admin({
        username: process.env.ADMIN,
        password: hashedPassword,
        role: "admin",
      });

      await newAdmin.save();
      console.log("Admin created successfully.");
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error("Error:", error);
    await mongoose.disconnect();
  }
};

updateAdminSchema();