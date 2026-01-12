import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

// Extend request to include userId and companyId
export interface AuthRequest extends Request {
  userId?: string;
  companyId?: string;
}

// Define the expected JWT payload
interface JwtPayload {
  userId: string;
  companyId: string;
  role?: string; // optional if you store role in JWT
}

/** 
 * Middleware to authenticate a JWT token from the request headers.
 *
 * Adds `userId` and `companyId` to `req` if token is valid.
 */
export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Authentication token required" });
  }

  try {
    // Decode token
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;

    // Attach userId and companyId to request
    req.userId = decoded.userId;
    req.companyId = decoded.companyId;

    next();
  } catch (error) {
    console.error("JWT Error:", error);
    return res.status(403).json({ message: "Invalid or expired token" });
  }
};
