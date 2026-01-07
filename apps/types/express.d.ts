import { JwtUserPayload } from "../types/jwt"; // adjust relative path

declare global {
  namespace Express {
    interface Request {
      user?: JwtUserPayload; // extend Request
    }
  }
}

export {};
