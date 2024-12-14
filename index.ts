import express, { Express } from "express";
import mongoose from "mongoose";
import { router as Report } from "./apps/report/route";
import cors from "cors";

// Initialize Express app
const app: Express = express();

// MongoDB Connection URI
const mongoUri = "mongodb+srv://ashiquealikrz9:WKssz08YogiTf7n2@cluster0.y2rdr.mongodb.net/alwainvo?retryWrites=true&w=majority&appName=Cluster0";
// const mongoUri = "mongodb://localhost:27017/alwahdainventory";

// MongoDB Connection Function
const connectDB = async () => {
  try {
    // No need to specify useNewUrlParser or useUnifiedTopology in Mongoose 6+
    await mongoose.connect(mongoUri);
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
