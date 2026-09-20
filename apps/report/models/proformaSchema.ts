import mongoose, { Schema } from "mongoose";

const itemSchema = new Schema({
  id: { type: Number },
  description: { type: mongoose.Schema.Types.ObjectId, ref: "Service" },
  rate: { type: Number },
  quantity: { type: Number },
  tax: { type: Number },
  serviceCharge: { type: Number },
  total: { type: Number },
  vat: { type: Boolean },
});

const proformaSchema = new Schema(
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
    // proformaSeq is the running number within a company; proformaNo is its display form (PF-0001)
    proformaSeq: { type: Number, required: true },
    proformaNo: { type: String, required: true },
    name: { type: String, required: true },
    date: { type: Date, required: true },
    trn: { type: Number },
    contact: { type: Number },
    address: { type: String },
    items: { type: [itemSchema] },
    subTotal: { type: Number },
    grandTotal: { type: Number },
    totalVat: { type: Number },
    vatPaidByCompany: { type: Boolean },
    profit: { type: Number },
    discount: { type: Number, default: 0 },
    // a proforma is never counted in reports; converting it creates the real invoice
    status: { type: String, enum: ["open", "converted"], default: "open" },
    convertedInvoiceId: { type: mongoose.Schema.Types.ObjectId, ref: "Invoice" },
  },
  { timestamps: true },
);

// numbers only need to be unique within one company
proformaSchema.index({ companyId: 1, proformaNo: 1 }, { unique: true });

const Proforma = mongoose.model("Proforma", proformaSchema);

export default Proforma;
