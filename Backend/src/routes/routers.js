import express from "express";
import adminRouter from "./adminRoute.js";
import masterRouter from "./masterRouter.js";
import partyRouter from "./partyRouter.js";
import vehicleRouter from "./vehicleRoute.js";
import bookingRouter from "./bookingRoute.js";
import reportRouter from "./reportRoute.js";

const router = express.Router();

router.use('/admin',adminRouter);
router.use('/master',masterRouter);
router.use('/parties',partyRouter);
router.use('/vehicles',vehicleRouter);
router.use('/bookings',bookingRouter);
router.use('/reports',reportRouter);

export default router;