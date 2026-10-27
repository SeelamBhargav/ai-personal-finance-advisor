"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const env_1 = __importDefault(require("./config/env"));
const server = app_1.default.listen(env_1.default.PORT, () => {
    console.log(`🚀 FinanceAI Backend Server is running on port ${env_1.default.PORT}`);
});
// Global rejection tracking
process.on("unhandledRejection", (err) => {
    console.error("💥 Unhandled Promise Rejection:", err);
    server.close(() => process.exit(1));
});
// Graceful SIGTERM closure
process.on("SIGTERM", () => {
    console.log("👋 SIGTERM received. Shutting down gracefully...");
    server.close(() => {
        console.log("💤 Server closed.");
        process.exit(0);
    });
});
