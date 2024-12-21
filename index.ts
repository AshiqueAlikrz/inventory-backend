// Import required modules
import express, { Express } from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import { router as Report } from "./apps/report/route";

// Initialize dotenv to access environment variables
dotenv.config();

// Initialize Express app
const app: Express = express();

// MongoDB Connection URI from .env file
const mongoUri = process.env.MONGODB_CONNECTION;

// Check if MongoDB URI exists
if (!mongoUri) {
  throw new Error("MongoDB connection URI is missing from the environment variables");
}

// MongoDB Connection Function
const connectDB = async () => {
  try {
    // Use Mongoose to connect to MongoDB
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB successfully");
  } catch (err) {
    console.error("MongoDB connection error:", err);
    process.exit(1); // Exit process if connection fails
  }
};

// Connect to MongoDB
connectDB();

// Middleware setup
app.use(cors()); // Enable Cross-Origin Resource Sharing
app.use(express.json()); // Parse incoming JSON requests

// Routes
app.get("/", (req, res) => {
  res.send("Hello!");
});

app.use("/api/reports", Report);

// Start the server
const PORT = process.env.PORT || 8081;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

// Optional: Standalone MongoDB Ping Test
import { MongoClient, ServerApiVersion } from "mongodb";

const mongoClient = new MongoClient(mongoUri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

const testMongoDBConnection = async () => {
  try {
    // Connect the client to the MongoDB server
    await mongoClient.connect();
    // Ping the database to test the connection
    await mongoClient.db("alwahda2025").command({ ping: 1 });
    console.log("Pinged your deployment. Successfully connected to MongoDB!");
  } catch (err) {
    console.error("MongoDB ping test failed:", err);
  } finally {
    // Ensure client closes properly
    await mongoClient.close();
  }
};

// Run the MongoDB ping test
testMongoDBConnection().catch(console.error);
