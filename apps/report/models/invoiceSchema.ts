import mongoose, { Schema, Document } from "mongoose";

const itemSchema = new Schema({
  id: {
    type: Number,
  },
  description: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Service",
  },
  rate: {
    type: Number,
  },
  quantity: {
    type: Number,
  },
  tax: {
    type: Number,
  },
  serviceCharge: {
    type: Number,
  },

  total: {
    type: Number,
  },
  vat: {
    type: Boolean,
  },
});

// Define the invoice schema
const invoiceSchema = new Schema({
  name: {
    type: String,
  },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Company",
    // required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  invoice_number: {
    type: Number,
    required: true,
  },
  trn: {
    type: Number,
  },
  items: {
    type: [itemSchema],
  },
  subTotal: {
    type: Number,
  },
  grandTotal: {
    type: Number,
  },
  totalVat: {
    type: Number,
  },
  vatPaidByCompany: {
    type: Boolean,
  },
  profit: {
    type: Number,
  },
  discount: {
    type: Number,
    default: 0,
  },
  paid: {
    type: Boolean,
    default: false,
  },
  contact: {
    type: Number,
  },
  address: {
    type: String,
  },
});

const Invoice = mongoose.model("Invoice", invoiceSchema);

export default Invoice;
