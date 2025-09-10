import express from 'express'
import { editCourse, getAllCourse, getSingleCourse, uploadCourse } from "../controller/course.controller";
import { isAuth,authorizedRoles } from "../middleware/auth";

const courseRouter = express.Router()

courseRouter.post("/create-course",isAuth,authorizedRoles("admin"),uploadCourse)

courseRouter.put("/edit-course/:id",isAuth,authorizedRoles("admin"),editCourse)

courseRouter.get("/get-course/:id",getSingleCourse)
export default courseRouter

courseRouter.get("/get-allCourses/",getAllCourse)
