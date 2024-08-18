import { EntitySchema } from "typeorm";

export default new EntitySchema({
  name: "Invoice",
  tableName: "invoices",
  columns: {
    id: {
      primary: true,
      type: "int",
      generated: true,
    },
    name: {
      type: "varchar",
      length: 255,
    },
    date: {
      type: "date",
    },
    invoice_number: {
      type: "varchar",
      length: 255,
      unique: true,
    },
    items: {
      type: "json",
    },
    sub_total: {
      type: "decimal",
      precision: 10,
      scale: 2,
    },
    grand_total: {
      type: "decimal",
      precision: 10,
      scale: 2,
    },
    discount: {
      type: "decimal",
      precision: 10,
      scale: 2,
    },
  },
});
