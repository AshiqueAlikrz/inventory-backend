import mongoose, { Schema } from "mongoose";

const ServiceSchema = new Schema({
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Company",
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
});

const Service = mongoose.model("Service", ServiceSchema);

export default Service;
