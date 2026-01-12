import mongoose, { Schema } from "mongoose";

const monthlyReportSchema = new Schema({
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Company",
    required: true,
  },
  year: { type: Number, required: true }, // Date of entry
  month: { type: Number, required: true }, // Date of entry
  expense: { type: Number, required: true },
  profit: { type: Number, required: true }, // Profit amount
  vat: { type: Number, required: true }, // Profit amount
  discount: { type: Number, required: true }, // Profit amount
});

const MonthlyReport = mongoose.model("monthlyReport", monthlyReportSchema);

export default MonthlyReport;
