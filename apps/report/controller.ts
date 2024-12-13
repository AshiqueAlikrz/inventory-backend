import { Request, Response } from "express";
import Invoice from "./models/invoiceSchema";
import Service from "./models/serviceSchema";
import Customer from "./models/customerSchema";

export const createInvoice = async (req: Request, res: Response) => {
  try {
    const invoiceData = req.body;
    const lastInvoice = await Invoice.findOne().sort({ invoice_number: -1 }); // Sort by invoice_number in descending order
    const invoiceNumber = (lastInvoice?.invoice_number ?? 0) + 1;
    let customer = await Customer.findOne({ name: invoiceData.name });
    if (!customer) {
      customer = new Customer({ name: invoiceData.name });
      await customer.save();
    }
    const newInvoiceData = {
      ...invoiceData,
      invoice_number: invoiceNumber,
    };
    const newInvoice = new Invoice(newInvoiceData);
    const savedInvoice = await newInvoice.save();
    res.status(201).json({
      message: customer ? "Invoice created successfully" : "Invoice created and new customer added successfully",
      data: savedInvoice,
    });
  } catch (error) {
    res.status(500).json({ message: "Error creating invoice", error });
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
    const invoices = await Invoice.find();
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
export const getInvoiceItems = async (req: Request, res: Response) => {
  try {
    const invoiceId = req.params.invoiceId;
    const invoice = await Invoice.findById({ _id: invoiceId });
    res.status(200).json({ message: "invoice items fetched successfully", data: invoice?.items });
  } catch (err) {
    throw err;
  }
};

// export const createCustomer = async (req: Request, res: Response) => {
//   try {
//     const newCustomer = new Customer(req.body);
//     const savedCustomer = await newCustomer.save();
//     res.status(201).json({ message: "Customer created successfully", data: savedCustomer });
//   } catch (err) {
//     throw err;
//   }
// };
