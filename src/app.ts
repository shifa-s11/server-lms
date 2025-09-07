require("dotenv").config();
import express, { NextFunction, Request, Response } from "express";
 export const app = express();
import cors from 'cors'
import cookieParser from 'cookie-parser'
import { errorMid } from "./middleware/error";
import userRouter from "./routes/user.route";

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(cors({
    origin:process.env.ORIGIN
}))

app.use('/api/v1',userRouter)
app.get('/test',(req:Request,res:Response)=>{
res.send("Test route is working!");
})

app.use((req: Request, res: Response, next: NextFunction) => {
  res.status(404).json({ message: `Route ${req.originalUrl} not found` });
});

app.use(errorMid);   