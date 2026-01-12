import mongoose, { Schema } from "mongoose";

const dailyReportSchema = new Schema({
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Company",
    required: true,
  },
  date: { type: Date, required: true }, // Date of entry
  expense: { type: Number, required: true },
  profit: { type: Number, required: true }, // Profit amount
  vat: { type: Number, required: true }, // Profit amount
  discount: { type: Number, required: true }, // Profit amount
});

const dailyReport = mongoose.model("DailyReport", dailyReportSchema);

export default dailyReport;
