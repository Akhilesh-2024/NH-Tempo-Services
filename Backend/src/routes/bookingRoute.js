import express from "express";
import {
  createBooking,
  getBookings,
  getBookingById,
  updateBooking,
  deleteBooking,
  getLastBookingNo,
  addPartyPayment,
  addVehiclePayment,
  updateDeliveryStatus,
  uploadDeliveryProof,
  migrateBookingsToNewStructure,
} from "../controllers/bookingController.js";

import { getMulterUploader } from "../config/multer.js";

const bookingRouter = express.Router();

// Configure multer uploader for delivery proof images
const upload = getMulterUploader("deliveryProof"); // Files stored in src/upload/deliveryProof

// --- Core Booking CRUD Routes ---
bookingRouter.post("/", upload.single("proofImage"), createBooking);
bookingRouter.get("/", getBookings);
bookingRouter.get("/last", getLastBookingNo);
bookingRouter.get("/:id", getBookingById);
bookingRouter.put("/:id", upload.single("proofImage"), updateBooking);
bookingRouter.delete("/:id", deleteBooking);

// --- New Payment and Status Update Routes ---
bookingRouter.post("/:id/party-payment", addPartyPayment);
bookingRouter.post("/:id/vehicle-payment", addVehiclePayment);
bookingRouter.put("/:id/delivery-status", updateDeliveryStatus);

// --- Utility Routes ---
bookingRouter.post("/:id/proof", upload.single("proofImage"), uploadDeliveryProof);
bookingRouter.post("/migrate", migrateBookingsToNewStructure);

export default bookingRouter;