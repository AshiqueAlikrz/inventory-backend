import Proforma from "../models/proformaSchema";
import { createInvoiceDB, reduceVatFromItems } from "./service";

export class ProformaValidationError extends Error {}
export class ProformaStateError extends Error {}

const toNumber = (value: any) => (Number.isFinite(Number(value)) ? Number(value) : 0);

const cleanInput = (data: any) => {
  const name = String(data?.name ?? "").trim();
  if (!name) throw new ProformaValidationError("Customer name is required");

  const date = new Date(`${String(data?.date ?? "").slice(0, 10)}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) throw new ProformaValidationError("A valid date is required");

  if (!Array.isArray(data?.items) || data.items.length === 0) {
    throw new ProformaValidationError("Add at least one item");
  }

  // only known fields are taken from the request, so status and ids can't be set by the client
  return {
    name,
    date,
    trn: toNumber(data.trn) || undefined,
    contact: toNumber(data.contact) || undefined,
    address: data.address ? String(data.address).trim() : undefined,
    items: data.items,
    subTotal: toNumber(data.subTotal),
    grandTotal: toNumber(data.grandTotal),
    totalVat: toNumber(data.totalVat),
    vatPaidByCompany: !!data.vatPaidByCompany,
    profit: toNumber(data.profit),
    discount: toNumber(data.discount),
  };
};

interface CreateProformaArgs {
  companyId?: string;
  userId?: string;
  data: any;
}

export const createProformaDB = async ({ companyId, userId, data }: CreateProformaArgs) => {
  const input = cleanInput(data);
  // stored the way an invoice stores its items, so converting is a straight copy
  const items = reduceVatFromItems(input.items, input.vatPaidByCompany);

  // The number is the company's next in sequence. Two people saving at once can pick the same one;
  // the unique (companyId, proformaNo) index rejects the second, which then takes the next number.
  for (let attempt = 0; attempt < 5; attempt++) {
    const last = await Proforma.findOne({ companyId }).sort({ proformaSeq: -1 });
    const proformaSeq = (last?.proformaSeq ?? 0) + 1;
    try {
      return await Proforma.create({
        ...input,
        items,
        companyId,
        createdBy: userId,
        proformaSeq,
        proformaNo: `PF-${String(proformaSeq).padStart(4, "0")}`,
      });
    } catch (err: any) {
      if (err?.code !== 11000) throw err;
    }
  }
  throw new Error("Could not allocate a proforma number");
};

interface ConvertArgs {
  proformaId: string;
  companyId?: string;
  userId?: string;
  date?: string;
}

export const convertProformaDB = async ({ proformaId, companyId, userId, date }: ConvertArgs) => {
  // claim the proforma first so a double click or two tabs can't create two invoices from it
  const proforma = await Proforma.findOneAndUpdate(
    { _id: proformaId, companyId, status: "open" },
    { status: "converted" },
    { new: true },
  );
  if (!proforma) {
    const existing = await Proforma.findOne({ _id: proformaId, companyId });
    if (!existing) return null;
    throw new ProformaStateError("This proforma has already been converted to an invoice");
  }

  try {
    const invoiceDate = date && !Number.isNaN(new Date(date).getTime()) ? date : proforma.date;
    const { invoice } = await createInvoiceDB(
      {
        name: proforma.name,
        date: invoiceDate,
        trn: proforma.trn,
        contact: proforma.contact,
        address: proforma.address,
        items: proforma.items.map((item: any) => item.toObject()),
        subTotal: proforma.subTotal,
        grandTotal: proforma.grandTotal,
        totalVat: proforma.totalVat,
        vatPaidByCompany: proforma.vatPaidByCompany,
        profit: proforma.profit,
        discount: proforma.discount,
        companyId: proforma.companyId,
        createdBy: userId,
      },
      // items were already reduced when the proforma was saved
      { reduceVat: false },
    );
    proforma.convertedInvoiceId = invoice._id;
    await proforma.save();
    return { proforma, invoice };
  } catch (err) {
    await Proforma.updateOne({ _id: proforma._id }, { status: "open" });
    throw err;
  }
};
