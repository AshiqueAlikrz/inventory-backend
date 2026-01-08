import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

export interface AuthRequest extends Request {
  userId?: string;
  database?: mongoose.Connection;
}

interface JwtPayload {
  userId: string;
  database: string;
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Authentication token required" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;

    console.log("decoded:", decoded);
    if (!decoded.database) {
      return res.status(400).json({ message: "DB name missing in token" });
    }

    req.userId = decoded.userId;

    // ✅ Switch DB safely
    req.database = mongoose.connection.useDb("alwahda2025", {
      useCache: true,
    });

    next();
  } catch (error) {
    return res.status(403).json({ message: "Invalid or expired token" });
  }
};
