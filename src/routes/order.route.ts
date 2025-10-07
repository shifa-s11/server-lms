import express from "express";
import { isAuth,authorizedRoles } from "../middleware/auth";
import { createOrder, getAllOrders } from "../controller/orderController";
import { getOrderAnalytics } from "../controller/analytics.controller";

const orderRouter = express.Router();

orderRouter.post("/create-order",isAuth,createOrder)

orderRouter.get("/get-order",isAuth,authorizedRoles("admin"),getAllOrders)

orderRouter.get("/get-order-analytics",isAuth,authorizedRoles("admin"),getOrderAnalytics)

export default orderRouter