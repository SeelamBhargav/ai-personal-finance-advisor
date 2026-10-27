"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const notifications_1 = require("../controllers/notifications");
const auth_1 = require("../middlewares/auth");
const router = (0, express_1.Router)();
// Apply auth middleware to all notifications routes
router.use(auth_1.authenticate);
router.get("/", notifications_1.getNotifications);
router.put("/mark-all-read", notifications_1.markAllNotificationsRead);
router.put("/:id/read", notifications_1.markNotificationRead);
router.delete("/:id", notifications_1.deleteNotification);
exports.default = router;
