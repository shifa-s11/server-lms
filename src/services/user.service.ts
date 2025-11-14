import { Response } from "express";
import {redis} from '../config/redis'
import UserModel from "../models/user.model";
import { success } from "zod";
 export const getUserId = async(id:string,res:Response) => {
    const userJ = await redis.get(id)
    if(userJ){
const user = JSON.parse(userJ)
res.status(201).json({
success:true,
user
    })
    }
    
 }

 // Get all users 
 export const getAllUserService = async(res:Response)=>{
    const users = await UserModel.find().sort({createdAt:-1});
    res.status(201).json({
        success:true,
        users
    })
 }

 // update user role

 export const updateUserRoleService = async(res:Response,email:string,role:string) => {
      const user = await UserModel.findOneAndUpdate(
    { email },          
    { role },            
    { new: true }       
  );
    res.status(201).json({
        success:true,
        user
    })
 }