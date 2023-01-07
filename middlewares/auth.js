import CustomErrorHandler from "../services/CustomErrorHandler";
import { User } from "../models";
import JwtService from "../services/JwtService";


const auth = async (req, res, next) => {

    let authHeader = req.headers.authorization;

    if(!authHeader){

        return next(CustomErrorHandler.unAuthorized('No authorization header'));

    }

    const token = authHeader.split(' ')[1];

    try{

        const { _id, role } = JwtService.verify(token);
        const user ={
            _id,
            role
        }
        req.user = user;
        next();


    }
    catch(err){
    
        return next(CustomErrorHandler.unAuthorized('Authorization token is not valid'));

    }


}

export default auth;