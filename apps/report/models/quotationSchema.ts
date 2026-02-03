import mongoose, { Schema } from "mongoose";

const ItemSchema = new Schema({
  description: { type: String, required: true },
  qty: { type: Number, required: true, default: 1 },
  price: { type: Number, required: true, default: 0 },
  amount: { type: Number },
});

const QuotationSchema = new Schema(
  {
    company: {
      name: { type: String, required: true },
      address: { type: String },
      phone: { type: String },
      email: { type: String },
    },
    client: { type: String, required: true },
    quoteNo: { type: String, required: true, unique: true },
    date: { type: Date, required: true },
    items: [ItemSchema],
    subtotal: { type: Number, default: 0 },
    vatPercent: { type: Number, default: 5 },
    vatAmount: { type: Number, default: 0 },
    total: { type: Number, default: 0 },

    terms: [{ type: String }],

    notes: { type: String },
  },
  {
    timestamps: true,
  },
);

const QuotationReport = mongoose.model("Quotation", QuotationSchema);

export default QuotationReport;
