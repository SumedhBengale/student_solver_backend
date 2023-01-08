import CustomErrorHandler from '../services/CustomErrorHandler';

//Check if the user is a student --------------------------------------------------------------------------------------------

const student = (req, res, next) => {

    try{
        
        if(req.user.role === 'student'){
            next();
        }
        else{
            return next(CustomErrorHandler.unAuthorized('Your account is not authorized to access this route'));
        }

    }catch(err){
        return next(CustomErrorHandler.serverError());
    }

}

export default student;