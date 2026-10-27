import { Request, Response, NextFunction } from "express";
import { db } from "@finance-ai/database";
import { AuthenticatedRequest } from "../middlewares/auth";

export const getNotifications = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as AuthenticatedRequest).user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const notifications = await db.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    res.status(200).json({
      success: true,
      data: notifications,
    });
  } catch (error) {
    next(error);
  }
};

export const markNotificationRead = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as AuthenticatedRequest).user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const { id } = req.params;

    const notification = await db.notification.findFirst({
      where: { id, userId },
    });

    if (!notification) {
      res.status(404).json({ success: false, message: "Notification not found" });
      return;
    }

    const updatedNotification = await db.notification.update({
      where: { id },
      data: { isRead: true },
    });

    res.status(200).json({
      success: true,
      data: updatedNotification,
    });
  } catch (error) {
    next(error);
  }
};

export const markAllNotificationsRead = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as AuthenticatedRequest).user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    await db.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });

    res.status(200).json({
      success: true,
      message: "All notifications marked as read",
    });
  } catch (error) {
    next(error);
  }
};

export const deleteNotification = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as AuthenticatedRequest).user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const { id } = req.params;

    const notification = await db.notification.findFirst({
      where: { id, userId },
    });

    if (!notification) {
      res.status(404).json({ success: false, message: "Notification not found" });
      return;
    }

    await db.notification.delete({
      where: { id },
    });

    res.status(200).json({
      success: true,
      message: "Notification deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
