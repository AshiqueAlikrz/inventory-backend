import { Router } from "express";

import { signIn, signUp } from "./controller";
import { getAllCompanies } from "../report/controller";

const authRouter = Router();

authRouter.post("/signup", signUp);
authRouter.post("/signin", signIn);
authRouter.get("/allcompany", getAllCompanies);

export default authRouter;
