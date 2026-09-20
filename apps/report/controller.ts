import { Request, response, Response } from "express";
import mongoose from "mongoose";
import Invoice from "./models/invoiceSchema";
import Service from "./models/serviceSchema";
import Customer from "./models/customerSchema";
import { createInvoiceDB, dailyReportsDB, editInvoiceDB, editInvoiceDetailsDB, getTodayReportsDB, montlyReportDB } from "./services/service";
import Company from "./models/companySchema";
import { AuthRequest } from "../utils/authMiddleware";
import QuotationReport from "./models/quotationSchema";
import { createQuotationDB, QuotationValidationError } from "./services/quotation";
import { describeMailError, MailNotConfiguredError, sendMail } from "../utils/mailer";
import Proforma from "./models/proformaSchema";
import { convertProformaDB, createProformaDB, ProformaStateError, ProformaValidationError } from "./services/proforma";

export const createInvoice = async (req: AuthRequest, res: Response) => {
  try {
    // createdBy always comes from the logged-in user's token, never from the request body
    const invoiceData = { ...req.body, createdBy: req.userId };
    const { invoice, customerCheck } = await createInvoiceDB(invoiceData);
    res.status(201).json({
      message: customerCheck ? "Invoice created and new customer added successfully" : "Invoice created successfully",
      data: invoice,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error creating invoice",
      error,
    });
  }
};

export const createService = async (req: AuthRequest, res: Response) => {
  try {
    const newService = new Service({ ...req.body, companyId: req.companyId });
    const savedService = await newService.save();
    res.status(201).json({ message: "Service created  successfully", data: savedService });
  } catch (err) {
    throw err;
  }
};

export const getInvoice = async (req: AuthRequest, res: Response) => {
  try {
    const invoices = await Invoice.find({ companyId: req?.companyId }).sort({ invoice_number: -1 });
    res.status(200).json({ message: "Invoices fetched successfully", data: invoices });
  } catch (err) {
    throw err;
  }
};
export const getService = async (req: AuthRequest, res: Response) => {
  try {
    const Services = await Service.find({ companyId: req?.companyId });
    res.status(200).json({ message: "sevices fetched successfully", data: Services });
  } catch (err) {
    throw err;
  }
};

export const getInvoiceById = async (req: Request, res: Response) => {
  try {
    const invoiceId = req.params.invoiceId;
    const invoice = await Invoice.findById(invoiceId).populate("items.description").populate("createdBy", "name");
    res.status(200).json({ message: "invoice items fetched successfully", data: invoice });
  } catch (err) {
    throw err;
  }
};

export const getInvoiceItems = async (req: Request, res: Response) => {
  try {
    const invoiceId = req.params.invoiceId;
    const invoice = await Invoice.findById(invoiceId).populate("items.description");
    res.status(200).json({
      message: "invoice items fetched successfully",
      data: invoice?.items,
    });
  } catch (err) {
    throw err;
  }
};

export const getCustomerByName = async (req: Request, res: Response) => {
  try {
    const customerName = req.body.name;
    if (!customerName) {
      return res.status(400).json({ message: "Name is required" });
    }
    const user = await Customer.findOne({ name: customerName });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ message: "User found", data: user });
  } catch (err) {
    console.error("Error finding user:", err);
    res.status(500).json({ message: "Internal server error", error: err });
  }
};

export const getFilterReport = async (req: Request, res: Response) => {
  try {
    const { name, date, paid } = req.body;
    const filter: any = {};

    if (name) {
      filter.name = name;
    }
    if (date) {
      filter.date = {
        $gte: new Date(`${date}T00:00:00.000Z`),
        $lte: new Date(`${date}T23:59:59.999Z`),
      };
    }
    if (paid) {
      filter.paid = paid;
    } else {
      filter.paid = !paid;
    }

    const reports = await Invoice.find(filter);
    res.status(200).json({
      message: "Filter report fetched successfully",
      data: reports,
    });
  } catch (err) {
    console.error("Error retrieving filter report:", err);
    res.status(500).json({ message: "Internal server error", error: err });
  }
};

export const deleteInvoiceById = async (req: AuthRequest, res: Response) => {
  try {
    // scoped to the caller's company so one company can't delete another's invoice
    const deleted = await Invoice.findOneAndDelete({ _id: req.params.invoiceId, companyId: req.companyId });
    if (!deleted) {
      return res.status(404).json({ message: "Invoice Not found" });
    }
    res.status(200).json({ message: "Invoice deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Internal server error", error: err });
  }
};

export const updateInvoiceById = async (req: Request, res: Response) => {
  try {
    const invoiceId = req.params.invoiceId;
    const body = req.body;
    const updateInvoice = await Invoice.findByIdAndUpdate(invoiceId, body, {
      new: true,
    });
    if (updateInvoice) {
      return res.status(200).json({ message: "invoice updated successfully", data: updateInvoice });
    }
  } catch (err) {
    res.status(500).json({ message: "Internal server error", error: err });
  }
};

export const getLastInvoice = async (req: Request, res: Response) => {
  try {
    const lastInvoice = await Invoice.findOne().sort({ invoice_number: -1 }).populate("items.description");
    res.status(200).json({
      message: "Last invoice fetched successfully",
      data: lastInvoice,
    });
  } catch (err) {
    res.status(500).json({ message: "Internal server error", error: err });
  }
};

export const getDailyReports = async (req: AuthRequest, res: Response) => {
  try {
    const filter = req.body;

    const response = await dailyReportsDB({ companyId: req?.companyId || "" });

    res.status(200).json({
      message: " Daily Report fetched successfully",
      data: response,
    });
  } catch (err) {
    res.status(500).json({ message: "Internal server error", error: err });
  }
};

export const getMonthlyReports = async (req: AuthRequest, res: Response) => {
  try {
    const filter = req.body;

    const response = await montlyReportDB({ companyId: req?.companyId || "" });

    res.status(200).json({
      message: " Monthly Report fetched successfully",
      data: response,
    });
  } catch (err) {
    res.status(500).json({ message: "Internal server error", error: err });
  }
};

export const getTodayReports = async (req: AuthRequest, res: Response) => {
  try {
    const response = await getTodayReportsDB({ companyId: req?.companyId || "" });
    res.status(200).json({
      message: "Dashboard report fetched successfully",
      data: response,
    });
  } catch (err) {
    res.status(500).json({ message: "Internal server error", error: err });
  }
};

export const editInvoiceItems = async (req: Request, res: Response) => {
  try {
    const data = req.body;
    const invoiceId = req.params.invoiceId;
    const itemId = req.params.itemId;
    console.log(data, invoiceId, itemId);
    await editInvoiceDB(invoiceId, itemId, data);
    res.status(200).json({
      message: "Invoice items updated successfully",
    });
  } catch (err) {
    res.status(500).json({ message: "Internal server error", error: err });
  }
};

export const editInvoiceDetails = async (req: Request, res: Response) => {
  try {
    // console.log("hiiiii");
    const data = req.body;
    const invoiceId = req.params.invoiceId;
    // const itemId = req.params.itemId;
    const response = await editInvoiceDetailsDB(invoiceId, data);
    res.status(200).json({
      message: "Invoice updated successfully",
    });
  } catch (err) {
    res.status(500).json({ message: "Internal server error", error: err });
  }
};

export const updateService = async (req: Request, res: Response) => {
  try {
    const serviceId = req.params.serviceId;
    const body = req.body;
    const updateService = await Service.findByIdAndUpdate(serviceId, body, {
      new: true,
    });
    if (updateService) {
      return res.status(200).json({ message: "Service updated successfully", data: updateService });
    }
  } catch (err) {
    res.status(500).json({ message: "Internal server error", error: err });
  }
};

export const deleteService = async (req: Request, res: Response) => {
  try {
    const serviceId = req.params.serviceId;
    if (serviceId) {
      await Service.findByIdAndDelete(serviceId);
      res.status(200).json({ message: "Service deleted successfully" });
    } else {
      res.status(404).json({ message: "Service Not found" });
    }
  } catch (err) {
    res.status(500).json({ message: "Internal server error", error: err });
  }
};

export const createQuotation = async (req: AuthRequest, res: Response) => {
  try {
    // company and creator come from the login token, the number and totals are worked out on the server
    const quotation = await createQuotationDB({ companyId: req.companyId, userId: req.userId, data: req.body });
    res.status(201).json({ message: "Quotation created successfully", data: quotation });
  } catch (err) {
    if (err instanceof QuotationValidationError) {
      return res.status(400).json({ message: err.message });
    }
    res.status(500).json({ message: "Internal server error", error: err });
  }
};

export const getQuotations = async (req: AuthRequest, res: Response) => {
  try {
    const quotations = await QuotationReport.find({ companyId: req.companyId })
      .sort({ quoteSeq: -1 })
      .populate("createdBy", "name");
    res.status(200).json({ message: "Quotations fetched successfully", data: quotations });
  } catch (err) {
    res.status(500).json({ message: "Internal server error", error: err });
  }
};

export const getQuotationById = async (req: AuthRequest, res: Response) => {
  try {
    const { quotationId } = req.params;
    const quotation = mongoose.isValidObjectId(quotationId)
      ? await QuotationReport.findOne({ _id: quotationId, companyId: req.companyId }).populate("createdBy", "name")
      : null;
    if (!quotation) {
      return res.status(404).json({ message: "Quotation not found" });
    }
    res.status(200).json({ message: "Quotation fetched successfully", data: quotation });
  } catch (err) {
    res.status(500).json({ message: "Internal server error", error: err });
  }
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const getCustomers = async (req: AuthRequest, res: Response) => {
  try {
    const customers = await Customer.find({ companyId: req.companyId }).sort({ name: 1 });
    res.status(200).json({ message: "Customers fetched successfully", data: customers });
  } catch (err) {
    console.error("Get customers error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const createCustomer = async (req: AuthRequest, res: Response) => {
  try {
    const { name, contact, trn, address, email } = req.body;

    if (typeof name !== "string" || !name.trim()) {
      return res.status(400).json({ message: "Customer name is required" });
    }
    if (email && !EMAIL_PATTERN.test(String(email).trim())) {
      return res.status(400).json({ message: "Enter a valid email address" });
    }

    const trimmedName = name.trim();
    const escapedName = trimmedName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const exists = await Customer.findOne({
      companyId: req.companyId,
      name: { $regex: `^${escapedName}$`, $options: "i" },
    });
    if (exists) {
      return res.status(409).json({ message: "A customer with this name already exists" });
    }

    const customer = await Customer.create({
      name: trimmedName,
      companyId: req.companyId,
      contact: contact || undefined,
      trn: trn || undefined,
      address: address ? String(address).trim() : undefined,
      email: email ? String(email).trim() : undefined,
    });

    res.status(201).json({ message: "Customer added successfully", data: customer });
  } catch (err) {
    console.error("Create customer error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const sendInvoiceEmail = async (req: AuthRequest, res: Response) => {
  try {
    const { email, pdfBase64 } = req.body;

    if (typeof email !== "string" || !EMAIL_PATTERN.test(email.trim())) {
      return res.status(400).json({ message: "A valid customer email is required" });
    }
    if (typeof pdfBase64 !== "string" || !pdfBase64) {
      return res.status(400).json({ message: "Invoice PDF is required" });
    }

    const invoice = await Invoice.findOne({ _id: req.params.invoiceId, companyId: req.companyId });
    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    const company = await Company.findById(req.companyId);
    const companyName = company?.companyName || "Our company";

    await sendMail({
      to: email.trim(),
      subject: `Invoice #${invoice.invoice_number} from ${companyName}`,
      text: `Dear ${invoice.name || "Customer"},\n\nPlease find attached invoice #${invoice.invoice_number}.\n\nThank you,\n${companyName}`,
      attachments: [
        {
          filename: `Invoice-${invoice.invoice_number}.pdf`,
          content: Buffer.from(pdfBase64, "base64"),
          contentType: "application/pdf",
        },
      ],
    });

    res.status(200).json({ message: `Invoice sent to ${email.trim()}` });
  } catch (err) {
    console.error("Send invoice email error:", err);
    if (err instanceof MailNotConfiguredError) {
      return res.status(503).json({ message: err.message });
    }
    const known = describeMailError(err);
    if (known) {
      return res.status(known.status).json({ message: known.message });
    }
    res.status(500).json({ message: "Failed to send invoice email" });
  }
};

export const createProforma = async (req: AuthRequest, res: Response) => {
  try {
    // company and creator come from the login token, the number is allocated on the server
    const proforma = await createProformaDB({ companyId: req.companyId, userId: req.userId, data: req.body });
    res.status(201).json({ message: "Proforma invoice created successfully", data: proforma });
  } catch (err) {
    if (err instanceof ProformaValidationError) {
      return res.status(400).json({ message: err.message });
    }
    console.error("Create proforma error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getProformas = async (req: AuthRequest, res: Response) => {
  try {
    const proformas = await Proforma.find({ companyId: req.companyId }).sort({ proformaSeq: -1 });
    res.status(200).json({ message: "Proforma invoices fetched successfully", data: proformas });
  } catch (err) {
    console.error("Get proformas error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getProformaById = async (req: AuthRequest, res: Response) => {
  try {
    const proforma = await Proforma.findOne({ _id: req.params.proformaId, companyId: req.companyId })
      .populate("items.description")
      .populate("createdBy", "name");
    if (!proforma) {
      return res.status(404).json({ message: "Proforma invoice not found" });
    }
    res.status(200).json({ message: "Proforma invoice fetched successfully", data: proforma });
  } catch (err) {
    console.error("Get proforma error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const convertProforma = async (req: AuthRequest, res: Response) => {
  try {
    const result = await convertProformaDB({
      proformaId: req.params.proformaId,
      companyId: req.companyId,
      userId: req.userId,
      date: req.body?.date,
    });
    if (!result) {
      return res.status(404).json({ message: "Proforma invoice not found" });
    }
    res.status(201).json({ message: "Proforma converted to invoice", data: result.invoice });
  } catch (err) {
    if (err instanceof ProformaStateError) {
      return res.status(409).json({ message: err.message });
    }
    console.error("Convert proforma error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};
