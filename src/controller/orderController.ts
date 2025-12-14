// import NotificationModel from './../models/notificationmodel';
// import { CatchAsyncError } from './../middleware/catchAsyncError';
// import { Request, Response, NextFunction } from "express";
// import ErrorHandler from "../utils/ErrorHandler";
// import { Order } from '../models/ordermodel';
// import UserModel from '../models/user.model';
// import CourseModel from '../models/course.model';
// import { getAllOrderService, newOrder } from '../services/order.service';
// import { razorpay } from "../config/razorpay";
// import OrderModel from "../models/ordermodel";
// import crypto from "crypto";
// import sendMail from '../utils/sendMail';
// import { success } from 'zod';
// import { redis } from './../config/redis';
// // create - order

// export const createOrder = CatchAsyncError(async(req:Request,res:Response,next:NextFunction)=>{
//   try {
//     const { courseId, payment_info } = req.body as Order;

//     if (!courseId) {
//       return next(new ErrorHandler("CourseId is required", 400));
//     }
//     const user = await UserModel.findById(req.user?._id);
//     if (!user) {
//       return next(new ErrorHandler("User not found", 404));
//     }
// const courseExistInUser = user.courses?.some(
//   (c: any) => c && c._id.toString() === courseId
// );

//     if (courseExistInUser) {
//       return next(new ErrorHandler("You have already purchased the course", 400));
//     }

//     const course = await CourseModel.findById(courseId);
//     if (!course) {
//       return next(new ErrorHandler("Course not found", 404));
//     }

//     const data:any = {
//       courseId: course._id,
//       userId: user._id,
//       payment_info,
//     };
//     const order = await newOrder(data);  // fixed service

//     // send mail data
//     const mailData = {
//       order:{
//         _id: course?._id.toString().slice(0,6),
//         name: course.name,
//         price: course.price,
//         date: new Date().toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'}),
//       }
//     };

//     try {
//       await sendMail({
//         email: user.email,
//         subject: "Order-Confirmation",
//         template: "successfulOrder-mail.ejs",
//         data: mailData,
//       });
//     } catch(err:any) {
//       return next(new ErrorHandler(err.message, 500));
//     }

//     user.courses.push(course._id);
//     await user.save();

//     await NotificationModel.create({
//       user: user._id,
//       title: "New Order",
//       message: `You have a new order for ${course.name}`
//     });
// await CourseModel.findByIdAndUpdate(courseId, { $inc: { purchased: 1 } });
// await course.save();
//     res.status(201).json({
//       success: true,
//       order,
//     });

//   } catch (err:any) {
//     return next(new ErrorHandler(err.message,500));
//   }
// });

// // get all orders
// export const getAllOrders = CatchAsyncError(
//   async (req: Request, res: Response, next: NextFunction) => {try{
// getAllOrderService(res);
//   }catch (error: any) {
//       return next(new ErrorHandler(error.message, 500));
//     }})

// export const createRazorOrder = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
//   try {
//     const { courseId } = req.body;
//    console.log()
//     const user = await UserModel.findById(req.user?._id);
//     const course = await CourseModel.findById(courseId);

//     if (!course) return next(new ErrorHandler("Course not found", 404));

//     const amount = Math.round(course.price * 100); // convert to paise

//     // Create local pending order
//     const localOrder = await OrderModel.create({
//       courseId,
//       userId: user?._id,
//       amount,
//       currency: "INR",
//       status: "pending",
//     });

//     const razorOrder = await razorpay.orders.create({
//       amount,
//       currency: "INR",
//       receipt: String(localOrder._id),
//     });

//     await OrderModel.findByIdAndUpdate(localOrder._id, {
//       razorpayOrderId: razorOrder.id,
//     });

//     res.status(200).json({
//       success: true,
//       orderId: razorOrder.id,
//       amount,
//       currency: "INR",
//       key: process.env.RAZOR_TEST_API_KEY,
//       localOrderId: localOrder._id,
//     });
//   } catch (err) {
//     next(new ErrorHandler(err.message, 500));
//   }
// });

// export const verifyRazorPayment = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
//   const { razorpay_order_id, razorpay_payment_id, razorpay_signature, localOrderId } = req.body;

//   const body = razorpay_order_id + "|" + razorpay_payment_id;

//   const expectedSignature = crypto
//     .createHmac("sha256", process.env.RAZOR_TEST_SECRET!)
//     .update(body)
//     .digest("hex");

//   if (expectedSignature !== razorpay_signature) {
//     await OrderModel.findByIdAndUpdate(localOrderId, { status: "failed" });
//     return next(new ErrorHandler("Payment verification failed", 400));
//   }

//   // Update order to PAID
//   const order = await OrderModel.findByIdAndUpdate(
//     localOrderId,
//     {
//       status: "paid",
//       razorpayPaymentId: razorpay_payment_id,
//       payment_info: { razorpay_order_id, razorpay_payment_id },
//     },
//     { new: true }
//   );

//   if (!order) {
//     return next(new ErrorHandler("Order not found after payment", 404));
//   }

//   // Validate IDs
//   if (!order.userId || !order.courseId) {
//     return next(new ErrorHandler("Invalid order data", 400));
//   }

//   const user = await UserModel.findById(order.userId);
//   const course = await CourseModel.findById(order.courseId);

//   if (!user || !course) {
//     return next(new ErrorHandler("User or Course not found", 404));
//   }

//   // Grant access safely
//   if (!user.courses.includes(course._id.toString())) {
//     user.courses.push(course._id.toString());
//     await user.save();

//     await CourseModel.findByIdAndUpdate(course._id, { $inc: { purchased: 1 } });
//   }
// await redis.set(String(user._id), JSON.stringify(user));
//   res.status(200).json({
//     success: true,
//     message: "Payment Verified Successfully",
//     order,
//   });
// });


import { CatchAsyncError } from "../middleware/catchAsyncError";
import { Request, Response, NextFunction } from "express";
import ErrorHandler from "../utils/ErrorHandler";
import UserModel from "../models/user.model";
import CourseModel from "../models/course.model";
import OrderModel from "../models/ordermodel";
import { razorpay } from "../config/razorpay";
import crypto from "crypto";
import { processSuccessfulOrder, getAllOrderService } from "../services/order.service";


// ADMIN: Get All Orders

export const getAllOrders = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const orders = await getAllOrderService();
      res.status(200).json({ success: true, orders });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// 1️⃣ CREATE RAZORPAY ORDER

export const createRazorOrder = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { courseId } = req.body;

      const user = await UserModel.findById(req.user?._id);
      const course = await CourseModel.findById(courseId);

      if (!user) return next(new ErrorHandler("User not found", 404));
      if (!course) return next(new ErrorHandler("Course not found", 404));

      // Prevent re-purchase
      const alreadyBought = user.courses.some(
        (c: any) => c?.toString() === courseId.toString()
      );
      if (alreadyBought) {
        return next(new ErrorHandler("You already purchased this course", 400));
      }

      const amount = Math.round(course.price * 100); // Price in paise

      // Create a pending local order
      const localOrder = await OrderModel.create({
        courseId,
        userId: user._id,
        amount,
        currency: "INR",
        status: "pending",
      });

      // Create Razorpay order
      const razorOrder = await razorpay.orders.create({
        amount,
        currency: "INR",
        receipt: String(localOrder._id),
      });

      // Save Razorpay order ID
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
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);


// 2️⃣ VERIFY PAYMENT

// export const verifyRazorPayment = CatchAsyncError(
//   async (req: Request, res: Response, next: NextFunction) => {
//     const { razorpay_order_id, razorpay_payment_id, razorpay_signature, localOrderId } =
//       req.body;

//     // Validate required fields
//     if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
//       return next(new ErrorHandler("Invalid payment data", 400));
//     }

//     // Signature check
//     const body = razorpay_order_id + "|" + razorpay_payment_id;

//     const expectedSignature = crypto
//       .createHmac("sha256", process.env.RAZOR_TEST_SECRET!)
//       .update(body)
//       .digest("hex");

//     if (expectedSignature !== razorpay_signature) {
//       await OrderModel.findByIdAndUpdate(localOrderId, { status: "failed" });
//       return next(new ErrorHandler("Payment verification failed", 400));
//     }

//     // Get pending order
//     const localOrder = await OrderModel.findById(localOrderId);
//     if (!localOrder) return next(new ErrorHandler("Order not found", 404));

//     // Now finalize order using the service layer
//     const finalOrder = await processSuccessfulOrder(
//       localOrder.userId,
//       localOrder.courseId,
//       {
//         razorpay_order_id,
//         razorpay_payment_id,
//       }
//     );

//     // Update order status in DB
//     await OrderModel.findByIdAndUpdate(localOrderId, {
//       status: "paid",
//       razorpayPaymentId: razorpay_payment_id,
//     });

//     res.status(200).json({
//       success: true,
//       message: "Payment Verified Successfully",
//       order: finalOrder,
//     });
//   }
// );


// export const verifyRazorPayment = CatchAsyncError(
//   async (req: Request, res: Response, next: NextFunction) => {
//     const {
//       razorpay_order_id,
//       razorpay_payment_id,
//       razorpay_signature,
//       localOrderId,
//     } = req.body;

//     if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
//       return next(new ErrorHandler("Invalid payment data", 400));
//     }

//     const payload = razorpay_order_id + "|" + razorpay_payment_id;
//     const expectedSignature = crypto
//       .createHmac("sha256", process.env.RAZOR_TEST_SECRET || "")
//       .update(payload)
//       .digest("hex");


//     if (expectedSignature !== razorpay_signature) {
//       if (localOrderId) {
//         await OrderModel.findByIdAndUpdate(localOrderId, { status: "failed" });
//       }
//       return next(new ErrorHandler("Payment verification failed", 400));
//     }


//     const localOrder = await OrderModel.findById(localOrderId);
//     if (!localOrder) {
//       console.error("Local order not found:", localOrderId);
//       return next(new ErrorHandler("Order not found", 404));
//     }

//     try {
//       const finalOrder = await processSuccessfulOrder(
//         String(localOrder.userId),
//         String(localOrder.courseId),
//         {
//           razorpay_order_id,
//           razorpay_payment_id,
//         },
//       );

//       res.status(200).json({
//         success: true,
//         message: "Payment Verified Successfully",
//         order: finalOrder,
//       });
//     } catch (err: any) {
//       console.error("Error finalizing order:", err);
//       return next(new ErrorHandler(err.message || "Order finalization failed", 500));
//     }
//   }
// );

export const verifyRazorPayment = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    console.log("🔵 VERIFY PAYMENT API HIT");
    console.log("📦 Request Body:", req.body);

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      localOrderId,
    } = req.body;

    // 1️⃣ Validate payload
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      console.error("❌ Missing Razorpay fields");
      return next(new ErrorHandler("Invalid payment data", 400));
    }

    // 2️⃣ Verify signature
    const payload = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZOR_TEST_SECRET || "")
      .update(payload)
      .digest("hex");

    console.log("🧾 Expected Signature:", expectedSignature);
    console.log("🧾 Razorpay Signature:", razorpay_signature);

    if (expectedSignature !== razorpay_signature) {
      console.error("❌ Signature mismatch");

      if (localOrderId) {
        await OrderModel.findByIdAndUpdate(localOrderId, { status: "failed" });
        console.log("⚠️ Order marked as FAILED:", localOrderId);
      }

      return next(new ErrorHandler("Payment verification failed", 400));
    }

    console.log("✅ Signature verified successfully");

    // 3️⃣ Fetch local order
    console.log("🔍 Fetching local order:", localOrderId);
    const localOrder = await OrderModel.findById(localOrderId);

    if (!localOrder) {
      console.error("❌ Local order NOT FOUND:", localOrderId);
      return next(new ErrorHandler("Order not found", 404));
    }

    console.log("✅ Local order found:", {
      id: localOrder._id,
      status: localOrder.status,
      userId: localOrder.userId,
      courseId: localOrder.courseId,
    });

    // 4️⃣ Prevent double processing (VERY IMPORTANT)
    if (localOrder.status === "paid") {
      console.warn("⚠️ Order already marked as PAID:", localOrderId);
      return res.status(200).json({
        success: true,
        message: "Payment already verified",
        order: localOrder,
      });
    }

    try {
      console.log("🚀 Finalizing order via service");

      const finalOrder = await processSuccessfulOrder(
        String(localOrder.userId),
        String(localOrder.courseId),
        {
          razorpay_order_id,
          razorpay_payment_id,
        }
      );

      console.log("✅ Order finalized successfully");

      // 5️⃣ Mark order as paid (AFTER service success)
      await OrderModel.findByIdAndUpdate(localOrderId, {
        status: "paid",
        razorpayPaymentId: razorpay_payment_id,
      });

      console.log("💾 Order marked as PAID in DB");

      res.status(200).json({
        success: true,
        message: "Payment Verified Successfully",
        order: finalOrder,
      });

    } catch (err: any) {
      console.error("🔥 ERROR DURING ORDER FINALIZATION");
      console.error(err);

      return next(
        new ErrorHandler(err.message || "Order finalization failed", 500)
      );
    }
  }
);
