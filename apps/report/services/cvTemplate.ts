import CvTemplate from "../models/cvTemplateSchema";

export const CV_LAYOUTS = ["classic", "modern", "minimal"];
const CV_TEXT_SIZES = ["small", "normal", "large"];
const CV_SECTION_KINDS = ["text", "list", "entries", "tags", "pairs"];
const MAX_SECTIONS = 30;
const MAX_ROWS = 40;
const MAX_TAGS = 60;

export class CvTemplateValidationError extends Error {}

const text = (value: any, max: number) => String(value ?? "").trim().slice(0, max);

const list = (value: any, max: number) => (Array.isArray(value) ? value : []).slice(0, max);

// rows keep their label even when the value is empty: an empty labelled row is part of the template
const pairs = (value: any) =>
  list(value, MAX_ROWS)
    .map((pair: any) => ({ label: text(pair?.label, 60), value: text(pair?.value, 200) }))
    .filter((pair) => pair.label || pair.value);

const section = (data: any) => ({
  key: text(data?.key, 40),
  preset: text(data?.preset, 40),
  title: text(data?.title, 60),
  kind: data?.kind,
  column: data?.column === "side" || data?.column === "main" ? data.column : "",
  text: text(data?.text, 5000),
  entries: list(data?.entries, MAX_ROWS).map((entry: any) => ({
    title: text(entry?.title, 160),
    subtitle: text(entry?.subtitle, 160),
    period: text(entry?.period, 60),
    details: text(entry?.details, 3000),
  })),
  tags: list(data?.tags, MAX_TAGS)
    .map((tag: any) => text(tag, 60))
    .filter(Boolean),
  pairs: pairs(data?.pairs),
});

// Only known fields are taken from the request, so the company and creator can't be set by the client.
// A photo is never kept: a template is a starting point, not a person's CV.
const cleanInput = (data: any) => {
  const name = text(data?.name, 80);
  if (!name) throw new CvTemplateValidationError("Template name is required");

  if (Array.isArray(data?.sections) && data.sections.length > MAX_SECTIONS) {
    throw new CvTemplateValidationError(`A template can have at most ${MAX_SECTIONS} sections`);
  }

  return {
    name,
    layout: CV_LAYOUTS.includes(data?.layout) ? data.layout : CV_LAYOUTS[0],
    accent: /^#[0-9a-fA-F]{6}$/.test(data?.accent) ? data.accent : undefined,
    textSize: CV_TEXT_SIZES.includes(data?.textSize) ? data.textSize : "normal",
    fullName: text(data.fullName, 120),
    jobTitle: text(data.jobTitle, 120),
    contacts: pairs(data.contacts),
    sections: list(data.sections, MAX_SECTIONS)
      .filter((item: any) => CV_SECTION_KINDS.includes(item?.kind))
      .map(section),
  };
};

interface SaveCvTemplateArgs {
  companyId?: string;
  userId?: string;
  data: any;
}

export const createCvTemplateDB = async ({ companyId, userId, data }: SaveCvTemplateArgs) =>
  CvTemplate.create({ ...cleanInput(data), companyId, createdBy: userId });

export const updateCvTemplateDB = async ({ templateId, companyId, data }: SaveCvTemplateArgs & { templateId: string }) =>
  CvTemplate.findOneAndUpdate({ _id: templateId, companyId }, { $set: cleanInput(data) }, { new: true });
