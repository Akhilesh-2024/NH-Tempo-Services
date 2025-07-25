import express from "express";
import {
  getDashboardAnalytics,
  getOverduePayments,
  getRecentActivities
} from "../controllers/dashboardController.js";

const dashboardRouter = express.Router();

// Dashboard routes
dashboardRouter.get("/analytics", getDashboardAnalytics);
dashboardRouter.get("/overdue-payments", getOverduePayments);
dashboardRouter.get("/recent-activities", getRecentActivities);

export default dashboardRouter;