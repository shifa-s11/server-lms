
require('dotenv').config();
import { Response, NextFunction, Request } from 'express'
import { User } from '../models/user.model';
import { redis } from '../config/redis'
import { CatchAsyncError } from '../middleware/catchAsyncError';

interface Token {
    expires: Date,
    maxAge: number,
    httpOnly: boolean,
    sameSite: 'lax' | 'strict' | 'none' | undefined,
    secure?: boolean,
    path: string
}
export const accessTokenExpire = parseInt(process.env.ACCESS_TOKEN_EXPIRE || '5', 10)
const refreshTokenExpire = parseInt(process.env.REFRESH_TOKEN_EXPIRE || '3', 10)

export const accessTokenOpt: Token = {
    expires: new Date(Date.now() + accessTokenExpire * 60 * 1000),
    maxAge: accessTokenExpire * 60 * 1000,
    httpOnly: true,
    sameSite: 'lax',
    path: "/",
}
export const RefreshTokenOpt: Token = {
    expires: new Date(Date.now() + refreshTokenExpire * 60 * 60 * 24 * 1000),
    maxAge: refreshTokenExpire * 60 * 60 * 24 * 1000,
    httpOnly: true,
    sameSite: 'lax',
    path: "/",
}
export const sendToken = (user: User, statusCode: number, res: Response) => {

  redis.set((user._id as any).toString(), JSON.stringify(user));


    const accessToken = user.signAccessToken();
    const refreshToken = user.signRefreshToken();


    if (process.env.NODE_ENV === 'production') {
        accessTokenOpt.secure = true;
    }
    res.cookie("access_token", accessToken, accessTokenOpt);
    res.cookie('refresh_token', refreshToken, RefreshTokenOpt)

    res.status(statusCode).json({
        success: true,
        accessToken,
        user
    })
}

