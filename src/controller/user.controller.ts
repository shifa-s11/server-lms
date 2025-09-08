
import { redis } from './../config/redis';
import { accessTokenOpt, RefreshTokenOpt, sendToken } from './../utils/jwt';
import { registrationSchema } from './../validators/user';
import { Request, Response, NextFunction } from "express";
import userModel, { User } from "../models/user.model";
import ErrorHandler from "../utils/ErrorHandler";
import { CatchAsyncError } from "../middleware/catchAsyncError";
import jwt, { JwtPayload, Secret } from "jsonwebtoken";
import sendMail from "../utils/sendMail";
import { getUserId } from '../services/user.service';
import UserModel from '../models/user.model';
import cloudinary from 'cloudinary'
import crypto from "crypto";


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
      const { name, email, password } = decoded.user;
      const existUser = await userModel.findOne({ email }); if (existUser) {
        return next((new ErrorHandler('Email already exist', 400)))
      }
      const newUser = await userModel.create({
        name,
        email,
        password
      })
      res.status(201).json({
        success: true,
        message: "Account activated successfully"
      })
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// login 

interface LoginRequest {
  email: string,
  password: string,
}

export const loginUser = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body as LoginRequest
      if (!email || !password) {
        return next(new ErrorHandler("Please enter email and password", 400));
      }
      const user = await userModel.findOne({ email }).select("+password");
      if (!user) {
        return next(new ErrorHandler('Invalid email or password', 400))
      }
      const isPassword = await user.comparePassword(password);
      if (!isPassword) {
        return next(new ErrorHandler('Invalid email or password', 400))
      }
      sendToken(user, 200, res);
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400))
    }
  }
)

export const logoutUser = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.cookie("access_token", "", { maxAge: 1 });
    res.cookie('refresh_token', "", { maxAge: 1 })
    const key = req.user?._id.toString();
    if (key) {
      await redis.del(key);
    }
    res.status(200).json({
      sucess: true,
      message: 'Logged out successfully'
    })
  } catch (error: any) {
    return next(new ErrorHandler(error.message, 400))
  }
})

export const updateAccessToken = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const refresh_token = req.cookies.refresh_token as string;
    const decoded = jwt.verify(refresh_token, process.env.REFRESH_TOKEN as string) as JwtPayload;
    const message = 'Could not refresh token';
    if (!decoded) {
      return next(new ErrorHandler(message, 400))
    }
    const session = await redis.get(decoded.id as string)
    if (!session) {
      return next(new ErrorHandler(message, 400))
    }
    const user = JSON.parse(session);
    const accessToken = jwt.sign({ id: user._id }, process.env.ACCESS_TOKEN as string, {
      expiresIn: "5m"
    })

    const refreshToken = jwt.sign({ id: user._id }, process.env.REFRESH_TOKEN as string, {
      expiresIn: "7d"
    })
    req.user = user
    res.cookie("access_token", accessToken, accessTokenOpt)
    res.cookie("refresh_token", refreshToken, RefreshTokenOpt)
    res.status(200).json({
      status: "success",
      accessToken,
    })
  } catch (error: any) {
    return next(new ErrorHandler(error.message, 400))
  }
})
//get userInfo
export const getUserInfo = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?._id?.toString();
    await getUserId(userId, res)
  } catch (error: any) {
    return next(new ErrorHandler(error.message, 400))
  }
})
//Social -Auth
interface SocialAuthBody {
  email: string;
  name: string;
  avatar: string;
}

export const socialAuth = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, name, avatar } = req.body as SocialAuthBody
    if (!email || !name) {
      return next(new ErrorHandler("Email and Name are required", 400));
    }
    if (!avatar) {
      return next(new ErrorHandler("Avatar required", 400));
    }
    const user = await UserModel.findOne({ email });
    if (!user) {
      const newUser = await UserModel.create({
        email, name,
        avatar
      })
      sendToken(newUser, 200, res)
    } else {
      sendToken(user, 200, res)
    }
  } catch (error: any) {
    return next(new ErrorHandler(error.message, 400))
  }
})

interface UpdateUser{
  name :string,
  email:string
}

export const updateUserInfo = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
  try{
    const{name,email} = req.body as UpdateUser
const userId = req.user?._id?.toString();
const user = await userModel.findById(userId)
if(email&&user){
  const isEmailExist = await userModel.findOne({email});
  if(isEmailExist){
    return next(new ErrorHandler("Email already exist", 400))
  }
  user.email = email
}
if(name && user){
  user.name = name;
}
await user?.save();
if (!userId) {
  throw new Error("User ID is missing from request");
}
await redis.set(userId, JSON.stringify(user));
res.status(201).json({
  success:true,
  user
})
  }catch (error: any) {
    return next(new ErrorHandler(error.message, 400))
  }
})

//update Password
interface UpdatePasswordBody {
  oldPassword: string;
  newPassword: string;
}
export const updatePassword = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { oldPassword, newPassword } = req.body as UpdatePasswordBody;

      if (!oldPassword || !newPassword) {
        return next(new ErrorHandler("Please provide old and new password", 400));
      }

      const userId = req.user?._id?.toString();
      if (!userId) {
        return next(new ErrorHandler("User not authenticated", 401));
      }

      const user = await userModel.findById(userId).select("+password");
      if (!user) {
        return next(new ErrorHandler("User not found", 404));
      }
if(user?.password===undefined){
  return next(new ErrorHandler("Invalid user", 400));
}
      // compare old password
      const isMatch = await user.comparePassword(oldPassword);
      if (!isMatch) {
        return next(new ErrorHandler("Old password is incorrect", 400));
      }

      user.password = newPassword;
      await user.save();

      await redis.set(userId, JSON.stringify(user.toObject()));

      res.status(200).json({
        success: true,
        message: "Password updated successfully",
        user
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

//update avatar 
interface UpdateAvatarBody {
  avatar: string;
}

export const updateAvatar = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { avatar } = req.body as UpdateAvatarBody;
      const userId = req.user?._id?.toString();

      if (!userId) {
        return next(new ErrorHandler("User not authenticated", 401));
      }

      const user = await userModel.findById(userId);
      if (!user) {
        return next(new ErrorHandler("User not found", 404));
      }

      if (avatar) {
        if (user.avatar?.public_id) {
          await cloudinary.v2.uploader.destroy(user.avatar.public_id);
        }

        // upload new avatar
        const myCloud = await cloudinary.v2.uploader.upload(avatar, {
          folder: "avatar",
          width: 150,
        });

        user.avatar = {
          public_id: myCloud.public_id,
          url: myCloud.secure_url,
        };
      }

      await user.save();
      await redis.set(userId, JSON.stringify(user.toObject()));

      res.status(200).json({
        success: true,
        message: "Avatar updated successfully",
        avatar: user.avatar,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);


//Forgot Password

export const forgotPassword = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email } = req.body;

    if (!email) {
      return next(new ErrorHandler("Please provide email", 400));
    }

    const user = await userModel.findOne({ email });
    if (!user) {
      return next(new ErrorHandler("User not found", 404));
    }

    // generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");

    // store in redis with expiry (10 minutes)
    await redis.set(`reset:${user._id}`, resetToken, { EX: 600 });

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${user._id}/${resetToken}`;

    await sendMail({
      email: user.email,
      subject: "Password Reset Link",
      template: "reset-password.ejs",
      data: { name: user.name, resetUrl },
    });

    res.status(200).json({
      success: true,
      message: `Reset link sent to ${user.email}`,
    });
  }
);
//Verify Link
export const verifyResetLink = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id, token } = req.params;

    // get token from redis
    const storedToken = await redis.get(`reset:${id}`);

    if (!storedToken || storedToken !== token) {
      return next(new ErrorHandler("Invalid or expired reset link", 400));
    }

    res.status(200).json({
      success: true,
      message: "Reset link is valid",
    });
  }
);

// Verify Password
export const resetPassword = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id, token } = req.params;
    const { newPassword } = req.body;

    if (!newPassword) {
      return next(new ErrorHandler("Please provide a new password", 400));
    }

    // get token from redis
    const storedToken = await redis.get(`reset:${id}`);

    if (!storedToken || storedToken !== token) {
      return next(new ErrorHandler("Invalid or expired reset link", 400));
    }

    const user = await userModel.findById(id).select("+password");
    if (!user) {
      return next(new ErrorHandler("User not found", 404));
    }

    user.password = newPassword;
    await user.save();

    // remove token so link can't be reused
    await redis.del(`reset:${id}`);

    res.status(200).json({
      success: true,
      message: "Password has been reset successfully",
    });
  }
);

