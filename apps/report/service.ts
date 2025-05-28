import Invoice from "./models/invoiceSchema";

export const dailyReportsDB = async (req: any) => {
  const result = await Invoice.aggregate([
    {
      $unwind: "$items",
    },
    {
      $project: {
        date: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
        invoiceId: "$_id",
        itemProfit: { $subtract: ["$items.serviceCharge", "$items.tax"] },
        expense: { $subtract: ["$items.serviceCharge", "$items.tax"] },
        discount: 1,
        grand_total: 1,
      },
    },
    {
      $group: {
        _id: { invoiceId: "$invoiceId", date: "$date" },
        totalItemProfit: { $sum: "$itemProfit" },
        discount: { $first: "$discount" },
        expense: { $first: "$grand_total" },
        date: { $first: "$date" },
      },
    },
    {
      $project: {
        date: 1,
        netProfit: { $subtract: ["$totalItemProfit", "$discount"] },
        totalExpense: { $subtract: ["$expense", "$discount"] },
      },
    },
    {
      $group: {
        _id: "$date",
        totalProfit: { $sum: "$netProfit" },
        expense: { $sum: "$totalExpense" },
      },
    },
    {
      $project: {
        _id: 0,
        date: "$_id",
        profit: "$totalProfit",
        expense: "$expense",
      },
    },
    {
      $sort: { date: -1 },
    },
  ]);

  return result;
};

export const montlyReportDB = async (req: any) => {
  const result = await Invoice.aggregate([
    // 1. Unwind items to calculate per-item profit
    { $unwind: "$items" },

    // 2. Project necessary fields: year, month, and profit
    {
      $project: {
        year: { $year: "$date" },
        month: { $month: "$date" },
        profit: {
          $subtract: ["$items.serviceCharge", "$items.tax"],
        },
        discount: "$discount",
        grand_total: "$grand_total", 
      },
    },

    // 3. Group by year and month
    {
      $group: {
        _id: { year: "$year", month: "$month" },
        totalProfit: { $sum: "$profit" },
        totalDiscount: { $sum: "$discount" },
        totalExpense: { $sum: "$grand_total" },
      },
    },

    // 4. Final projection to format output
    {
      $project: {
        _id: 0,
        year: "$_id.year",
        month: "$_id.month",
        profit: { $subtract: ["$totalProfit", "$totalDiscount"] },
        expense: "$totalExpense",
      },
    },

    // 5. Sort by year and month
    { $sort: { year: 1, month: 1 } },
  ]);

  return result;
};
