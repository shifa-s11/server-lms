require('dotenv').config();
import mongoose from 'mongoose';

const dbUrl:string = process.env.DB_URI||''

const connectDB = async() => {
    try{
        await mongoose.connect(dbUrl).then((data:any)=>{
            console.log(`Database is connected successfully with port :${process.env.PORT}`)
        })
    }catch(err:any){
console.log(err.message);
setTimeout(connectDB,5000)
    }
}
export default connectDB