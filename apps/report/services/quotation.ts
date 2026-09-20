import Company from "../models/companySchema";
import QuotationReport from "../models/quotationSchema";

export const VAT_PERCENT = 5;
const MAX_ITEMS = 100;
const MAX_TERMS = 20;

export class QuotationValidationError extends Error {}

const toCents = (value: number) => Math.round((value + Number.EPSILON) * 100);

/** Line amounts, subtotal, VAT and total, always calculated here (in whole cents, so no float drift) rather than trusted from the client. */
export const quotationTotals = (items: { qty: number; price: number }[]) => {
  const lineCents = items.map((item) => toCents(item.qty * item.price));
  const subtotalCents = lineCents.reduce((sum, cents) => sum + cents, 0);
  const vatCents = Math.round((subtotalCents * VAT_PERCENT) / 100);
  return {
    lines: lineCents.map((cents) => cents / 100),
    subtotal: subtotalCents / 100,
    vatAmount: vatCents / 100,
    total: (subtotalCents + vatCents) / 100,
  };
};

const cleanInput = (data: any) => {
  const client = String(data?.client ?? "").trim();
  if (!client) throw new QuotationValidationError("Client name is required");

  const date = new Date(`${String(data?.date ?? "").slice(0, 10)}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) throw new QuotationValidationError("A valid date is required");

  if (!Array.isArray(data?.items) || data.items.length === 0) {
    throw new QuotationValidationError("Add at least one item");
  }
  if (data.items.length > MAX_ITEMS) throw new QuotationValidationError(`A quotation can have at most ${MAX_ITEMS} items`);

  const items = data.items.map((item: any, index: number) => {
    const description = String(item?.description ?? "").trim();
    const qty = Number(item?.qty);
    const price = Number(item?.price);
    const row = `Item ${index + 1}`;
    if (!description) throw new QuotationValidationError(`${row}: description is required`);
    if (!Number.isFinite(qty) || qty <= 0) throw new QuotationValidationError(`${row}: quantity must be greater than 0`);
    if (!Number.isFinite(price) || price < 0) throw new QuotationValidationError(`${row}: price can't be negative`);
    return { description, qty, price };
  });

  const terms = (Array.isArray(data?.terms) ? data.terms : [])
    .map((term: any) => String(term ?? "").trim().slice(0, 300))
    .filter(Boolean)
    .slice(0, MAX_TERMS);

  return { client, date, items, terms };
};

interface CreateQuotationArgs {
  companyId?: string;
  userId?: string;
  data: any;
}

export const createQuotationDB = async ({ companyId, userId, data }: CreateQuotationArgs) => {
  const { client, date, items, terms } = cleanInput(data);
  const company = await Company.findById(companyId);
  if (!company) throw new QuotationValidationError("Company not found");

  const totals = quotationTotals(items);

  // The number is the company's next in sequence. Two people saving at once can pick the same one;
  // the unique (companyId, quoteNo) index rejects the second, which then simply takes the next number.
  for (let attempt = 0; attempt < 5; attempt++) {
    const last = await QuotationReport.findOne({ companyId }).sort({ quoteSeq: -1 });
    const quoteSeq = (last?.quoteSeq ?? 0) + 1;
    try {
      return await QuotationReport.create({
        companyId,
        createdBy: userId,
        company: { name: company.companyName },
        client,
        quoteSeq,
        quoteNo: `QT-${String(quoteSeq).padStart(4, "0")}`,
        date,
        items: items.map((item: any, index: number) => ({ ...item, amount: totals.lines[index] })),
        subtotal: totals.subtotal,
        vatPercent: VAT_PERCENT,
        vatAmount: totals.vatAmount,
        total: totals.total,
        terms,
      });
    } catch (err: any) {
      if (err?.code !== 11000) throw err;
    }
  }
  throw new Error("Could not assign a quotation number, please try again");
};
