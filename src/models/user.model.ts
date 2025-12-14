import mongoose,{Document,Model,Schema} from 'mongoose'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
require('dotenv').config()
import { Types } from 'mongoose'
import { Course } from './course.model'
//Interface helps in compile time type checking helps in writing code while Schema helps in run time so ensure type safety in database
const emailRegex:RegExp = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export interface User extends Document{
    name:string,
    email:string,
    password:string,
    avatar:{
        public_id:string,
        url:string,
    },
    role:string,
    wishlist:(Types.ObjectId | Course)[],
    isVerified:boolean,
   courses: string[],
    comparePassword:(password:string) => Promise<boolean>;
    signAccessToken:() => string,
    signRefreshToken:()=> string
}

const userSchema:Schema<User> = new mongoose.Schema({
name:{
    type:String,
    required:[true,'Please enter your name']
},
email:{
    type:String,
    required:[true,'Please enter your email'],
    validate:{
        validator:(value:string)=>{
            return emailRegex.test(value);
        },
        message:'Please enter a valid email address'
    },
    unique:true,
},
password:{
    type:String,
    minLength:[6,'Password must be at least 6 characters'],
    select:false,
    trim:true,
    validate: {
  validator: (val: string) => /^(?=.*[A-Z])(?=.*\d).+$/.test(val),
  message: "Password must contain at least one uppercase letter and one number",
}
},
avatar: {
  public_id: { type: String, default: "" },
  url: { type: String, default: "" },
},
role:{
type:String,
default:"user",
},
isVerified:{
    type:Boolean,
    default:false,
},
wishlist:[{
type:mongoose.Schema.Types.ObjectId,
ref:"Course"
}],
courses:[{
    courseId:String,
}]
},{timestamps:true})

//Hashing password before saving user
userSchema.pre<User>("save", async function (next) {
  if (!this.isModified("password")) return next();

  const salt = await bcrypt.genSalt(10);      
  this.password = await bcrypt.hash(this.password, salt); 
  next();
});

userSchema.methods.comparePassword = async function( Enteredpassword:string){
    return await bcrypt.compare(Enteredpassword,this.password)
}
//Acess token expires after few minutes and is responsible for checking authentication 
userSchema.methods.signAccessToken = function(){
    return jwt.sign({id:this._id},
        process.env.ACCESS_TOKEN || '',{
            expiresIn:"5m"
        }
        
    )
}
//Refresh token generates new access token after it has been expired 
userSchema.methods.signRefreshToken = function(){
    return jwt.sign({id:this._id},
    process.env.REFRESH_TOKEN || '',{
            expiresIn:"3d"
        }
    )
}
 const UserModel:Model<User> = mongoose.model<User>("User",userSchema)
 export default UserModel