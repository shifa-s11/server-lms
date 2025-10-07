import express from "express";
import { isAuth,authorizedRoles } from "../middleware/auth";
import { createLayout, editLayout, getLayoutByType } from "../controller/layout.controller";

const layoutRouter = express.Router();

layoutRouter.post("/create-layout",isAuth,authorizedRoles("admin"),createLayout)

layoutRouter.put("/edit-layout",isAuth,authorizedRoles("admin"),editLayout)

layoutRouter.get("/get-layout",isAuth,getLayoutByType)

export default layoutRouter
