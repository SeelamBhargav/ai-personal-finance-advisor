import { Request, Response, NextFunction } from "express";

export interface CustomError extends Error {
  statusCode?: number;
  details?: any;
}

export const errorHandler = (
  err: CustomError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  // Log error stack in development, otherwise just log message
  if (process.env.NODE_ENV === "development") {
    console.error(`💥 Error [${req.method} ${req.path}]:`, err);
  } else {
    console.error(`💥 Error [${req.method} ${req.path}]: ${message}`);
  }

  res.status(statusCode).json({
    success: false,
    message,
    details: err.details || null,
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
};
