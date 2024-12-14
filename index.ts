import express, { Express, Request, Response } from "express";
import mongoose from "mongoose";
import { router as Report } from "./apps/report/route";
import cors from "cors";
import Invoice from "./apps/report/models/invoiceSchema";
// import Invoice from "./models/Invoice"; // Ensure you have this model

// Initialize Express app
const app: Express = express();

// MongoDB Connection URI
const mongoUri = "mongodb+srv://alwahdainventory:WKssz08YogiTf7n2@cluster0.y2rdr.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
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

// Corrected /api/data route
app.get("/api/data", async (req: Request, res: Response) => {
  try {
    const invoices = await Invoice.find(); // Fetching invoices from the database
    res.status(200).json({ message: "Invoices fetched successfully", data: invoices });
  } catch (err) {
    res.status(500).json({ message: " Error fetching invoices", error: err });
  }
});

app.get("/", (req, res) => {
  res.send("Hello, working!");
});

app.use("/api/reports", Report);

// Start the server
const PORT = process.env.PORT || 8081;
app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}...`);
});
