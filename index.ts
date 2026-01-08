// Import required modules
import express, { Express } from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import reportRouter from "./apps/report/route";
import { MongoClient, ServerApiVersion } from "mongodb";
import authRouter from "./apps/auth/route";


dotenv.config();
const app: Express = express();

const mongoUri = process.env.MONGODB_CONNECTION;

if (!mongoUri) {
  throw new Error("MongoDB connection URI is missing from the environment variables");
}

const connectDB = async () => {
  try {
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB successfully");
  } catch (err) {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  }
};

connectDB();

app.use(cors());
app.use(express.json());

app.use("/api/reports", reportRouter);
app.use("/api/auth", authRouter);

const PORT = process.env.PORT || 8081;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

const mongoClient = new MongoClient(mongoUri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

const testMongoDBConnection = async () => {
  try {
    await mongoClient.connect();
    await mongoClient.db("alwahda2025").command({ ping: 1 });
    console.log("Pinged your deployment. Successfully connected to MongoDB!");
  } catch (err) {
    console.error("MongoDB ping test failed:", err);
  } finally {
    await mongoClient.close();
  }
};

testMongoDBConnection().catch(console.error);
