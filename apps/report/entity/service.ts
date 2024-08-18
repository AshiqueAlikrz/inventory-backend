import { EntitySchema } from "typeorm";

export default new EntitySchema({
  name: "Service",
  tableName: "Services",
  columns: {
    id: {
      primary: true,
      type: "int",
      generated: true,
    },
    item_name: {
      type: "varchar",
      length: 255,
    },
    amount: {
      type: "decimal",
      precision: 10,
      scale: 2,
    },
  },
});
