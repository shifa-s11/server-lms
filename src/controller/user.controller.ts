import { registrationSchema } from './../validators/user';
import { Request, Response, NextFunction } from "express";
import userModel,{User} from "../models/user.model";
import ErrorHandler from "../config/ErrorHandler";
import { CatchAsyncError } from "../middleware/catchAsyncError";
import jwt, { Secret } from "jsonwebtoken";
import sendMail from "../config/sendMail";



require("dotenv").config();

interface RegistrationRequest {
  name: string;
  email: string;
  password: string;
  avatar?: string;
}

interface ActivationTok {
  token: string;
  activationCode: string;
}

export const registrationUser = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsedData = registrationSchema.safeParse(req.body);
      
        if (!parsedData.success) {
           const messages = parsedData.error.issues[0].message;
        return next(new ErrorHandler(messages, 400));
      }

      const { name, email, password } = parsedData.data;

      const isEmailExist = await userModel.findOne({ email });
      if (isEmailExist) {
        return next(new ErrorHandler("Email already exists", 400));
      }

      const user: RegistrationRequest = { name, email, password };
      const activationToken = createActivationToken(user);
      const activationCode = activationToken.activationCode;

      const data = { user: { name: user.name }, activationCode };

      await sendMail({
        email: user.email,
        subject: "Activate your account",
        template: "activation-mail.ejs",
        data,
      });

      res.status(201).json({
        success: true,
        message: `Activation email sent to ${user.email}`,
        activationToken: activationToken.token, 
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

export const createActivationToken = (
  user: RegistrationRequest
): ActivationTok => {
  const activationCode = Math.floor(1000 + Math.random() * 9000).toString();
  const token = jwt.sign(
    { user, activationCode },
    process.env.ACTIVATION_TOKEN_SECRET as Secret,
    { expiresIn: "10m" }
  );
  return { token, activationCode };
};

// activate user 
interface ActivationRequest {
  activation_token: string;
  activation_code: string;
}

export const activateUser = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { activation_token, activation_code } = req.body as ActivationRequest;

      const decoded = jwt.verify(
        activation_token,
        process.env.ACTIVATION_TOKEN_SECRET as string
      ) as { user: User; activationCode: string };

      if (decoded.activationCode !== activation_code) {
        return next(new ErrorHandler("Invalid activation code", 400));
      }
      const {name,email,password} = decoded.user;
      const existUser = await userModel.findOne({email});if(existUser){
        return next((new ErrorHandler('Email already exist',400)))
      }
      const newUser = await userModel.create({
        name,
        email,
        password
      })
      res.status(201).json({
        success:true,
        message:"Account activated successfully"
      })
    }catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// login 

interface LoginRequest{
  email: string,
  password:string,
}

export const loginUser = CatchAsyncError(
  async(req:Request,res:Response,next:NextFunction) => {
    try{
const {email,password} =req.body as LoginRequest
if(!email || !password){
  return next (new ErrorHandler("Please enter email and password",400));
}
const user = await userModel.findOne({email}).select("+password");
if(!user){
   return next (new ErrorHandler('Invalid email or password',400))
}
const isPassword = await user.comparePassword(password);
if(!isPassword){
  return next (new ErrorHandler('Invalid email or password',400))
}
    }catch(error:any){
      return next (new ErrorHandler(error.message,400))
    }
  }
)