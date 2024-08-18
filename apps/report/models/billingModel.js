const mongoose = require("mongoose");

const billingSchema = new mongoose.Schema({
  name: { type: String, required: true },
  date: { type: String, default: new Date().toLocaleDateString() },
  invoice: { type: String, required: true },
  items: [
    {
      description: { type: String, required: true },
      rate: { type: Number, required: true },
      quantity: { type: Number, required: true },
      total: { type: Number, required: true },
    },
  ],
  subTotal: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  grandTotal: { 
    type: Number, 
    required: true,
    // default: function() {
    //   return this.subTotal - this.discount;
    // }
  },
});

export const billingReportModel = mongoose.model("BillingReport", billingSchema);
// module.exports = billingReportModel;
