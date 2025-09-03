class ErrorHandler extends Error {
    statusCode:number;
    constructor(message:string, statusCode:number){
        super(message);// helps class to inherit message property of Error class
        this.statusCode = statusCode; 
        Error.captureStackTrace(this,this.constructor)
       }
}
export default ErrorHandler;