import express from "express";
import {
  getVehicles,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  deleteMultipleVehicles,
} from "../controllers/vehicleController.js";

const vehicleRouter = express.Router();

vehicleRouter.get("/", getVehicles);
vehicleRouter.post("/", createVehicle);
vehicleRouter.put("/:id", updateVehicle);
vehicleRouter.delete("/:id", deleteVehicle);

// Bulk delete route
vehicleRouter.post("/delete-multiple", deleteMultipleVehicles);

export default vehicleRouter;
