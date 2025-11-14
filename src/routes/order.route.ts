import express from "express";
import { isAuth, authorizedRoles } from "../middleware/auth";
import { createOrder, getAllOrders } from "../controller/orderController";
import { getOrderAnalytics } from "../controller/analytics.controller";
import { updateAccessToken } from "../controller/user.controller";
const orderRouter = express.Router();

orderRouter.post("/create-order", updateAccessToken, isAuth, createOrder)

orderRouter.get("/get-order", updateAccessToken, isAuth, authorizedRoles("admin"), getAllOrders)

orderRouter.get("/get-order-analytics", updateAccessToken, isAuth, authorizedRoles("admin"), getOrderAnalytics)

export default orderRouter