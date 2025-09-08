import { Response } from "express";
import {redis} from '../config/redis'
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