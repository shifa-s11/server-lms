import { Request,Response,NextFunction } from "express";
import { CatchAsyncError
 } from "./catchAsyncError";
import ErrorHandler from "../utils/ErrorHandler";
import  jwt, { JwtPayload }  from "jsonwebtoken";
import { redis } from "../config/redis";

// export const isAuth = CatchAsyncError(
//   async (req: Request, res: Response, next: NextFunction) => {
//     try {
//       const access_token = req.cookies.access_token;
//       if (!access_token) {
//         return next(new ErrorHandler("Please login to access this resource", 401));
//       }

//       const decoded = jwt.verify(
//         access_token,
//         process.env.ACCESS_TOKEN as string
//       ) as JwtPayload;

//       if (!decoded || !decoded.id) {
//         return next(new ErrorHandler("Invalid access token", 401));
//       }

//       const user = await redis.get(decoded.id);
//       if (!user) {
//         return next(new ErrorHandler("Session expired. Please login again.", 401));
//       }

//       req.user = JSON.parse(user);
//       next();

//     } catch (error: any) {
//       return next(new ErrorHandler("Authentication failed: " + error.message, 401));
//     }
//   }
// );

export const isAuth = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const access_token = req.cookies.access_token;

      if (!access_token) {
        return next(new ErrorHandler("Not authenticated", 401));
      }

      let decoded;
      try {
        decoded = jwt.verify(
          access_token,
          process.env.ACCESS_TOKEN as string
        ) as JwtPayload;
      } catch (err) {
        return next(new ErrorHandler("Access token expired", 401));
      }

      const session = await redis.get(decoded.id);
      if (!session) {
        return next(new ErrorHandler("Session expired, login again", 401));
      }

      req.user = JSON.parse(session);
      next();
    } catch (error: any) {
      return next(new ErrorHandler("Authentication failed", 401));
    }
  }
);


      export const authorizedRoles = (...roles:string[]) => {
        return(req:Request,res:Response,next:NextFunction) =>{
          if(!roles.includes(req.user?.role||'')){
            return next(new ErrorHandler(`Role: ${req.user?.role} is not allowed to access this resource`,403))
          }
          next()
        }
      }
