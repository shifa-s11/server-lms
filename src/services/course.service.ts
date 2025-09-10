import {Response,NextFunction} from 'express'
import CourseModel from '../models/course.model'
import { CatchAsyncError } from '../middleware/catchAsyncError'

// create course
export const createCourse = async (data: any) => {
  const course = await CourseModel.create(data);
  return course;
};