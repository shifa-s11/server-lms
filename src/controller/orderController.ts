import NotificationModel from './../models/notificationmodel';
import { CatchAsyncError } from './../middleware/catchAsyncError';
import { Request, Response, NextFunction } from "express";
import ErrorHandler from "../utils/ErrorHandler";
import { Order } from '../models/ordermodel';
import UserModel from '../models/user.model';
import CourseModel from '../models/course.model';
import { getAllOrderService, newOrder } from '../services/order.service';
import { razorpay } from "../config/razorpay";
import OrderModel from "../models/ordermodel";
import crypto from "crypto";
import sendMail from '../utils/sendMail';
import { success } from 'zod';
import { redis } from './../config/redis';
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

export const createRazorOrder = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { courseId } = req.body;
   console.log()
    const user = await UserModel.findById(req.user?._id);
    const course = await CourseModel.findById(courseId);

    if (!course) return next(new ErrorHandler("Course not found", 404));

    const amount = Math.round(course.price * 100); // convert to paise

    // Create local pending order
    const localOrder = await OrderModel.create({
      courseId,
      userId: user?._id,
      amount,
      currency: "INR",
      status: "pending",
    });

    const razorOrder = await razorpay.orders.create({
      amount,
      currency: "INR",
      receipt: String(localOrder._id),
    });

    await OrderModel.findByIdAndUpdate(localOrder._id, {
      razorpayOrderId: razorOrder.id,
    });

    res.status(200).json({
      success: true,
      orderId: razorOrder.id,
      amount,
      currency: "INR",
      key: process.env.RAZOR_TEST_API_KEY,
      localOrderId: localOrder._id,
    });
  } catch (err) {
    next(new ErrorHandler(err.message, 500));
  }
});

export const verifyRazorPayment = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, localOrderId } = req.body;

  const body = razorpay_order_id + "|" + razorpay_payment_id;

  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZOR_TEST_SECRET!)
    .update(body)
    .digest("hex");

  if (expectedSignature !== razorpay_signature) {
    await OrderModel.findByIdAndUpdate(localOrderId, { status: "failed" });
    return next(new ErrorHandler("Payment verification failed", 400));
  }

  // Update order to PAID
  const order = await OrderModel.findByIdAndUpdate(
    localOrderId,
    {
      status: "paid",
      razorpayPaymentId: razorpay_payment_id,
      payment_info: { razorpay_order_id, razorpay_payment_id },
    },
    { new: true }
  );

  if (!order) {
    return next(new ErrorHandler("Order not found after payment", 404));
  }

  // Validate IDs
  if (!order.userId || !order.courseId) {
    return next(new ErrorHandler("Invalid order data", 400));
  }

  const user = await UserModel.findById(order.userId);
  const course = await CourseModel.findById(order.courseId);

  if (!user || !course) {
    return next(new ErrorHandler("User or Course not found", 404));
  }

  // Grant access safely
  if (!user.courses.includes(course._id.toString())) {
    user.courses.push(course._id.toString());
    await user.save();

    await CourseModel.findByIdAndUpdate(course._id, { $inc: { purchased: 1 } });
  }
await redis.set(String(user._id), JSON.stringify(user));
  res.status(200).json({
    success: true,
    message: "Payment Verified Successfully",
    order,
  });
});
