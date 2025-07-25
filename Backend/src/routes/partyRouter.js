import express from "express";
import {
  getParties,
  createParty,
  updateParty,
  deleteParty,
  deleteMultipleParties,
} from "../controllers/partyController.js";

const partyRouter = express.Router();

partyRouter.get("/", getParties);
partyRouter.post("/", createParty);
partyRouter.put("/:id", updateParty);
partyRouter.delete("/:id", deleteParty);

// New bulk delete route
partyRouter.post("/delete-multiple", deleteMultipleParties);

export default partyRouter;
