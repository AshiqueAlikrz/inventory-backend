import mongoose, { Schema } from "mongoose";

const pairSchema = new Schema(
  {
    label: { type: String },
    value: { type: String },
  },
  { _id: false },
);

const entrySchema = new Schema(
  {
    title: { type: String },
    subtitle: { type: String },
    period: { type: String },
    // one point per line
    details: { type: String },
  },
  { _id: false },
);

// One block of the CV (work experience, skills, a custom section...). `kind` says which of the
// content fields it uses: text and list use `text`, the others use the list named after them.
const sectionSchema = new Schema(
  {
    key: { type: String },
    preset: { type: String },
    title: { type: String },
    kind: { type: String, required: true },
    // Modern layout only: "side" or "main" when the section was moved out of its usual column
    column: { type: String },
    text: { type: String },
    entries: { type: [entrySchema] },
    tags: [{ type: String }],
    pairs: { type: [pairSchema] },
  },
  { _id: false },
);

// A reusable starting point for making a CV. The CVs made from it are never stored:
// they are filled in and turned into a PDF in the browser.
const cvTemplateSchema = new Schema(
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
    name: { type: String, required: true },
    // which layout the CV is printed with, its highlight colour and text size
    layout: { type: String, required: true },
    accent: { type: String },
    textSize: { type: String },
    // starter text the CV opens with
    fullName: { type: String },
    jobTitle: { type: String },
    contacts: { type: [pairSchema] },
    sections: { type: [sectionSchema] },
  },
  {
    timestamps: true,
  },
);

const CvTemplate = mongoose.model("CvTemplate", cvTemplateSchema);

export default CvTemplate;
