"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const auth_1 = __importDefault(require("./routes/auth"));
const dashboard_1 = __importDefault(require("./routes/dashboard"));
const accounts_1 = __importDefault(require("./routes/accounts"));
const reports_1 = __importDefault(require("./routes/reports"));
const notifications_1 = __importDefault(require("./routes/notifications"));
const error_1 = require("./middlewares/error");
const app = (0, express_1.default)();
// Standard security headers
app.use((0, helmet_1.default)());
// Cross Origin Resource Sharing configuration
app.use((0, cors_1.default)({
    origin: true, // Allow frontend dev server requests in development
    credentials: true,
}));
// Express parsers
app.use(express_1.default.json({ limit: "10mb" }));
app.use((0, cookie_parser_1.default)());
// Server health check route
app.get("/health", (req, res) => {
    res.status(200).json({
        status: "healthy",
        timestamp: new Date().toISOString(),
    });
});
// Mount sub-routers
app.use("/api/auth", auth_1.default);
app.use("/api/dashboard", dashboard_1.default);
app.use("/api/accounts", accounts_1.default);
app.use("/api/reports", reports_1.default);
app.use("/api/notifications", notifications_1.default);
// Catch-all 404 route
app.use((req, res) => {
    res.status(404).json({ success: false, message: "API Route not found" });
});
// Connect global error middleware
app.use(error_1.errorHandler);
exports.default = app;
