import mongoose, { Schema } from "mongoose";

const ItemSchema = new Schema({
  description: { type: String, required: true },
  qty: { type: Number, required: true, default: 1 },
  price: { type: Number, required: true, default: 0 },
  amount: { type: Number },
});

const QuotationSchema = new Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },
    company: {
      name: { type: String, required: true },
      address: { type: String },
      phone: { type: String },
      email: { type: String },
    },
    client: { type: String, required: true },
    // quoteSeq is the running number within a company; quoteNo is its display form (QT-0001)
    quoteSeq: { type: Number, required: true },
    quoteNo: { type: String, required: true },
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

// numbers only need to be unique within one company
QuotationSchema.index({ companyId: 1, quoteNo: 1 }, { unique: true });

const QuotationReport = mongoose.model("Quotation", QuotationSchema);

export default QuotationReport;
