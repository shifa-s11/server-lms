import { getUserInfo, socialAuth } from './../controller/user.controller';
import { authorizedRoles, isAuth } from './../middleware/auth';
import express from 'express'
import { registrationUser,activateUser, loginUser, logoutUser, updateAccessToken } from '../controller/user.controller'
const userRouter = express.Router()

userRouter.post('/register',registrationUser);

userRouter.post('/activate',activateUser)

userRouter.post('/login',loginUser)

userRouter.get('/logout',isAuth,logoutUser)

userRouter.get('/refresh',updateAccessToken)

userRouter.get('/me',isAuth,getUserInfo)

userRouter.post('/socialAuth',socialAuth)

export default userRouter;
