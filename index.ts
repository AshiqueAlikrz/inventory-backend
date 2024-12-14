import express, { Express } from "express";
import mongoose from "mongoose";
import { router as Report } from "./apps/report/route";
import cors from "cors";

const app: Express = express();

// MongoDB Connection
const mongoUri = process.env.MONGO_URI || "your_mongo_uri_here";

const connectDB = async () => {
  try {
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB");
  } catch (err) {
    console.error("MongoDB connection error:", err);
  }
};

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
  console.log(`Server is running on port ${PORT}`);
});
