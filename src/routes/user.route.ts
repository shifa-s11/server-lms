import express from 'express'
import { registrationUser,activateUser } from '../controller/user.controller'
const userRouter = express.Router()

userRouter.post('/register',registrationUser);

userRouter.post('/activate',activateUser)

export default userRouter;