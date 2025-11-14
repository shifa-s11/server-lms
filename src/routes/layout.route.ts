import express from "express";
import { isAuth, authorizedRoles } from "../middleware/auth";
import { createLayout, editLayout, getLayoutByType } from "../controller/layout.controller";
import { updateAccessToken } from "../controller/user.controller";
const layoutRouter = express.Router();

layoutRouter.post("/create-layout", updateAccessToken, isAuth, authorizedRoles("admin"), createLayout)

layoutRouter.put("/edit-layout", updateAccessToken, isAuth, authorizedRoles("admin"), editLayout)

layoutRouter.get("/get-layout", updateAccessToken, isAuth, getLayoutByType)

export default layoutRouter
