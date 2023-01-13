import Joi from 'joi';
import CustomErrorHandler from '../../services/CustomErrorHandler';
import { RefreshToken, User } from '../../models';
import bcrypt from 'bcrypt';
import JwtService from '../../services/JwtService';
import { REFRESH_SECRET } from '../../config';

const loginController = {

    //Login the User ----------------------------------------------------------------------------
    async login(req, res, next) {
    
        const loginSchema = Joi.object().keys({
            email: Joi.string().email().required(),
            password: Joi.string().pattern(new RegExp('^[a-zA-Z0-9]{3,30}$')).required(),
        });

        const { error } = loginSchema.validate(req.body);

        if(error){
            return next(error);
        }

        try{

            // Check if the user exists in the database ------------------------------------------------------------
            const user = await User.findOne({ email: req.body.email });

            if(!user){
            
                return next(CustomErrorHandler.wrongCredentials('No user with this email'));

            }

            // Compare the password with the hashed password in the database --------------------------------------------

            const match = await bcrypt.compare(req.body.password, user.password);
            if(!match){
                return next(CustomErrorHandler.wrongCredentials('Wrong password'));
            }

            // Generate token ------------------------------------------------------------------------------------------------
            const access_token = JwtService.sign({_id: user._id, role: user.role});
            const refresh_token = JwtService.sign({_id: user._id, role: user.role}, '1y', REFRESH_SECRET);

            //Save the refresh token in the database ---------------------------------------------------------------

            const refreshToken = await RefreshToken.findByIdAndUpdate(user.token_id, {token: refresh_token});

            
            res.json({'access_token': access_token, 'refresh_token': refresh_token});

        }
        catch(error){
            return next(error);
        }

    },

    async logout(req, res, next){

        //Validation of the request --------------------------------------------------------------------------------
        const refreshSchema = Joi.object().keys({
            user_id: Joi.string().required(),
        });

        const { error } = refreshSchema.validate(req.body);

        if(error){
            return next(error);
        }

        //Check if the refresh token exists in the database ---------------------------------------------------------

        const { user_id } = req.body;

        try{
            //Delete the refresh token from the database ------------------------------------------------------------
            const result = await RefreshToken.findOneAndUpdate({user_id: user_id}, {token: null});

            if(!result){
                return next(CustomErrorHandler.wrongCredentials('No user with this id'));
            }


        }catch(error){
            return next(new Error("Something went wrong in the database: "+ error.message));

        }

        res.json({message: "Logged out successfully"});


    }

}

export default loginController;