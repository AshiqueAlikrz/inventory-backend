import { Router } from "express";
import { createInvoice, getInvoices, getInvoiceById, updateInvoice, deleteInvoice, createService } from "./controller";

const router = Router();

router.post("/createInvoice", createInvoice);
router.post("/createService", createService);
router.get("/getInvoice", getInvoices);
router.get("/:id", getInvoiceById);
router.put("/:id", updateInvoice);
router.delete("/:id", deleteInvoice);

export { router };
