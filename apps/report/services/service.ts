import { validationResult } from "express-validator";
import Customer from "../models/customerSchema";
import DailyReport from "../models/dailyReportSchema";
import Invoice from "../models/invoiceSchema";
import MonthlyReport from "../models/montlyReportSchema";

export const dailyReportsDB = async () => {
  try {
    const aggregatedData = await Invoice.aggregate([
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
        { date: record.date }, // update if exists
        { expense: record.expense, profit: record.profit, vat: record.vat, discount: record.discount },
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

export const montlyReportDB = async (req: any) => {
  const monthlyReportAggregation = await DailyReport.aggregate([
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
      { month: record.month, year: record.year }, // update if exists
      { expense: record.expense, profit: record.profit, vat: record.vat, discount: record.discount },
      { upsert: true, new: true }
    )
  );
  const reports = await Promise.all(savePromises);
  return reports;
};

export const getTodayReportsDB = async () => {
  const totalUsers = await Customer.countDocuments();
  const todayReport = await MonthlyReport.aggregate([
    {
      $project: {
        _id: "_id",
        expense: "$expense",
        profit: "$profit",
      },
    },
    {
      $group: {
        _id: "_id",
        totalProfit: { $sum: "$profit" },
        totalExpense: { $sum: "$expense" },
      },
    },
    {
      $project: {
        profit: "$totalProfit",
        expense: "$totalExpense",
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
