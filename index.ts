import express, { Express } from "express";
import mongoose from "mongoose";
import { router as Report } from "./apps/report/route";
import cors from "cors";
import dotenv from "dotenv";

// Initialize Express app
const app: Express = express();
dotenv.config();

// MongoDB Connection URI from .env file
const mongoUri = process.env.MONGODB_CONNECTION;

// MongoDB Connection Function
const connectDB = async () => {
  try {
    await mongoose.connect(mongoUri as string);
    console.log("Connected to MongoDB successfully");
  } catch (err) {
    console.error("MongoDB connection error:", err);
    process.exit(1); // Exit the process if MongoDB connection fails
  }
};

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get("/", (req, res) => {
  res.send("Hello, working!");
});

app.use("/api/reports", Report);

// Start the server
const PORT = process.env.PORT || 8081;
app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}...`);
});
