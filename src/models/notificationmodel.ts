
import mongoose,{Document,Schema,Model} from "mongoose";

export interface Notification extends Document {
    title:string,
    message:string,
    status:string,
    userId:string
}
const notificationSchema = new Schema<Notification>({
    title:{
         type: String,
      required: [true, "Notification title is required"],
    },
     message: {
      type: String,
      required: [true, "Notification message is required"],},

      status:{
         type: String,
         required:true,
         default:"unread"
      }
},{timestamps:true})

const NotificationModel:Model<Notification> = mongoose.model('Notification',notificationSchema)

export default NotificationModel