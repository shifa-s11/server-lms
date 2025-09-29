import OrderModel from "../models/ordermodel";
import { Response } from "express";

export const newOrder = async (data:any) => {
  return await OrderModel.create(data);
};

 export const getAllOrderService = async(res:Response)=>{
    const orders= await OrderModel.find().sort({createdAt:-1});
    res.status(201).json({
        success:true,
        orders
    })
 }