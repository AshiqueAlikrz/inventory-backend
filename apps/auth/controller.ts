import { Request, Response } from "express";
import User from "./models/userSchema";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import Company from "../report/models/companySchema";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET as string;

export const signUp = async (req: Request, res: Response) => {
  try {
    const { email, name, password, confirmPassword, companyId } = req.body;

    const emailCheck = await User.findOne({ email });
    if (emailCheck) {
      return res.status(409).json({ message: "User email already exists" });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Password and confirm password do not match" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const createUser = await User.create({
      email,
      name,
      password: hashedPassword,
      companyId,
    });

    await createUser.save();

    return res.status(201).json({
      message: "User created successfully",
    });
  } catch (error) {
    console.error("Signup Error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const signIn = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).populate("companyId");
    if (!user) {
      return res.status(404).json({ message: "User email does not exist" });
    }

    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      return res.status(401).json({ message: "Invalid password" });
    }

    // 3️⃣ Generate JWT
    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email,
        database: user.database,
        companyId: user.companyId._id,
      },
      JWT_SECRET,
      { expiresIn: "7d" },
    );

    // 4️⃣ Success response
    return res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        company: user.companyId,
        database: user.database,
      },
      status: true,
    });
  } catch (error) {
    console.error("SignIn Error:", error);
    return res.status(500).json({ message: "Internal server error", status: false });
  }
};

export const createCompany = async (req: Request, res: Response) => {
  try {
    const { companyName, businessType, phoneNumber, purchaseDate, expiryDate } = req.body;

    if (!companyName?.trim() || !businessType?.trim()) {
      return res.status(400).json({ message: "Company name and business type are required" });
    }

    const name = companyName.trim();
    const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const exists = await Company.findOne({ companyName: { $regex: `^${escapedName}$`, $options: "i" } });
    if (exists) {
      return res.status(409).json({ message: "Company already exists" });
    }

    // phoneNumber is stored as a Number, so drop formatting like "+", spaces and dashes
    const phoneDigits = String(phoneNumber ?? "").replace(/[\s\-()+.]/g, "");
    if (phoneDigits && !/^\d+$/.test(phoneDigits)) {
      return res.status(400).json({ message: "Phone number can only contain digits" });
    }

    const now = new Date().toISOString();
    const company = await Company.create({
      companyName: name,
      businessType: businessType.trim(),
      phoneNumber: phoneDigits ? Number(phoneDigits) : undefined,
      purchaseDate,
      expiryDate,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    return res.status(201).json({ message: "Company created successfully", data: company });
  } catch (err: any) {
    console.error("Create Company Error:", err);
    if (err?.name === "ValidationError") {
      return res.status(400).json({ message: err.message });
    }
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getAllCompanies = async (req: Request, res: Response) => {
  try {
    const companies = await Company.find();
    res.status(200).json({ data: companies, message: "Companies fetched successfully" });
  } catch (err) {
    res.status(500).json({ message: "Internal server error", error: err });
  }
};
