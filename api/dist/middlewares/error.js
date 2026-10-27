"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const errorHandler = (err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    // Log error stack in development, otherwise just log message
    if (process.env.NODE_ENV === "development") {
        console.error(`💥 Error [${req.method} ${req.path}]:`, err);
    }
    else {
        console.error(`💥 Error [${req.method} ${req.path}]: ${message}`);
    }
    res.status(statusCode).json({
        success: false,
        message,
        details: err.details || null,
        stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
};
exports.errorHandler = errorHandler;
