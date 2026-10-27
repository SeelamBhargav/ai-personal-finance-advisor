import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import env from "../config/env";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: "USER" | "ADMIN";
  };
}

export const authenticate = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith("Bearer ")
    ? authHeader.split(" ")[1]
    : req.cookies?.accessToken;

  if (!token) {
    res.status(401).json({ success: false, message: "Access denied. No token provided." });
    return;
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as {
      id: string;
      email: string;
      role: "USER" | "ADMIN";
    };
    req.user = decoded;
    next();
  } catch (err) {
    res.status(403).json({ success: false, message: "Invalid or expired token." });
  }
};

export const authorize = (roles: ("USER" | "ADMIN")[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ success: false, message: "Forbidden. Access denied." });
      return;
    }
    next();
  };
};
