import express, { Express } from "express";
import { router as Report } from "./apps/report/route";
import cors from "cors";

const app: Express = express();

app.use(cors());
app.use(express.json());

app.use("/api/reports", Report);

app.listen(8081, () => {
  console.log("Listening...");
});
