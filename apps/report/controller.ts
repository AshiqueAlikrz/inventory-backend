import { Request, Response } from "express";
import { AppDataSource } from "../config/data-source";
import Invoice from "./entity/invoice";
import Service from "./entity/service";

const invoiceRepository = AppDataSource.getRepository(Invoice);
const serviceRepository = AppDataSource.getRepository(Service);

export const createInvoice = async (req: Request, res: Response) => {
  try {
    const newInvoice = invoiceRepository.create(req.body);
    await invoiceRepository.save(newInvoice);
    res.status(201).json({
      success: "invoice created successfully",
      data: newInvoice,
    });
  } catch (error) {
    res.status(500).json({ error });
  }
};

export const createService = async (req: Request, res: Response) => {
  try {
    const newService = serviceRepository.create(req.body);
    await serviceRepository.save(newService);
    res.status(201).json({
      success: "service created successfully",
      data: newService,
    });
  } catch (error) {
    res.status(500).json({ error });
  }
};

export const getInvoices = async (req: Request, res: Response) => {
  try {
    const invoices = await invoiceRepository.find();
    res.status(200).json(invoices);
  } catch (error) {
    res.status(500).json({ error });
  }
};

export const getInvoiceById = async (req: Request, res: Response) => {
  try {
    const invoice = await invoiceRepository.findOneBy({ id: parseInt(req.params.id) });
    if (!invoice) return res.status(404).json({ message: "Invoice not found" });
    res.status(200).json(invoice);
  } catch (error) {
    res.status(500).json({ error });
  }
};

export const updateInvoice = async (req: Request, res: Response) => {
  try {
    const invoice = await invoiceRepository.findOneBy({ id: parseInt(req.params.id) });
    if (!invoice) return res.status(404).json({ message: "Invoice not found" });

    invoiceRepository.merge(invoice, req.body);
    await invoiceRepository.save(invoice);
    res.status(200).json(invoice);
  } catch (error) {
    res.status(500).json({ error });
  }
};

export const deleteInvoice = async (req: Request, res: Response) => {
  try {
    const result = await invoiceRepository.delete(req.params.id);
    if (result.affected === 0) return res.status(404).json({ message: "Invoice not found" });
    res.status(200).json({ message: "Invoice deleted" });
  } catch (error) {
    res.status(500).json({ error: error });
  }
};
