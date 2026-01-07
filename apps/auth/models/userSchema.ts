import { ObjectId } from "mongodb";
import mongoose, { Schema } from "mongoose";

const userShema = new Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  database: {
    type: String,
  },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "Company",
  },
});

const User = mongoose.model("user", userShema);

export default User;
