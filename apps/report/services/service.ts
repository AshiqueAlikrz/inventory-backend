import { validationResult } from "express-validator";
import Customer from "../models/customerSchema";
import DailyReport from "../models/dailyReportSchema";
import Invoice from "../models/invoiceSchema";
import MonthlyReport from "../models/montlyReportSchema";
import mongoose from "mongoose";

export const createInvoiceDB = async (invoiceData: any) => {
  const lastInvoice = await Invoice.findOne().sort({ invoice_number: -1 });
  const invoiceNumber = (lastInvoice?.invoice_number ?? 0) + 1;

  let vatRedaucedRate = invoiceData.items;

  if (invoiceData.vatPaidByCompany) {
    vatRedaucedRate = invoiceData.items.map((item: any) => ({
      ...item,
      serviceCharge: item.serviceCharge - item.tax,
    }));
  }
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
      { $match: { companyId: new mongoose.Types.ObjectId(companyId) } },
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
        { companyId },
        {
          companyId,
          date: record.date,
          expense: record.expense,
          profit: record.profit,
          vat: record.vat,
          discount: record.discount,
        },
        { upsert: true, new: true }
      )
    );

    const reports = await Promise.all(savePromises);
    return reports;
  } catch (error) {
    console.error("Error generating daily reports:", error);
    throw error;
  }
};

export const montlyReportDB = async ({ companyId }: { companyId: string }) => {
  try {
    const monthlyReportAggregation = await DailyReport.aggregate([
      { $match: { companyId: new mongoose.Types.ObjectId(companyId) } },
      {
        $project: {
          year: { $year: "$date" },
          month: { $month: "$date" },
          discount: "$discount",
          profit: "$profit",
          vat: "$vat",
          expense: "$expense",
        },
      },
      {
        $group: {
          _id: { year: "$year", month: "$month" },
          totalProfit: { $sum: "$profit" },
          totalDiscount: { $sum: "$discount" },
          totalExpense: { $sum: "$expense" },
          totalVat: { $sum: "$vat" },
          expense: { $sum: "$vat" },
        },
      },
      {
        $project: {
          _id: 0,
          year: "$_id.year",
          month: "$_id.month",
          profit: "$totalProfit",
          expense: "$totalExpense",
          discount: "$totalDiscount",
          vat: "$totalVat",
        },
      },
      { $sort: { year: 1, month: 1 } },
    ]);

    const savePromises = monthlyReportAggregation.map((record) =>
      MonthlyReport.findOneAndUpdate(
        { companyId },
        {
          companyId,
          expense: record.expense,
          year: record.year,
          month: record.month,
          profit: record.profit,
          vat: record.vat,
          discount: record.discount,
        },
        { upsert: true, new: true }
      )
    );
    const reports = await Promise.all(savePromises);
    return reports;
  } catch (error) {
    console.error("Error generating daily reports:", error);
    throw error;
  }
};

export const getTodayReportsDB = async ({ companyId }: { companyId: string }) => {
  const totalUsers = await Invoice.find({ companyId }).countDocuments();
  const todayReport = await MonthlyReport.aggregate([
    { $match: { companyId: new mongoose.Types.ObjectId(companyId) } },
    {
      $project: {
        _id: "_id",
        expense: "$expense",
        profit: "$profit",
        vat: "$vat",
        discount: "$discount",
      },
    },
    {
      $group: {
        _id: "_id",
        totalProfit: { $sum: "$profit" },
        totalExpense: { $sum: "$expense" },
        totalVat: { $sum: "$vat" },
        totalDiscount: { $sum: "$discount" },
      },
    },
    {
      $project: {
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
  item.serviceCharge = data.serviceCharge;
  item.tax = data.tax ? data.tax : 0;
  item.rate = data.rate;
  item.quantity = data.quantity;
  item.total = data.quantity * data.rate;
  invoice.subTotal = invoice.items.reduce((acc: number, curr: any) => {
    return acc + (curr.total ? curr.total : 0);
  }, 0);
  invoice.grandTotal = invoice.subTotal ? invoice.subTotal - invoice.discount : 0;
  await invoice.save();
};

export const editInvoiceDetailsDB = async (invoiceId: string, data: any) => {
  const invoice = await Invoice.findById(invoiceId);
  if (!invoice) throw new Error("Invoice not found ");
  await invoice.updateOne({ ...data, grandTotal: invoice.subTotal ? invoice.subTotal - data.discount : 0 });
  await invoice.save();
};
