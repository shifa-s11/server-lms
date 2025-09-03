import { NextFunction,Request,Response } from 'express';
import ErrorHandler from "../config/ErrorHandler";

export const errorMid = (err:any,req:Request,res:Response,next:NextFunction)=>{
err.statusCode = err.statusCode ||500;
err.message = err.message || 'Internal Server Error'

if(err.name ==='CastError'){
    const message = `Resouces not found Invalid:$(err.path)`
    err = new ErrorHandler(message,400)
}
if(err.code ===11000){
const message = `Duplicate $(Object.keys(err.keyValue)) Entered`;
err = new ErrorHandler(message,400)
}
if (err.name === "TokenExpiredError") {
  const message = "Your token has expired, please login again";
  err = new ErrorHandler(message, 401);
}

if (err.name === "JsonWebTokenError") {
  const message = "Invalid token, please try again";
  err = new ErrorHandler(message, 401);
}
res.status(err.statusCode).json({
    sucess:false,
    message : err.message
})
}