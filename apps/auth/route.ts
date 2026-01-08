import { Router } from "express";

import { getAllCompanies, signIn, signUp } from "./controller";

const authRouter = Router();

authRouter.post("/signup", signUp);
authRouter.post("/signin", signIn);
authRouter.get("/allcompany", getAllCompanies);

export default authRouter;
