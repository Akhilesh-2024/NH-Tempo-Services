import express from "express";
import {
  createMaster,
  getMasters,
  getMasterById,
  updateMaster,
  deleteMaster,
} from "../controllers/masterController.js";

const masterRouter = express.Router();

// CRUD Routes
masterRouter.post("/", createMaster);
masterRouter.get("/", getMasters);
masterRouter.get("/:id", getMasterById);
masterRouter.put("/:id", updateMaster);
masterRouter.delete("/:id", deleteMaster);

export default masterRouter;