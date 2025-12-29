import mongoose, { Schema } from "mongoose";

const CompanySchema = new Schema({
  companyName: { type: String, required: true },
  businessType: { type: String, required: true },
  purchaseDate: { type: String },
  phoneNumber: { type: Number },
  address: { type: Object },
  expiryDate: { type: String },
  isActive: { type: Boolean, default: true },
  createdAt: { type: String },
  updatedAt: { type: String },
});

const Company = mongoose.model("Company", CompanySchema);
export default Company;
