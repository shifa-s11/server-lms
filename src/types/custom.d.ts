import { User } from "../../models/user.model"; 

declare global {
  namespace Express {
    interface UserPayload {
      _id: string;   
      role?: string; 
      email?: string;
      name?: string;
      avatar?:string
        courses?: { _id: string }[]; 
    }

    interface Request {
      user?: UserPayload;
    }
  }
}
