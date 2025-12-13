import {app} from './app'
import connectDB from './config/db';
import {v2 as cloudinary} from 'cloudinary'
import http from 'http'
import { initSocketServer } from './socketServer';
require('dotenv').config();
const server = http.createServer(app);
cloudinary.config({
    cloud_name:process.env.CLOUDINARY_CLOUD_NAME,
    api_key:process.env.CLOUDINARY_API_KEY,
    api_secret:process.env.CLOUDINARY_API_SECRET,
})

initSocketServer(server)
server.listen(process.env.PORT,()=>{
    console.log(`Server is running at ${process.env.PORT}`)
    connectDB();
})