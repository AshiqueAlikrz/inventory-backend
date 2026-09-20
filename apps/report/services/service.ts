import { validationResult } from "express-validator";
import Customer from "../models/customerSchema";
import DailyReport from "../models/dailyReportSchema";
import Invoice from "../models/invoiceSchema";
import MonthlyReport from "../models/montlyReportSchema";
import mongoose from "mongoose";

// When the company pays the VAT, it comes out of each line's service charge
export const reduceVatFromItems = (items: any[], vatPaidByCompany: boolean) =>
  vatPaidByCompany ? items.map((item: any) => ({ ...item, serviceCharge: item.serviceCharge - item.tax })) : items;

export const createInvoiceDB = async (invoiceData: any, { reduceVat = true } = {}) => {
  const lastInvoice = await Invoice.findOne().sort({ invoice_number: -1 });
  const invoiceNumber = (lastInvoice?.invoice_number ?? 0) + 1;

  const vatRedaucedRate = reduceVat ? reduceVatFromItems(invoiceData.items, invoiceData.vatPaidByCompany) : invoiceData.items;
  const savedInvoice = await new Invoice({
    ...invoiceData,
    items: vatRedaucedRate,
    invoice_number: invoiceNumber,
  }).save();

  let customer = await Customer.findOne({ name: invoiceData.name, companyId: invoiceData.companyId });
  let customerCheck = false;

  if (!customer) {
    customer = new Customer({
      name: invoiceData.name,
      companyId: invoiceData.companyId,
      contact: invoiceData.contact || undefined,
      trn: invoiceData.trn || undefined,
      address: invoiceData.address || undefined,
      products: [savedInvoice._id],
    });
    await customer.save();
    customerCheck = true;
  } else {
    customer.products.push(savedInvoice._id);
    await customer.save();
  }

  return {
    invoice: savedInvoice,
    customerCheck,
  };
};

export const dailyReportsDB = async ({ companyId }: { companyId: string }) => {
  try {
    const aggregatedData = await Invoice.aggregate([
      { $match: { companyId: new mongoose.Types.ObjectId(companyId), date: { $ne: null } } },
      {
        $project: {
          date: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
          profit: 1,
          expense: "$grandTotal",
          vat: "$totalVat",
          discount: "$discount",
        },
      },
      {
        $group: {
          _id: "$date",
          totalProfit: { $sum: "$profit" }, // sum invoice-level profit
          totalExpense: { $sum: "$expense" }, // sum grandTotal as expense
          totalVat: { $sum: "$vat" }, // sum grandTotal as expense
          totalDiscount: { $sum: "$discount" }, // sum grandTotal as expense
        },
      },
      {
        $project: {
          _id: 0,
          date: "$_id",
          profit: "$totalProfit",
          expense: "$totalExpense",
          vat: "$totalVat",
          discount: "$totalDiscount",
        },
      },
      { $sort: { date: -1 } },
    ]);

    const savePromises = aggregatedData.map((record) =>
      DailyReport.findOneAndUpdate(
        {
          companyId,
          date: record.date,
        },
        {
          companyId,
          date: record.date,
          expense: record.expense,
          profit: record.profit,
          vat: record.vat,
          discount: record.discount,
        },
        { upsert: true, new: true },
      ),
    );

    const reports = await Promise.all(savePromises);

    // Drop rows for days that no longer have invoices (invoice deleted or moved to another date)
    await DailyReport.deleteMany({
      companyId,
      date: { $nin: aggregatedData.map((record) => new Date(record.date)) },
    });

    return reports;
  } catch (error) {
    console.error("Error generating daily reports:", error);
    throw error;
  }
};

export const montlyReportDB = async ({ companyId }: { companyId: string }) => {
  try {
    const companyObjectId = new mongoose.Types.ObjectId(companyId);

    // Built straight from invoices so it never depends on the daily report having been generated first
    const monthlyReportAggregation = await Invoice.aggregate([
      { $match: { companyId: companyObjectId, date: { $ne: null } } },
      {
        $project: {
          year: { $year: "$date" },
          month: { $month: "$date" },
          profit: 1,
          expense: "$grandTotal",
          vat: "$totalVat",
          discount: 1,
        },
      },
      {
        $group: {
          _id: { year: "$year", month: "$month" },
          profit: { $sum: "$profit" },
          expense: { $sum: "$expense" },
          vat: { $sum: "$vat" },
          discount: { $sum: "$discount" },
        },
      },
      {
        $project: {
          _id: 0,
          year: "$_id.year",
          month: "$_id.month",
          profit: 1,
          expense: 1,
          vat: 1,
          discount: 1,
        },
      },
      { $sort: { year: -1, month: -1 } },
    ]);

    const reports = await Promise.all(
      monthlyReportAggregation.map((record) =>
        MonthlyReport.findOneAndUpdate(
          {
            companyId: companyObjectId,
            year: record.year,
            month: record.month,
          },
          { $set: record },
          { upsert: true, new: true },
        ),
      ),
    );

    // Drop rows for months that no longer have invoices
    await MonthlyReport.deleteMany({
      companyId: companyObjectId,
      ...(monthlyReportAggregation.length
        ? { $nor: monthlyReportAggregation.map((record) => ({ year: record.year, month: record.month })) }
        : {}),
    });

    return reports;
  } catch (error) {
    console.error("Error generating monthly reports:", error);
    throw error;
  }
};

export const getTodayReportsDB = async ({ companyId }: { companyId: string }) => {
  const companyObjectId = new mongoose.Types.ObjectId(companyId);
  const totalUsers = await Invoice.countDocuments({ companyId: companyObjectId });

  // Sum straight from invoices so the dashboard is correct as soon as an invoice is created,
  // without depending on the daily/monthly report collections having been generated first.
  const todayReport = await Invoice.aggregate([
    { $match: { companyId: companyObjectId } },
    {
      $group: {
        _id: null,
        totalProfit: { $sum: "$profit" },
        totalExpense: { $sum: "$grandTotal" },
        totalVat: { $sum: "$totalVat" },
        totalDiscount: { $sum: "$discount" },
      },
    },
    {
      $project: {
        _id: 0,
        profit: "$totalProfit",
        expense: "$totalExpense",
        vat: "$totalVat",
        discount: "$totalDiscount",
      },
    },
  ]);
  return { todayReport, totalUsers };
};

export const editInvoiceDB = async (invoiceId: string, itemId: string, data: any) => {
  const invoice = await Invoice.findById(invoiceId).populate("items");
  if (!invoice) throw new Error("No invoice found");
  const item = invoice.items.find((item) => item._id.equals(itemId));
  if (!item) throw new Error("Item not found in invoice");
  const serviceCharge = Number(data.serviceCharge);
  const tax = data.tax ? Number(data.tax) : 0;
  const rate = Number(data.rate);
  const quantity = Number(data.quantity);
  if (![serviceCharge, tax, rate, quantity].every(Number.isFinite)) throw new Error("Invalid item values");

  item.serviceCharge = serviceCharge;
  item.tax = tax;
  item.rate = rate;
  item.quantity = quantity;
  item.total = roundMoney(quantity * rate + serviceCharge + tax);
  Object.assign(invoice, invoiceTotals(invoice.items, invoice.discount ?? 0));
  await invoice.save();
};

export const editInvoiceDetailsDB = async (invoiceId: string, data: any) => {
  const invoice = await Invoice.findById(invoiceId);
  if (!invoice) throw new Error("Invoice not found ");
  const discount = data.discount === undefined ? invoice.discount ?? 0 : Number(data.discount);
  if (!Number.isFinite(discount)) throw new Error("Invalid discount");
  await invoice.updateOne({ ...data, ...invoiceTotals(invoice.items, discount), discount });
};

const roundMoney = (value: number) => Math.round(value * 100) / 100;

/**
 * Invoice-level figures, always derived from the items and the discount so edits can't leave them out of sync.
 * A stored item's serviceCharge is already net of VAT when the company pays it, so in both VAT modes:
 *   item total = rate * quantity + serviceCharge + tax, and profit = sum of serviceCharge - discount.
 */
const invoiceTotals = (items: any[], discount: number) => {
  const sum = (pick: (item: any) => number | undefined) => items.reduce((acc, item) => acc + (pick(item) ?? 0), 0);
  const subTotal = sum((item) => item.total);
  return {
    subTotal,
    totalVat: sum((item) => item.tax),
    grandTotal: subTotal - discount,
    profit: sum((item) => item.serviceCharge) - discount,
  };
};
