import { CatchAsyncError } from './../middleware/catchAsyncError';
import { Request, Response, NextFunction } from "express";
import ErrorHandler from "../utils/ErrorHandler";
import cloudinary from 'cloudinary'
import { createCourse, getAllCourseService } from "../services/course.service";
import CourseModel from "../models/course.model";
import { success } from "zod";
import { redis } from './../config/redis';
import mongoose from "mongoose";
import ejs from "ejs";
import path from "path";
import sendMail from '../utils/sendMail';
import UserModel from '../models/user.model';
import NotificationModel from '../models/notificationmodel';
// course upload 

export const uploadCourse = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const data = req.body;
        const thumbnail = data.thumbnail;

        if (thumbnail) {
            const myCloud = await cloudinary.v2.uploader.upload(thumbnail, {
                folder: "courses",
            });

            data.thumbnail = {
                public_id: myCloud.public_id,
                url: myCloud.secure_url,
            };
        }

        const course = await createCourse(data);

        res.status(201).json({
            success: true,
            course,
        });
    } catch (error: any) {
        console.error("UploadCourse Error:", error);
        return next(new ErrorHandler(error.message, 500));
    }
});

//edit course 

export const editCourse = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const courseId = req.params.id;
        const data = req.body;

        const course = await CourseModel.findById(courseId);
        if (!course) {
            return next(new ErrorHandler("Course not found", 404));
        }
        const thumbnail = data.thumbnail
        if (thumbnail) {
            if (thumbnail?.public_id) {
                await cloudinary.v2.uploader.destroy(thumbnail.public_id);
            }
            const myCloud = await cloudinary.v2.uploader.upload(data.thumbnail, {
                folder: "courses",
            });

            data.thumbnail = {
                public_id: myCloud.public_id,
                url: myCloud.secure_url,
            };
        }

        const updatedCourse = await CourseModel.findByIdAndUpdate(
            courseId,
            { $set: data },
            { new: true, runValidators: true }
        );

        res.status(200).json({
            success: true,
            message: "Course updated successfully",
            course: updatedCourse,
        });
    } catch (error: any) {
        console.error("EditCourse Error:", error);
        return next(new ErrorHandler(error.message, 500));
    }
});

//get single course 
export const getSingleCourse = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {

        const courseId = req.params.id;
        const isCacheExist = await redis.get(courseId)
        if(isCacheExist){
            const course = JSON.parse(isCacheExist);
             res.status(200).json({
            success: true,
            course
        })
        }
else{
        const course = await CourseModel.findById(req.params.id).select("-courseData.videoUrl -courseData.suggestion -courseData.questions -courseData.links")
        await redis.set(courseId,JSON.stringify(course))
        res.status(200).json({
            success: true,
            course
        })}
    } catch (error: any) {
        console.error("Error:", error);
        return next(new ErrorHandler(error.message, 500));
    }
})

//getAllCourses
export const getAllCourse = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
const isCacheExist = await redis.get("allCourses")
 if(isCacheExist){
            const course = JSON.parse(isCacheExist);
             res.status(200).json({
            success: true,
            course
        })
        }
else{
        const courses = await CourseModel.find().select("-courseData.videoUrl -courseData.suggestion -courseData.questions -courseData.links")
         await redis.set("allCourses",JSON.stringify(courses))
        res.status(200).json({
            success: true,
            courses
        })}
    } catch (error: any) {
        console.error(" Error:", error);
        return next(new ErrorHandler(error.message, 500));
    }
})

// get course content - for valid user 

export const getCourseByUser = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
const userCourse = req.user?.courses;
const courseId = req.params.id;
const courseExist = userCourse?.find((course:any) => course._id.toString() === courseId
)
if(!courseExist){
return next (new ErrorHandler("You are not eligible to access this course",404))
}
const course = await CourseModel.findById(courseId);

const content = course?.courseData
res.status(200).json({
    success:true,
    content
})
    }catch (error: any) {
        console.error(" Error:", error);
        return next(new ErrorHandler(error.message, 500));
    }})

    //add question 
    interface AddQuestion{
        question :string,
        courseId:string,
        contentId:string
    }

    export const addQuestion = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const {question,courseId,contentId}:AddQuestion = req.body;
        const course = await CourseModel.findById(courseId);

        if(!mongoose.Types.ObjectId.isValid(contentId)){
             return next(new ErrorHandler("Invalid Content Id", 400));
        }
        const courseContent = course?.courseData.find((item:any)=>item._id.equals(contentId))

        if(!courseContent){
  return next(new ErrorHandler("Invalid Content Id", 400));
        }
        const newQuestion:any = {
            user:req.user,
            question,
            questionReplies:[]
            
        }
        courseContent.questions.push(newQuestion)
            await NotificationModel.create({
      user: req.user?._id,
      title: "New Question",
      message: `You have a new question in ${courseContent?.title}`
    });
        
        await course?.save();
        res.status(200).json({
    success:true,
    course
})

    }
    catch (error: any) {
        console.error("Error:", error);
        return next(new ErrorHandler(error.message, 500));
    }
})

//add - question Replies

interface AddAnswerData{
    answer:string,
    courseId:string,
    contentId : string,
    questionId : string
}

export const addAnswer = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
const {answer,courseId,contentId,questionId}:AddAnswerData = req.body

const course = await CourseModel.findById(courseId);
        if(!mongoose.Types.ObjectId.isValid(contentId)){
             return next(new ErrorHandler("Invalid Content Id", 400));
        }
        const courseContent = course?.courseData.find((item:any)=>item._id.equals(contentId))

        if(!courseContent){
  return next(new ErrorHandler("Invalid Content Id", 400));
        }
const question = courseContent?.questions?.find((item:any)=>
    item._id.equals(questionId)
)
if(!question){
      return next(new ErrorHandler("Invalid question  Id", 400));
}

const newAnswer: any = {
  user:req.user,
  answer  
}
question.questionReplies.push(newAnswer)

await course?.save();

if(req.user?._id === question.user._id){
                await NotificationModel.create({
      user: req.user?._id,
      title: "New Question Reply Received",
      message: `You have a new question reply in  ${courseContent?.title}`
    });
}else{
    const data = {
        name:question.user.name,
        title:courseContent.title
    }
const html = await ejs.renderFile(path.join(__dirname,"../mail/question-reply.ejs"),data)

try{
    await sendMail({
      email:question.user.email ,
       subject:"Question Reply",
       template:"question-reply.ejs",
       data,
    })
} catch(error:any){
    console.error("Error:", error);
        return next(new ErrorHandler(error.message, 500));
}
}
 res.status(200).json({
    success:true,
    course
})
    }catch (error: any) {
        console.error("Error:", error);
        return next(new ErrorHandler(error.message, 500));
    }

})
//add review in course 

interface ReviewData {
review:string,
courseId : string,
rating:number,
userId:string
}

export const addReview = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
const userCourse = req.user?.courses;
const courseId = req.params.id;

const courseExist = userCourse?.some((course:any)=>course._id.toString())

if(!courseExist){
     return next(new ErrorHandler("You are not eligible to access this resource", 404));
}
const course = await CourseModel.findById(courseId);

const {review,rating} = req.body as ReviewData
const reviewData:any = {
    user:req.user,
    comment:review,
    rating
}

course?.reviews.push(reviewData)

let avg = 0;
course?.reviews.forEach((rev:any)=>{
    avg += rev.rating;
})
if(course){
    course.ratings = avg/course.reviews.length
}
await course?.save();

const notification = {
    title:"The Review Received",
    messaage:`${req.user?.name} has given a review in ${course?.name}`
}
 res.status(200).json({
    success:true,
    course
})
    }catch (error: any) {
        console.error("Error:", error);
        return next(new ErrorHandler(error.message, 500));
    }})

    // add replies in review -only by admin 
interface ReplyData {
    comment : string,
    courseId : string,
    reviewId : string
}


    export const addReply = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const {comment,courseId,reviewId} = req.body as ReplyData
    
        const course = await CourseModel.findById(courseId);
    if(!course){
         return next(new ErrorHandler("Course not found", 404));
    }
const review = course?.reviews?.find((rev: any) => rev._id.toString() === reviewId);
        if(!review){
         return next(new ErrorHandler("Review not found", 404));
    }
    const replyData:any = {
        user:req.user,
        comment,
    }
    if(!review.commentReply){
        review.commentReply=[]
    }
    review.commentReply?.push(replyData)
        await course?.save()
     res.status(200).json({
    success:true,
    course
})
    }
catch (error: any) {
        console.error("Error:", error);
        return next(new ErrorHandler(error.message, 500));
    }
}) 

// Add to Wishlist
export const addToWishlist = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
  const { courseId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(courseId)) {
    return next(new ErrorHandler("Invalid Course Id", 400));
  }
   const course = await CourseModel.findById(courseId);
  if (!course) {
    return next(new ErrorHandler("Course not found", 404));
  }

  const user = await UserModel.findById(req.user?._id);
  if (!user) return next(new ErrorHandler("User not found", 404));

  // Prevent duplicates
  if (user.wishlist.includes(courseId)) {
    return next(new ErrorHandler("Course already in wishlist", 400));
  }

  user.wishlist.push(courseId);
  await user.save();

  res.status(200).json({
    success: true,
    message: "Course added to wishlist",
    wishlist: user.wishlist
  });
});

// Remove from Wishlist
export const removeFromWishlist = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
  const { courseId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(courseId)) {
    return next(new ErrorHandler("Invalid Course Id", 400));
  }

  const user = await UserModel.findById(req.user?._id);
  if (!user) return next(new ErrorHandler("User not found", 404));

    if (!user.wishlist.some((id) => id.toString() === courseId)) {
    return next(new ErrorHandler("Course not in wishlist", 400));
  }
  user.wishlist = user.wishlist.filter((id) => id.toString() !== courseId);
  await user.save();

  res.status(200).json({
    success: true,
    message: "Course removed from wishlist",
    wishlist: user.wishlist
  });
});

// Get Wishlist
export const getWishlist = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
  const user = await UserModel.findById(req.user?._id).populate("wishlist");
  if (!user) return next(new ErrorHandler("User not found", 404));

  res.status(200).json({
    success: true,
    wishlist: user.wishlist
  });
});

// Mark Question as Helpful
export const markQuestionHelpful = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { courseId, contentId, questionId } = req.body;

    const course = await CourseModel.findById(courseId);
    if (!course) return next(new ErrorHandler("Course not found", 404));

    const courseContent = course.courseData.find((c: any) => c._id.equals(contentId));
    if (!courseContent) return next(new ErrorHandler("Content not found", 404));

    const question = courseContent.questions.find((q: any) => q._id.equals(questionId));
    if (!question) return next(new ErrorHandler("Question not found", 404));

    // Prevent duplicates
    if (question.helpful.some((id: any) => id.toString() === req.user?._id.toString())) {
      return next(new ErrorHandler("You already marked this question helpful", 400));
    }

    question.helpful.push(req.user?._id);
    await course.save();

    res.status(200).json({
      success: true,
      message: "Marked question as helpful",
      helpfulCount: question.helpful.length
    });
  } catch (error: any) {
    console.error("Error:", error);
    return next(new ErrorHandler(error.message, 500));
  }
});


// Unmark Question Helpful
export const unmarkQuestionHelpful = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { courseId, contentId, questionId } = req.body;

    const course = await CourseModel.findById(courseId);
    if (!course) return next(new ErrorHandler("Course not found", 404));

    const courseContent = course.courseData.find((c: any) => c._id.equals(contentId));
    if (!courseContent) return next(new ErrorHandler("Content not found", 404));

    const question = courseContent.questions.find((q: any) => q._id.equals(questionId));
    if (!question) return next(new ErrorHandler("Question not found", 404));

    question.helpful = question.helpful.filter((id: any) => id.toString() !== req.user?._id.toString());
    await course.save();

    res.status(200).json({
      success: true,
      message: "Removed helpful mark from question",
      helpfulCount: question.helpful.length
    });
  } catch (error: any) {
    console.error("Error:", error);
    return next(new ErrorHandler(error.message, 500));
  }
});


// Mark Answer as Helpful
export const markAnswerHelpful = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { courseId, contentId, questionId, answerId } = req.body;

    const course = await CourseModel.findById(courseId);
    if (!course) return next(new ErrorHandler("Course not found", 404));

    const courseContent = course.courseData.find((c: any) => c._id.equals(contentId));
    if (!courseContent) return next(new ErrorHandler("Content not found", 404));

    const question = courseContent.questions.find((q: any) => q._id.equals(questionId));
    if (!question) return next(new ErrorHandler("Question not found", 404));

    const answer = question.questionReplies.find((a: any) => a._id.equals(answerId));
    if (!answer) return next(new ErrorHandler("Answer not found", 404));

    if (answer.helpful.some((id: any) => id.toString() === req.user?._id.toString())) {
      return next(new ErrorHandler("You already marked this answer helpful", 400));
    }

    answer.helpful.push(req.user?._id);
    await course.save();

    res.status(200).json({
      success: true,
      message: "Marked answer as helpful",
      helpfulCount: answer.helpful.length
    });
  } catch (error: any) {
    console.error("Error:", error);
    return next(new ErrorHandler(error.message, 500));
  }
});


// Unmark Answer Helpful
export const unmarkAnswerHelpful = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { courseId, contentId, questionId, answerId } = req.body;

    const course = await CourseModel.findById(courseId);
    if (!course) return next(new ErrorHandler("Course not found", 404));

    const courseContent = course.courseData.find((c: any) => c._id.equals(contentId));
    if (!courseContent) return next(new ErrorHandler("Content not found", 404));

    const question = courseContent.questions.find((q: any) => q._id.equals(questionId));
    if (!question) return next(new ErrorHandler("Question not found", 404));

    const answer = question.questionReplies.find((a: any) => a._id.equals(answerId));
    if (!answer) return next(new ErrorHandler("Answer not found", 404));

    answer.helpful = answer.helpful.filter((id: any) => id.toString() !== req.user?._id.toString());
    await course.save();

    res.status(200).json({
      success: true,
      message: "Removed helpful mark from answer",
      helpfulCount: answer.helpful.length
    });
  } catch (error: any) {
    console.error("Error:", error);
    return next(new ErrorHandler(error.message, 500));
  }
});

//get all courses 
export const getAllCourses = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {try{
getAllCourseService(res);
  }catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }})

    //delete course
  export const deleteCourse = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const course = await CourseModel.findById(id);

      if (!course) {
        return next(new ErrorHandler("Course not found", 404));
      }

      await course.deleteOne();
      await redis.del(id);

      res.status(200).json({
        success: true,
        message: "Course deleted successfully",
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);