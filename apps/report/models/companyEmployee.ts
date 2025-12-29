import mongoose, { Schema } from "mongoose";

const companyEmployee = new Schema({
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Company",
  },
  name: {
    type: String,
    required: true,
  },
});

const CompanyEmployee = mongoose.model("companyemployees", companyEmployee);

export default CompanyEmployee;
