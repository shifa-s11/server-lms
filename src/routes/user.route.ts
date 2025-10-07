import { getUserInfo, socialAuth, updateAvatar, updatePassword, updateUserInfo,forgotPassword, resetPassword, verifyResetLink, getAllUsers, deleteUser, updateRole } from './../controller/user.controller';
import { authorizedRoles, isAuth } from './../middleware/auth';
import express from 'express'
import { registrationUser,activateUser, loginUser, logoutUser, updateAccessToken } from '../controller/user.controller'
import { getAllCourse } from '../controller/course.controller';
import { getUserAnalytics } from '../controller/analytics.controller';
const userRouter = express.Router()

userRouter.post('/register',registrationUser);

userRouter.post('/activate',activateUser)

userRouter.post('/login',loginUser)

userRouter.get('/logout',isAuth,logoutUser)

userRouter.get('/refresh',updateAccessToken)

userRouter.get('/me',isAuth,getUserInfo)

userRouter.post('/socialAuth',socialAuth)

userRouter.put('/updateUser',isAuth,updateUserInfo)

userRouter.put('/updatePassword',isAuth,updatePassword)

userRouter.put('/updateAvatar',isAuth,updateAvatar)

userRouter.post('/forgot',forgotPassword);

userRouter.post("/reset-password/:id/:token", resetPassword);

userRouter.get("/reset-password/:id/:token", verifyResetLink);

userRouter.get("/get-users",isAuth,authorizedRoles("admin"),getAllUsers)

userRouter.put("/update-user-role",isAuth,authorizedRoles("admin"),updateRole)

userRouter.delete("/delete-user/:id",isAuth,authorizedRoles("admin"),deleteUser)

//analytics route 
userRouter.get("/get-user-analytics",isAuth,authorizedRoles("admin"),getUserAnalytics)

export default userRouter;
