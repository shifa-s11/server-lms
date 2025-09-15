import { addAnswer, addQuestion, addReply, addReview, getCourseByUser } from './../controller/course.controller';
import express from 'express'
import { editCourse, getAllCourse, getSingleCourse, uploadCourse } from "../controller/course.controller";
import { isAuth,authorizedRoles } from "../middleware/auth";

const courseRouter = express.Router()

courseRouter.post("/create-course",isAuth,authorizedRoles("admin"),uploadCourse)

courseRouter.put("/edit-course/:id",isAuth,authorizedRoles("admin"),editCourse)

courseRouter.get("/get-course/:id",getSingleCourse)
export default courseRouter

courseRouter.get("/get-allCourses/",getAllCourse)

courseRouter.get("/get-course-content/:id",isAuth,getCourseByUser)

courseRouter.put("/add-question",isAuth,addQuestion)

courseRouter.put("/add-answer",isAuth,addAnswer)

courseRouter.put("/add-review/:id",isAuth,addReview)

courseRouter.put("/add-reply",isAuth,authorizedRoles("admin"),addReply)
