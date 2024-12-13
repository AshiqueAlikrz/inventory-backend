import mongoose, { Schema } from "mongoose";

const customerSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  products: {
    type: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Invoice",
      },
    ],
    // required: true,
  },
});

const Customer = mongoose.model("Customer", customerSchema);

export default Customer;
