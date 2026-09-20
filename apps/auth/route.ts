import { Router } from "express";

import { createCompany, getAllCompanies, signIn, signUp } from "./controller";

const authRouter = Router();

authRouter.post("/signup", signUp);
authRouter.post("/signin", signIn);
authRouter.get("/allcompany", getAllCompanies);
authRouter.post("/company", createCompany);

export default authRouter;
