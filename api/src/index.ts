import app from "./app";
import env from "./config/env";

const server = app.listen(env.PORT, () => {
  console.log(`🚀 FinanceAI Backend Server is running on port ${env.PORT}`);
});

// Global rejection tracking
process.on("unhandledRejection", (err: any) => {
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
