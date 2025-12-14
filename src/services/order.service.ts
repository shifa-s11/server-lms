
import OrderModel from "../models/ordermodel";
import UserModel from "../models/user.model";
import CourseModel from "../models/course.model";
import NotificationModel from "../models/notificationmodel";
import sendMail from "../utils/sendMail";
import { redis } from "../config/redis";
import mongoose from "mongoose";
interface PaymentInfo {
  razorpay_order_id: string;
  razorpay_payment_id: string;
}

export const newOrder = async (data: any) => {
  return await OrderModel.create(data);
};

export const getAllOrderService = async () => {
  return await OrderModel.find().sort({ createdAt: -1 });
};

export const processSuccessfulOrder = async (
  userId: string,
  courseId: string,
  paymentInfo: PaymentInfo,
  localOrderId?: string
) => {
  const user = await UserModel.findById(userId);
  const course = await CourseModel.findById(courseId);
  //  const courseObjectId = new mongoose.Types.ObjectId(courseId);

  if (!user || !course) throw new Error("User or Course not found");

  // Prevent duplicate access
  const alreadyPurchased = user.courses.some(
    (c: any) => c?.toString() === courseId.toString()
  );

  if (!alreadyPurchased) {
    user.courses.push(courseId);
    await user.save();

    await CourseModel.findByIdAndUpdate(courseId, {
      $inc: { purchased: 1 },
    });
  }
let order
  if (localOrderId) {
    order = await OrderModel.findByIdAndUpdate(
      localOrderId,
      {
        status: "paid",
        payment_info: paymentInfo,
        razorpayPaymentId: paymentInfo.razorpay_payment_id,
      },
      { new: true }
    );
  } else {
    // fallback only if NO localOrderId
    order = await OrderModel.create({
      courseId,
      userId,
      payment_info: paymentInfo,
      status: "paid",
      amount: course.price * 100, 
      currency: "INR"
    });
  }





  // Prepare email data
  const mailData = {
    order: {
          _id: (course._id as mongoose.Types.ObjectId)
        .toString()
        .slice(0, 6),  
      name: course.name,
      price: course.price,
      date: new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
    },
  };

  // Send email
  try{
  await sendMail({
    email: user.email,
    subject: "Order Confirmation",
    template: "successfulOrder-mail.ejs",
    data: mailData,
  });
  }catch (err) {
  console.error("❌ Error while sending email:", err);
}


  // Create notification
  await NotificationModel.create({
    user: userId,
    title: "New Order",
    message: `You have a new order for ${course.name}`,
  });

  // Update Redis cache
  const updatedUser = await UserModel.findById(userId);
  await redis.set(String(userId), JSON.stringify(updatedUser));

  return order;
};
