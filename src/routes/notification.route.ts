import express from 'express';
import { authorizedRoles, isAuth } from '../middleware/auth';
import { getNotification, updateNotificationStatus } from '../controller/notification.controller';
const notificationRoute = express.Router();

notificationRoute.get("/get-all-notifications",isAuth,authorizedRoles("admin"),getNotification)

notificationRoute.put('/update-notification/:id',isAuth,authorizedRoles("admin"),updateNotificationStatus)
export default notificationRoute