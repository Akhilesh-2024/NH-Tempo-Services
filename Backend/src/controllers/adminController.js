import { Admin } from "../models/adminModel.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import fs from "fs";
import path from "path";

// ---------------- LOGIN ----------------
export const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: "Username and password are required" });
    }

    const admin = await Admin.findOne({ username });
    if (!admin) return res.status(401).json({ message: "Admin not found" });

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { id: admin._id, username: admin.username, role: admin.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.status(200).json({
      message: "Login successful",
      token,
      user: { ...admin._doc, password: undefined },
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ---------------- VERIFY ----------------
export const verify = async (req, res) => {
  try {
    const admin = await Admin.findById(req.user.id).select("-password");
    if (!admin) return res.status(404).json({ message: "Admin not found" });

    res.status(200).json({ message: "Token is valid", user: admin });
  } catch (error) {
    console.error("Verify Token Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ---------------- GET PROFILE ----------------
export const getProfile = async (req, res) => {
  try {
    const admin = await Admin.findById(req.user.id).select("-password");
    if (!admin) return res.status(404).json({ message: "Admin not found" });
    res.status(200).json(admin);
  } catch (error) {
    console.error("Get Profile Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ---------------- UPDATE PROFILE ----------------
export const updateProfile = async (req, res) => {
  try {
    const { name, gstNumber, description, oldPassword, newPassword } = req.body;
    const admin = await Admin.findById(req.user.id);
    if (!admin) return res.status(404).json({ message: "Admin not found" });

    // Handle profile image upload
    if (req.file) {
      // Delete old image if exists
      if (admin.profileImage) {
  const oldFile = path.basename(admin.profileImage); // safer
  const oldFilePath = path.join(process.cwd(), "src", "upload", "admin", oldFile);

  if (fs.existsSync(oldFilePath)) {
    try {
      fs.unlinkSync(oldFilePath);
      console.log("Deleted old profile image:", oldFilePath);
    } catch (err) {
      console.error("Error deleting old profile image:", err);
    }
  }
}
      admin.profileImage = `/upload/admin/${req.file.filename}`;
    }

    // Handle password update
    if (oldPassword && newPassword) {
      const isMatch = await bcrypt.compare(oldPassword, admin.password);
      if (!isMatch) {
        return res.status(400).json({ message: "Old password is incorrect" });
      }
      admin.password = await bcrypt.hash(newPassword, 10);
    }

    // Update other fields
    if (name) admin.name = name;
    if (gstNumber) admin.gstNumber = gstNumber;
    if (description) admin.description = description;

    await admin.save();

    const updatedAdmin = { ...admin._doc, password: undefined };
    res.status(200).json({ message: "Profile updated", admin: updatedAdmin });
  } catch (error) {
    console.error("Update Profile Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
