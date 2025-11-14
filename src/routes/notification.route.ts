import express from 'express';
import { authorizedRoles, isAuth } from '../middleware/auth';
import { getNotification, updateNotificationStatus } from '../controller/notification.controller';
import { updateAccessToken } from '../controller/user.controller';
const notificationRoute = express.Router();

notificationRoute.get("/get-all-notifications", updateAccessToken, isAuth, authorizedRoles("admin"), getNotification)

notificationRoute.put('/update-notification/:id', updateAccessToken, isAuth, authorizedRoles("admin"), updateNotificationStatus)
export default notificationRoute