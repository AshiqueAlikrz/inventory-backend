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
  editInvoiceItems,
  editInvoiceDetails,
  updateService,
  deleteService,
  createQuotation,
  getQuotations,
  getQuotationById,
  sendInvoiceEmail,
  getCustomers,
  createCustomer,
  createProforma,
  getProformas,
  getProformaById,
  convertProforma,
} from "./controller";
import { authenticateToken } from "../utils/authMiddleware";
// import { authMiddleware } from "../utils/authMiddleware";

const reportRouter = Router();
reportRouter.use(authenticateToken);

reportRouter.post("/createInvoice", createInvoice);
reportRouter.post("/createService", createService);
reportRouter.get("/getInvoice", getInvoice);
reportRouter.get("/getService", getService);
reportRouter.get("/items/:invoiceId", getInvoiceItems);
reportRouter.get("/invoice/:invoiceId", getInvoiceById);
reportRouter.get("/getCustomer", getCustomerByName);
reportRouter.get("/customers", getCustomers);
reportRouter.get("/proformas", getProformas);
reportRouter.post("/proformas", createProforma);
reportRouter.get("/proformas/:proformaId", getProformaById);
reportRouter.post("/proformas/:proformaId/convert", convertProforma);
reportRouter.post("/customers", createCustomer);
reportRouter.get("/filterReport", getFilterReport);
reportRouter.delete("/invoice/:invoiceId", deleteInvoiceById);
reportRouter.put("/invoice/:invoiceId", updateInvoiceById);
reportRouter.get("/lastReport", getLastInvoice);
reportRouter.get("/dailyreports", getDailyReports);
reportRouter.get("/monthlyreports", getMonthlyReports);
reportRouter.get("/dashboardreports", getTodayReports);
reportRouter.put("/editinvoice/:invoiceId/item/:itemId", editInvoiceItems);
reportRouter.patch("/editinvoice/:invoiceId", editInvoiceDetails);
reportRouter.patch("/editservice/:serviceId", updateService);
reportRouter.delete("/deleteservice/:serviceId", deleteService);
reportRouter.post("/createquotation", createQuotation);
reportRouter.get("/quotations", getQuotations);
reportRouter.get("/quotation/:quotationId", getQuotationById);
reportRouter.post("/invoice/:invoiceId/send-email", sendInvoiceEmail);
// reportRouter.delete("/deleteservice/:serviceId", getQuotitions);
// reportRouter.get("/:id", getInvoiceById);
// reportRouter.get("/:id", getInvoiceById);
// router.put("/:id", updateInvoice);
// router.delete("/:id", deleteInvoice);

export default reportRouter;
