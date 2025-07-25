import bcrypt from "bcrypt";
import { Admin } from "../models/adminModel.js"; // <-- Use capital 'A'
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET;

export const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: "Username and password are required" });
    }

    const existingAdmin = await Admin.findOne({ username }); // Use Admin
    if (!existingAdmin) {
      return res.status(401).json({ message: "Admin not found" });
    }

    const isMatch = await bcrypt.compare(password, existingAdmin.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const payload = {
      id: existingAdmin._id,
      username: existingAdmin.username,
      role: "admin"
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "1d" });

    return res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: existingAdmin._id,
        username: existingAdmin.username,
        role: "admin"
      }
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};
