import {app} from './app'
import connectDB from './config/db';
import {v2 as cloudinary} from 'cloudinary'

require('dotenv').config();

cloudinary.config({
    cloud_name:process.env.CLOUDINARY_CLOUD_NAME,
    api_key:process.env.CLOUDINARY_API_KEY,
    api_secret:process.env.CLOUDINARY_API_SECRET,
})


app.listen(process.env.PORT,()=>{
    console.log(`Server is running at ${process.env.PORT}`)
    connectDB();
})