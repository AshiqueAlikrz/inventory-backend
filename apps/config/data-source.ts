import "reflect-metadata";
import { DataSource } from "typeorm";
import Invoice from "../report/entity/invoice";
import Service from "../report/entity/service";

export const AppDataSource = new DataSource({
  type: "mysql",
  host: "localhost",
  port: 3306,
  username: "root",
  password: "",
  database: "firstproject",
  synchronize: false,
  logging: false,
  entities: [Invoice, Service],
  migrations: [], 
  subscribers: [],
});

AppDataSource.initialize()
  .then(() => {
    console.log("Data Source has been initialized!");
  })
  .catch((err) => {
    console.error("Error during Data Source initialization:", err);
  });
