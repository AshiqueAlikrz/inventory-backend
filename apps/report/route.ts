import { Router } from "express";
import {
  createInvoice,
  createService,
  getInvoice,
  getInvoiceItems,
  getService,
  getInvoiceById,
  getCustomerByName,
  getFilterReport,
  deleteInvoiceById,
  updateInvoiceById,
  getLastInvoice,
  getDailyReports,
  getMonthlyReports,
  getTodayReports,
  editInvoice,
} from "./controller";

const router = Router();

router.post("/createInvoice", createInvoice);
router.post("/createService", createService);
router.get("/getInvoice", getInvoice);
router.get("/getService", getService);
router.get("/items/:invoiceId", getInvoiceItems);
router.get("/invoice/:invoiceId", getInvoiceById );
router.get("/getCustomer", getCustomerByName);
router.get("/filterReport", getFilterReport);
router.delete("/invoice/:invoiceId", deleteInvoiceById);
router.put("/invoice/:invoiceId", updateInvoiceById);
router.get("/lastReport", getLastInvoice);
router.get("/dailyreports", getDailyReports);
router.get("/monthlyreports", getMonthlyReports);
router.get("/dashboardreports", getTodayReports);
router.put("/editinvoice/:invoiceId/item/:itemId", editInvoice);
// router.get("/:id", getInvoiceById);  
// router.get("/:id", getInvoiceById);
// router.put("/:id", updateInvoice); 
// router.delete("/:id", deleteInvoice);

export { router };
