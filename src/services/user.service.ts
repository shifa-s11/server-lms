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

 export const updateUserRoleService = async(res:Response,id:string,role:string) => {
    const user = await UserModel.findByIdAndUpdate(id,{role},{new:true});
    res.status(201).json({
        success:true,
        user
    })
 }