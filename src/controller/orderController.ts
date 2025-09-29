import NotificationModel from './../models/notificationmodel';
import { CatchAsyncError } from './../middleware/catchAsyncError';
import { Request, Response, NextFunction } from "express";
import ErrorHandler from "../utils/ErrorHandler";
import { Order } from '../models/ordermodel';
import UserModel from '../models/user.model';
import CourseModel from '../models/course.model';
import { getAllOrderService, newOrder } from '../services/order.service';
import ejs from "ejs";
import path from "path";
import sendMail from '../utils/sendMail';
import { success } from 'zod';

// create - order

export const createOrder = CatchAsyncError(async(req:Request,res:Response,next:NextFunction)=>{
  try {
    const { courseId, payment_info } = req.body as Order;

    if (!courseId) {
      return next(new ErrorHandler("CourseId is required", 400));
    }
    const user = await UserModel.findById(req.user?._id);
    if (!user) {
      return next(new ErrorHandler("User not found", 404));
    }
const courseExistInUser = user.courses?.some(
  (c: any) => c && c._id.toString() === courseId
);

    if (courseExistInUser) {
      return next(new ErrorHandler("You have already purchased the course", 400));
    }

    const course = await CourseModel.findById(courseId);
    if (!course) {
      return next(new ErrorHandler("Course not found", 404));
    }

    const data:any = {
      courseId: course._id,
      userId: user._id,
      payment_info,
    };
    const order = await newOrder(data);  // fixed service

    // send mail data
    const mailData = {
      order:{
        _id: course?._id.toString().slice(0,6),
        name: course.name,
        price: course.price,
        date: new Date().toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'}),
      }
    };

    try {
      await sendMail({
        email: user.email,
        subject: "Order-Confirmation",
        template: "successfulOrder-mail.ejs",
        data: mailData,
      });
    } catch(err:any) {
      return next(new ErrorHandler(err.message, 500));
    }

    user.courses.push(course._id);
    await user.save();

    await NotificationModel.create({
      user: user._id,
      title: "New Order",
      message: `You have a new order for ${course.name}`
    });
await CourseModel.findByIdAndUpdate(courseId, { $inc: { purchased: 1 } });
await course.save();
    res.status(201).json({
      success: true,
      order,
    });

  } catch (err:any) {
    return next(new ErrorHandler(err.message,500));
  }
});

// get all orders
export const getAllOrders = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {try{
getAllOrderService(res);
  }catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }})
