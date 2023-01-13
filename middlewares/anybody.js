import CustomErrorHandler from '../services/CustomErrorHandler';

//Allow both Students and Teachers ----------------------------------------------------------------------------

const student = (req, res, next) => {

    try{
        
        if(req.user.role === 'student' || req.user.role === 'teacher'){
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