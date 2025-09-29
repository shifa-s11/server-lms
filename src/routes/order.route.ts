import express from "express";
import { isAuth,authorizedRoles } from "../middleware/auth";
import { createOrder, getAllOrders } from "../controller/orderController";

const orderRouter = express.Router();

orderRouter.post("/create-order",isAuth,createOrder)

orderRouter.get("/get-order",isAuth,authorizedRoles("admin"),getAllOrders)

export default orderRouter