export type BillingItem = {
  description: string;
  rate: number;
  quantity: number;
  total: number;
};

export type billingaReportData = {
  name: string;
  date?: string;
  invoice: string;
  items: BillingItem[];
  subTotal: number;
  discount?: number;
  grandTotal: number;
};
