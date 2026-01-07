// Import required modules
import express, { Express } from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import reportRouter from "./apps/report/route";
import authRouter from "./apps/auth/route";

dotenv.config();
const app: Express = express();

const mongoUri = process.env.MONGODB_CONNECTION;

if (!mongoUri) {
  throw new Error("MongoDB connection URI is missing");
}

// ✅ ONE global connection
mongoose
  .connect(mongoUri)
  .then(() => {
    console.log("MongoDB connected (Multi-tenant ready)");
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });

app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRouter);
app.use("/api/reports", reportRouter);

const PORT = process.env.PORT || 8081;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
