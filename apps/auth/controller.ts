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
      },
      JWT_SECRET,
      { expiresIn: "7d" }
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

export const getAllCompanies = async (req: Request, res: Response) => {
  try {
    const companies = await Company.find();
    res.status(200).json({ data: companies, message: "Companies fetched successfully" });
  } catch (err) {
    res.status(500).json({ message: "Internal server error", error: err });
  }
};
