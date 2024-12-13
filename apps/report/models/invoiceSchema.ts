import mongoose, { Schema, Document } from "mongoose";

// Define the schema for individual items in the invoice
const itemSchema = new Schema({
  id: {
    type: Number,
  },
  description: {
    type: String,
    ref: "Service",
  },
  rate: {
    type: Number,
  },
  quantity: {
    type: Number,
  },
  total: {
    type: Number,
  },
});

// Define the invoice schema
const invoiceSchema = new Schema({
  name: {
    type: String,
  },
  date: {
    type: Date,
  },
  invoice_number: {
    type: Number,
  },
  items: {
    type: [itemSchema],
  },
  sub_total: {
    type: Number,
  },
  grand_total: {
    type: Number,
  },
  discount: {
    type: Number,
    default: 0, // Default discount is 0 if not provided
  },
  paid: {
    type: Boolean,
    default: false, // Default is unpaid
  },
});

// Create and export the Invoice model
const Invoice = mongoose.model("Invoice", invoiceSchema);

export default Invoice;
