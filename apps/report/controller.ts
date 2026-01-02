import { Request, response, Response } from "express";
import Invoice from "./models/invoiceSchema";
import Service from "./models/serviceSchema";
import Customer from "./models/customerSchema";
import { createInvoiceDB, dailyReportsDB, editInvoiceDB, editInvoiceDetailsDB, getTodayReportsDB, montlyReportDB } from "./services/service";

export const createInvoice = async (req: Request, res: Response) => {
  try {
    const invoiceData = req.body;

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

export const createService = async (req: Request, res: Response) => {
  try {
    const newService = new Service(req.body);
    const savedService = await newService.save();
    res.status(201).json({ message: "Service created  successfully", data: savedService });
  } catch (err) {
    throw err;
  }
};

export const getInvoice = async (req: Request, res: Response) => {
  try {
    const invoices = await Invoice.find().sort({ invoice_number: -1 });
    res.status(200).json({ message: "Invoices fetched successfully", data: invoices });
  } catch (err) {
    throw err;
  }
};
export const getService = async (req: Request, res: Response) => {
  try {
    const Services = await Service.find();
    res.status(200).json({ message: "sevices fetched successfully", data: Services });
  } catch (err) {
    throw err;
  }
};

export const getInvoiceById = async (req: Request, res: Response) => {
  try {
    const invoiceId = req.params.invoiceId;
    const invoice = await Invoice.findById(invoiceId).populate("items.description");
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

export const deleteInvoiceById = async (req: Request, res: Response) => {
  try {
    const invoiceId = req.params.invoiceId;
    if (invoiceId) {
      await Invoice.findByIdAndDelete(invoiceId);
      res.status(200).json({ message: "Invoice deleted successfully" });
    } else {
      res.status(404).json({ message: "Invoice Not found" });
    }
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

export const getDailyReports = async (req: Request, res: Response) => {
  try {
    const filter = req.body;

    const response = await dailyReportsDB();

    res.status(200).json({
      message: " Daily Report fetched successfully",
      data: response,
    });
  } catch (err) {
    res.status(500).json({ message: "Internal server error", error: err });
  }
};

export const getMonthlyReports = async (req: Request, res: Response) => {
  try {
    const filter = req.body;

    const response = await montlyReportDB(filter);

    res.status(200).json({
      message: " Monthly Report fetched successfully",
      data: response,
    });
  } catch (err) {
    res.status(500).json({ message: "Internal server error", error: err });
  }
};

export const getTodayReports = async (req: Request, res: Response) => {
  try {
    const response = await getTodayReportsDB();
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
