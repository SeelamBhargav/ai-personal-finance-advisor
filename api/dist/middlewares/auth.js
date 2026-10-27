"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorize = exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = __importDefault(require("../config/env"));
const authenticate = (req, res, next) => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith("Bearer ")
        ? authHeader.split(" ")[1]
        : req.cookies?.accessToken;
    if (!token) {
        res.status(401).json({ success: false, message: "Access denied. No token provided." });
        return;
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, env_1.default.JWT_SECRET);
        req.user = decoded;
        next();
    }
    catch (err) {
        res.status(403).json({ success: false, message: "Invalid or expired token." });
    }
};
exports.authenticate = authenticate;
const authorize = (roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            res.status(403).json({ success: false, message: "Forbidden. Access denied." });
            return;
        }
        next();
    };
};
exports.authorize = authorize;
