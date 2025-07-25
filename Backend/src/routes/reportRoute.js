import express from "express";
import {
  getLedgerReport,
  getVehicleReport,
} from "../controllers/reportController.js";

const reportRouter = express.Router();

// Ledger report route
reportRouter.get("/ledger", getLedgerReport);

// Vehicle report route
reportRouter.get("/vehicle", getVehicleReport);

export default reportRouter;