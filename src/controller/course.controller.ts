import { Request, Response, NextFunction } from "express";
import { CatchAsyncError } from "../middleware/catchAsyncError";
import ErrorHandler from "../utils/ErrorHandler";
import cloudinary from 'cloudinary'
import { createCourse } from "../services/course.service";
import CourseModel from "../models/course.model";
import { success } from "zod";
import { redis } from './../config/redis';

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
        return next(new ErrorHandler(error.message, 400));
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
        return next(new ErrorHandler(error.message, 400));
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
        console.error("EditCourse Error:", error);
        return next(new ErrorHandler(error.message, 400));
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
         console.log("hii")
        res.status(200).json({
            success: true,
            courses
        })}
    } catch (error: any) {
        console.error("EditCourse Error:", error);
        return next(new ErrorHandler(error.message, 400));
    }
})