require("dotenv").config();
import express, { NextFunction, Request, Response } from "express";
 export const app = express();
import cors from 'cors'
import cookieParser from 'cookie-parser'
import { errorMid } from "./middleware/error";
import userRouter from "./routes/user.route";
import courseRouter from "./routes/course.route";
import orderRouter from "./routes/order.route";
import notificationRoute from "./routes/notification.route";
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(cors({
    origin:process.env.ORIGIN
}))

app.use('/api/v1',userRouter)
app.use('/api/v1',courseRouter)
app.use('/api/v1',orderRouter)
app.use('/api/v1',notificationRoute)
app.get('/test',(req:Request,res:Response)=>{
res.send("Test route is working!");
})

app.use((req: Request, res: Response, next: NextFunction) => {
  res.status(404).json({ message: `Route ${req.originalUrl} not found` });
});

app.use(errorMid);   