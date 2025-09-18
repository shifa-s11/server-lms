import mongoose,{Document,Schema,Model} from "mongoose";
import { User } from "./user.model";




interface Comment extends Document{
    user:User,
    question:string
    questionReplies:Comment[
    ],
    helpful: mongoose.Types.ObjectId[];
}



interface Review extends Document{
    user:User,
    rating:number,
    comment:string,
    commentReply: {
    user: User;
    comment: string;
  }[];
}

interface Link extends Document{
    title:string,
    url:string
}

interface CourseData extends Document{
    title:string,
    description?:string,
    videoUrl:string,
    videoThumbnail:object,
    videoSection:string,
    videoLength:number,
    videoPlayer:string,
    links:Link[],
    suggestion:string,
    questions:Comment[],
}

 export interface Course extends Document {
    name:string,
    description:string,
    price:number,
    estimatedPrice?:number,
    thumbnail:object,
    tags:string,
    level:string,
    demoUrl:string,
    benefits:{
        title:string
    }[],
    prerequisites:{
        title:string
    }[],
    reviews:Review[],
   courseData: CourseData[];
    ratings?:number,
    purchased?:number,

}

const replySchema = new Schema(
  {
    user: {
      type: Object,
      required: true,
    },
    answer: {
      type: String,
      required: true,
    },
     helpful: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true } // also gives createdAt & updatedAt
);
const reviewSchema = new Schema<Review>({
user:Object,
rating:{
    type:Number,
    default:0
},
comment:String,
commentReply: {
      type: [
        {
          user: Object,
          comment: String,
        },
      ],
      default: [],
    },
  },
  { timestamps: true }
)

const linkSchema = new Schema<Link>({
    title:String,
    url:String
})

const commentSchema = new Schema<Comment>({
    user:Object,
    question:String,
    questionReplies:[replySchema],
    helpful: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }]
},
 { timestamps: true }
)

const courseDataSchema = new Schema<CourseData>({
videoUrl:String,
title:String,
videoSection:String,
videoLength:Number,
videoPlayer:String,
links:[linkSchema],
suggestion:String,
questions:[commentSchema]
})

const courseSchema = new Schema<Course>({
    name:{
        type:String,
        required:true,
    },
    description:{
        type:String,
        required:true,
    },
    price:{
        type:Number,
        required:true,
    },
    estimatedPrice:{
        type:Number
    },
    thumbnail:{
        public_id:{
            type:String,
        },
        url:{
             type:String,
        }},
        tags:{
            type:String,
        required:true,
        },
        level:{
             type:String,
        required:true, 
        },
        demoUrl:{
             type:String,
        required:true, 
        },
        courseData:[courseDataSchema],
        benefits:[{title:String}],
        prerequisites:[{title:String}],
        reviews:[reviewSchema],

        ratings:{
            type:Number,
            default:0
        },
        purchased:{
            type:Number,
            default:0
        }
    
})

const CourseModel:Model<Course> = mongoose.model("Course",courseSchema)

export default CourseModel;