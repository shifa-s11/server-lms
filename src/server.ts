import {app} from './app'
import connectDB from './config/db';

require('dotenv').config();
app.listen(process.env.PORT,()=>{
    console.log(`Server is running at ${process.env.PORT}`)
    connectDB();
})