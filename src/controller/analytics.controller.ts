import { CatchAsyncError } from './../middleware/catchAsyncError';
import { Request, Response, NextFunction } from "express";
import ErrorHandler from "../utils/ErrorHandler";
import { generateLast12MonthsData } from '../utils/analytics';
import UserModel from '../models/user.model';
import { success } from 'zod';
import CourseModel from '../models/course.model';
import OrderModel from '../models/ordermodel';

// user analytics
export const getUserAnalytics = 
CatchAsyncError(async(req:Request,res:Response,next:NextFunction)=>{
  try {
    const users = await generateLast12MonthsData(UserModel);
    res.status(200).json({
        success:true,
        users
    })
  }
  catch (err:any) {
    return next(new ErrorHandler(err.message,500));
  }})

  export const getCourseAnalytics = 
CatchAsyncError(async(req:Request,res:Response,next:NextFunction)=>{
  try {
    const courses = await generateLast12MonthsData(CourseModel);
    res.status(200).json({
        success:true,
        courses
    })
  }
  catch (err:any) {
    return next(new ErrorHandler(err.message,500));
  }})

  //order-analytics
    export const getOrderAnalytics = 
CatchAsyncError(async(req:Request,res:Response,next:NextFunction)=>{
  try {
    const order = await generateLast12MonthsData(OrderModel);
    res.status(200).json({
        success:true,
        order
    })
  }
  catch (err:any) {
    return next(new ErrorHandler(err.message,500));
  }})