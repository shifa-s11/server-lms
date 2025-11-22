import { updateAccessToken } from './../controller/user.controller';
import { addAnswer, addQuestion, addReply, addReview, addToWishlist, getCourseByUser, getWishlist, removeFromWishlist, markAnswerHelpful, markQuestionHelpful, unmarkAnswerHelpful, unmarkQuestionHelpful, deleteCourse, getAdminCourses } from './../controller/course.controller';
import express from 'express'
import { editCourse, getAllCourse, getSingleCourse, uploadCourse } from "../controller/course.controller";
import { isAuth, authorizedRoles } from "../middleware/auth";
import { getCourseAnalytics } from '../controller/analytics.controller';


const courseRouter = express.Router()

courseRouter.post("/create-course", updateAccessToken, isAuth, authorizedRoles("admin"), uploadCourse)

courseRouter.put("/edit-course/:id", updateAccessToken, isAuth, authorizedRoles("admin"), editCourse)

courseRouter.get("/get-course/:id", getSingleCourse)
export default courseRouter

courseRouter.get("/get-allCourses/", getAllCourse)

courseRouter.get("/getAdminCourses",isAuth,authorizedRoles("admin"),getAdminCourses)

courseRouter.get("/get-course-content/:id", updateAccessToken, isAuth, getCourseByUser)

courseRouter.put("/add-question", updateAccessToken, isAuth, addQuestion)

courseRouter.put("/add-answer", updateAccessToken, isAuth, addAnswer)

courseRouter.put("/add-review/:id", updateAccessToken, isAuth, addReview)

courseRouter.put("/add-reply", updateAccessToken, isAuth, authorizedRoles("admin"), addReply)

courseRouter.post("/add-wishlist", updateAccessToken, isAuth, addToWishlist)
courseRouter.delete("/remove-wishlist", updateAccessToken, isAuth, removeFromWishlist)
courseRouter.get("/get-wishlist/", updateAccessToken, isAuth, getWishlist)

courseRouter.post("/question/helpful", updateAccessToken, isAuth, markQuestionHelpful);
courseRouter.post("/question/unhelpful", updateAccessToken, isAuth, unmarkQuestionHelpful);

courseRouter.post("/answer/helpful", updateAccessToken, isAuth, markAnswerHelpful);
courseRouter.post("/answer/unhelpful", updateAccessToken, isAuth, unmarkAnswerHelpful);

courseRouter.get("/get-course", updateAccessToken, isAuth, authorizedRoles("admin"), getAllCourse)

courseRouter.delete("/delete-course/:id", updateAccessToken, isAuth, authorizedRoles("admin"), deleteCourse)

courseRouter.get("/get-course-analytics", updateAccessToken, isAuth, authorizedRoles("admin"), getCourseAnalytics)