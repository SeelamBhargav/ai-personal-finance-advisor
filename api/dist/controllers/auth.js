"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMe = exports.passwordReset = exports.passwordResetRequest = exports.verifyEmail = exports.refresh = exports.logout = exports.login = exports.register = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const database_1 = require("@finance-ai/database");
const types_1 = require("@finance-ai/types");
const env_1 = __importDefault(require("../config/env"));
const ACCESS_TOKEN_EXPIRY = "15m";
const REFRESH_TOKEN_EXPIRY = "7d";
// Helper to generate access & refresh tokens
const generateTokens = (user) => {
    const accessToken = jsonwebtoken_1.default.sign({ id: user.id, email: user.email, role: user.role }, env_1.default.JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
    const refreshToken = jsonwebtoken_1.default.sign({ id: user.id, email: user.email, role: user.role }, env_1.default.JWT_REFRESH_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRY });
    return { accessToken, refreshToken };
};
// Set secure cookie options
const getCookieOptions = (maxAgeMs) => ({
    httpOnly: true,
    secure: env_1.default.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: maxAgeMs,
});
const register = async (req, res, next) => {
    try {
        const validated = types_1.RegisterInputSchema.parse(req.body);
        const existingUser = await database_1.db.user.findUnique({
            where: { email: validated.email },
        });
        if (existingUser) {
            res.status(400).json({ success: false, message: "User with this email already exists" });
            return;
        }
        const passwordHash = await bcryptjs_1.default.hash(validated.password, 12);
        const verificationToken = jsonwebtoken_1.default.sign({ email: validated.email }, env_1.default.JWT_SECRET, { expiresIn: "1d" });
        const newUser = await database_1.db.user.create({
            data: {
                email: validated.email,
                passwordHash,
                firstName: validated.firstName,
                lastName: validated.lastName,
                verificationToken,
            },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                isVerified: true,
                createdAt: true,
            },
        });
        // Write audit log
        await database_1.db.auditLog.create({
            data: {
                userId: newUser.id,
                action: "USER_REGISTERED",
                details: `User registered with email: ${newUser.email}`,
            },
        });
        // In a real application, send verification email.
        // For local development, we return the token in the response so developers/testers can easily activate the user.
        res.status(201).json({
            success: true,
            message: "Registration successful. Please verify your email.",
            data: {
                user: newUser,
                // Provided for testing ease
                verificationToken,
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.register = register;
const login = async (req, res, next) => {
    try {
        const validated = types_1.LoginInputSchema.parse(req.body);
        const user = await database_1.db.user.findUnique({
            where: { email: validated.email },
        });
        if (!user) {
            res.status(401).json({ success: false, message: "Invalid email or password" });
            return;
        }
        const isPasswordValid = await bcryptjs_1.default.compare(validated.password, user.passwordHash);
        if (!isPasswordValid) {
            res.status(401).json({ success: false, message: "Invalid email or password" });
            return;
        }
        // Generate credentials tokens
        const { accessToken, refreshToken } = generateTokens(user);
        // Save tokens in cookies
        res.cookie("accessToken", accessToken, getCookieOptions(15 * 60 * 1000)); // 15 min
        res.cookie("refreshToken", refreshToken, getCookieOptions(7 * 24 * 60 * 60 * 1000)); // 7 days
        // Audit login
        await database_1.db.auditLog.create({
            data: {
                userId: user.id,
                action: "USER_LOGGED_IN",
                details: `Successful login for: ${user.email}`,
            },
        });
        res.status(200).json({
            success: true,
            message: "Login successful",
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    role: user.role,
                    isVerified: user.isVerified,
                },
                accessToken,
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.login = login;
const logout = async (req, res, next) => {
    try {
        // Clear cookies
        res.clearCookie("accessToken");
        res.clearCookie("refreshToken");
        res.status(200).json({
            success: true,
            message: "Logout successful",
        });
    }
    catch (error) {
        next(error);
    }
};
exports.logout = logout;
const refresh = async (req, res, next) => {
    try {
        const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;
        if (!refreshToken) {
            res.status(401).json({ success: false, message: "Refresh token is missing" });
            return;
        }
        const decoded = jsonwebtoken_1.default.verify(refreshToken, env_1.default.JWT_REFRESH_SECRET);
        const user = await database_1.db.user.findUnique({
            where: { id: decoded.id },
        });
        if (!user) {
            res.status(401).json({ success: false, message: "User not found" });
            return;
        }
        const tokens = generateTokens(user);
        // Update cookies
        res.cookie("accessToken", tokens.accessToken, getCookieOptions(15 * 60 * 1000));
        res.cookie("refreshToken", tokens.refreshToken, getCookieOptions(7 * 24 * 60 * 60 * 1000));
        res.status(200).json({
            success: true,
            data: {
                accessToken: tokens.accessToken,
            },
        });
    }
    catch (error) {
        res.status(403).json({ success: false, message: "Invalid or expired refresh token" });
    }
};
exports.refresh = refresh;
const verifyEmail = async (req, res, next) => {
    try {
        const { token } = req.query;
        if (!token || typeof token !== "string") {
            res.status(400).json({ success: false, message: "Verification token is required" });
            return;
        }
        let decodedEmail;
        try {
            const decoded = jsonwebtoken_1.default.verify(token, env_1.default.JWT_SECRET);
            decodedEmail = decoded.email;
        }
        catch (err) {
            res.status(400).json({ success: false, message: "Invalid or expired verification token" });
            return;
        }
        const user = await database_1.db.user.findUnique({
            where: { email: decodedEmail },
        });
        if (!user) {
            res.status(404).json({ success: false, message: "User not found" });
            return;
        }
        if (user.isVerified) {
            res.status(200).json({ success: true, message: "Email is already verified" });
            return;
        }
        await database_1.db.user.update({
            where: { id: user.id },
            data: {
                isVerified: true,
                verificationToken: null,
            },
        });
        await database_1.db.auditLog.create({
            data: {
                userId: user.id,
                action: "EMAIL_VERIFIED",
                details: `Verified email: ${user.email}`,
            },
        });
        res.status(200).json({
            success: true,
            message: "Email successfully verified",
        });
    }
    catch (error) {
        next(error);
    }
};
exports.verifyEmail = verifyEmail;
const passwordResetRequest = async (req, res, next) => {
    try {
        const validated = types_1.PasswordResetRequestInputSchema.parse(req.body);
        const user = await database_1.db.user.findUnique({
            where: { email: validated.email },
        });
        if (!user) {
            // Return success even if user not found to prevent user enumeration attacks
            res.status(200).json({
                success: true,
                message: "If that email is registered, we have sent a password reset token.",
            });
            return;
        }
        const resetToken = jsonwebtoken_1.default.sign({ userId: user.id }, env_1.default.JWT_SECRET, { expiresIn: "1h" });
        const resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now
        await database_1.db.user.update({
            where: { id: user.id },
            data: {
                resetToken,
                resetTokenExpires,
            },
        });
        await database_1.db.auditLog.create({
            data: {
                userId: user.id,
                action: "PASSWORD_RESET_REQUESTED",
                details: `Password reset requested for: ${user.email}`,
            },
        });
        // In production, email resetToken to user.
        // Return token in dev mode for testing.
        res.status(200).json({
            success: true,
            message: "Password reset token generated.",
            data: {
                resetToken,
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.passwordResetRequest = passwordResetRequest;
const passwordReset = async (req, res, next) => {
    try {
        const validated = types_1.PasswordResetInputSchema.parse(req.body);
        let decodedUserId;
        try {
            const decoded = jsonwebtoken_1.default.verify(validated.token, env_1.default.JWT_SECRET);
            decodedUserId = decoded.userId;
        }
        catch (err) {
            res.status(400).json({ success: false, message: "Invalid or expired reset token" });
            return;
        }
        const user = await database_1.db.user.findFirst({
            where: {
                id: decodedUserId,
                resetToken: validated.token,
                resetTokenExpires: {
                    gt: new Date(),
                },
            },
        });
        if (!user) {
            res.status(400).json({ success: false, message: "Invalid reset token or token expired" });
            return;
        }
        const passwordHash = await bcryptjs_1.default.hash(validated.password, 12);
        await database_1.db.user.update({
            where: { id: user.id },
            data: {
                passwordHash,
                resetToken: null,
                resetTokenExpires: null,
            },
        });
        await database_1.db.auditLog.create({
            data: {
                userId: user.id,
                action: "PASSWORD_RESET_SUCCESSFUL",
                details: `Password reset successfully completed for user: ${user.email}`,
            },
        });
        res.status(200).json({
            success: true,
            message: "Password has been reset successfully. You can now log in.",
        });
    }
    catch (error) {
        next(error);
    }
};
exports.passwordReset = passwordReset;
const getMe = async (req, res, next) => {
    try {
        const authReq = req;
        if (!authReq.user) {
            res.status(401).json({ success: false, message: "Not authenticated" });
            return;
        }
        const user = await database_1.db.user.findUnique({
            where: { id: authReq.user.id },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                isVerified: true,
                createdAt: true,
            },
        });
        if (!user) {
            res.status(404).json({ success: false, message: "User not found" });
            return;
        }
        res.status(200).json({
            success: true,
            data: { user },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getMe = getMe;
