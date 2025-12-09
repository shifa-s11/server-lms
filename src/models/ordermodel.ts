
// import mongoose,{Document,Schema,Model} from "mongoose";

// export interface Order extends Document {
//     courseId : string,
//     userId:string,
//     payment_info:Object
// }
// const orderSchema = new Schema<Order>({
// courseId:{
//     type:String,
//     required:true,
// },
// userId:{
//      type:String,
//     required:true,
// },
// payment_info:{
//     type:Object
// }
// },{timestamps:true})

// const OrderModel:Model<Order> = mongoose.model('Order',orderSchema)

// export default OrderModel

import mongoose, { Document, Schema, Model } from "mongoose";

export interface Order extends Document {
  courseId: string;
  userId: string;

  amount: number;
  currency: string;

  status: "pending" | "paid" | "failed";

  razorpayOrderId?: string;
  razorpayPaymentId?: string;

  receipt?: string;

  payment_info?: object;
}

const orderSchema = new Schema<Order>(
  {
    courseId: {
      type: String,
      required: true,
    },

    userId: {
      type: String,
      required: true,
    },

    amount: {
      type: Number,
      required: true,
    },

    currency: {
      type: String,
      default: "INR",
    },

    status: {
      type: String,
      enum: ["pending", "paid", "failed"],
      default: "pending",
    },

    razorpayOrderId: {
      type: String,
    },

    razorpayPaymentId: {
      type: String,
    },

    receipt: {
      type: String,
    },

    payment_info: {
      type: Object,
    },
  },
  { timestamps: true }
);

const OrderModel: Model<Order> = mongoose.model("Order", orderSchema);

export default OrderModel;
