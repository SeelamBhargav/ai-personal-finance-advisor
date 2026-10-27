import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth";
import dashboardRoutes from "./routes/dashboard";
import accountsRoutes from "./routes/accounts";
import reportsRoutes from "./routes/reports";
import notificationsRoutes from "./routes/notifications";
import { errorHandler } from "./middlewares/error";

const app = express();

// Standard security headers
app.use(helmet());

// Cross Origin Resource Sharing configuration
app.use(
  cors({
    origin: true, // Allow frontend dev server requests in development
    credentials: true,
  })
);

// Express parsers
app.use(express.json({ limit: "10mb" }));
app.use(cookieParser());

// Server health check route
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
  });
});

// Mount sub-routers
app.use("/api/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/accounts", accountsRoutes);
app.use("/api/reports", reportsRoutes);
app.use("/api/notifications", notificationsRoutes);

// Catch-all 404 route
app.use((req, res) => {
  res.status(404).json({ success: false, message: "API Route not found" });
});

// Connect global error middleware
app.use(errorHandler);

export default app;
