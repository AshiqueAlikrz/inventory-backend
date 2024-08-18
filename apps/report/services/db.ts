// import db from "../../config/db.js";
import db from "../../config/data-source";

export async function getAllReportDB() {
  const sql = "SELECT * FROM hello";
  try {
    const [rows] = await db.query(sql);
    return rows;
  } catch (err) {
    console.error(err);
    throw err;
  }
}

// export async function createReportDB(reportData:any) {
//   const { name, date, invoice, items, subTotal, grandTotal, discount } = reportData;

//   // const {}

//   const sql = `INSERT INTO invoices (name, date, invoice_number, items, sub_total, grand_total, discount)
// VALUES (
//     'Ashique',
//     '2024-08-17',
//     'INV-001',
//     '[{"id": 1, "description": "Item 1", "rate": 100.00, "quantity": 2, "total": 200.00}, {"id": 2, "description": "Item 2", "rate": 50.00, "quantity": 1, "total": 50.00}]',
//     250.00,
//     250.00,
//     0.00
// )`;
//   try {
//     await db.query(sql);
//     return rows;
//   } catch (err) {
//     console.error(err);
//     throw err;
//   }
// }
