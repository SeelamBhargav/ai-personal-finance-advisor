import { Router } from "express";
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
} from "../controllers/notifications";
import { authenticate } from "../middlewares/auth";

const router = Router();

// Apply auth middleware to all notifications routes
router.use(authenticate);

router.get("/", getNotifications);
router.put("/mark-all-read", markAllNotificationsRead);
router.put("/:id/read", markNotificationRead);
router.delete("/:id", deleteNotification);

export default router;
