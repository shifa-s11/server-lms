import express from "express";
import { isAuth, authorizedRoles } from "../middleware/auth";
import {  getAllOrders } from "../controller/orderController";
import { getOrderAnalytics } from "../controller/analytics.controller";
import { updateAccessToken } from "../controller/user.controller";
import { createRazorOrder } from "../controller/orderController";
import { verifyRazorPayment } from "../controller/orderController";
const orderRouter = express.Router();

// orderRouter.post("/create-order", updateAccessToken, isAuth, createOrder)

orderRouter.get("/get-order", updateAccessToken, isAuth, authorizedRoles("admin"), getAllOrders)

orderRouter.get("/get-order-analytics", updateAccessToken, isAuth, authorizedRoles("admin"), getOrderAnalytics)

orderRouter.post("/razorpay/create-order",updateAccessToken, isAuth, createRazorOrder);
orderRouter.post("/razorpay/verify-payment", updateAccessToken,isAuth, verifyRazorPayment);


export default orderRouter