import { Response } from "express";
import UserModel
 from "../models/user.model";

 export const getUserId = async(id:string,res:Response) => {
    const user = await UserModel.findById(id);
    res.status(201).json({
success:true,
user
    })
 }