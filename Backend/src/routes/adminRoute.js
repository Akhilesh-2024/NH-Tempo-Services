import express from "express";
import { login, verify, getProfile, updateProfile } from "../controllers/adminController.js";
import { auth } from "../middleware/auth.js";
import { getMulterUploader } from "../config/multer.js"; // your multer file

const adminRouter = express.Router();

// Multer uploader for admin profile photos
const upload = getMulterUploader("admin"); // files will be stored in src/upload/admin

// Auth routes
adminRouter.post("/login", login);
adminRouter.get("/verify", auth, verify);

// Profile routes
adminRouter.get("/profile", auth, getProfile);
adminRouter.put("/profile", auth, upload.single("profileImage"), updateProfile);


export default adminRouter;
