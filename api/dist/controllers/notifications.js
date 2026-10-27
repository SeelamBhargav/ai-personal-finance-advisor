"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteNotification = exports.markAllNotificationsRead = exports.markNotificationRead = exports.getNotifications = void 0;
const database_1 = require("@finance-ai/database");
const getNotifications = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ success: false, message: "Unauthorized" });
            return;
        }
        const notifications = await database_1.db.notification.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
        });
        res.status(200).json({
            success: true,
            data: notifications,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getNotifications = getNotifications;
const markNotificationRead = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ success: false, message: "Unauthorized" });
            return;
        }
        const { id } = req.params;
        const notification = await database_1.db.notification.findFirst({
            where: { id, userId },
        });
        if (!notification) {
            res.status(404).json({ success: false, message: "Notification not found" });
            return;
        }
        const updatedNotification = await database_1.db.notification.update({
            where: { id },
            data: { isRead: true },
        });
        res.status(200).json({
            success: true,
            data: updatedNotification,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.markNotificationRead = markNotificationRead;
const markAllNotificationsRead = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ success: false, message: "Unauthorized" });
            return;
        }
        await database_1.db.notification.updateMany({
            where: { userId, isRead: false },
            data: { isRead: true },
        });
        res.status(200).json({
            success: true,
            message: "All notifications marked as read",
        });
    }
    catch (error) {
        next(error);
    }
};
exports.markAllNotificationsRead = markAllNotificationsRead;
const deleteNotification = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ success: false, message: "Unauthorized" });
            return;
        }
        const { id } = req.params;
        const notification = await database_1.db.notification.findFirst({
            where: { id, userId },
        });
        if (!notification) {
            res.status(404).json({ success: false, message: "Notification not found" });
            return;
        }
        await database_1.db.notification.delete({
            where: { id },
        });
        res.status(200).json({
            success: true,
            message: "Notification deleted successfully",
        });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteNotification = deleteNotification;
