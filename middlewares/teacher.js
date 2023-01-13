import CustomErrorHandler from '../services/CustomErrorHandler';


//Check if the user is a teacher --------------------------------------------------------------------------------------------


const teacher = (req, res, next) => {

    try{
        
        if(req.user.role === 'teacher'){
            next();
        }
        else{
            console.log(req.user.role)

            return next(CustomErrorHandler.unAuthorized('Your account is not authorized to access this route'));
        }

    }catch(err){
        return next(CustomErrorHandler.serverError());
    }

}

export default teacher;