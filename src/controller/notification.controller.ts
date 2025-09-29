import NotificationModel from "../models/notificationmodel";
import { CatchAsyncError } from './../middleware/catchAsyncError';
import { Request, Response, NextFunction } from "express";
import ErrorHandler from "../utils/ErrorHandler";
import cron from 'node-cron';


// get all notification for admin 
export const getNotification = CatchAsyncError(async(req:Request,res:Response,next:NextFunction)=>{
  try {
    const notifications = await NotificationModel.find().sort({createdAt:-1})

    res.status(200).json({
success:true,
notifications
    })
  }catch(err:any){
        return next(new ErrorHandler(err.message,500));
  }})

  // update notifications 
  export const updateNotificationStatus = CatchAsyncError(async(req:Request,res:Response,next:NextFunction)=>{
  try {
    const notification = await NotificationModel.findById(req.params.id);
    if(!notification){
return next(new ErrorHandler("Notification not found",400));
    }else{
    notification?.status ? notification.status = "read":notification?.status}
    await notification.save();
    const notifications = await NotificationModel.find().sort({createdAt:-1})
        res.status(200).json({
success:true,
notifications
    })
  }catch(err:any){
 return next(new ErrorHandler(err.message,500));
  }})

  //delete notification
  cron.schedule("0 0 0 * * *",async()=>{
    const thirthy = new Date(Date.now()-30*24*60*60*1000);
    await NotificationModel.deleteMany({status:"read",createdAt:{$lt:thirthy}})

  })