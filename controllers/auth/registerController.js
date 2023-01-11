import Joi from "joi";
import CustomErrorHandler from "../../services/CustomErrorHandler";
import { User, RefreshToken } from "../../models";
import bcrypt from "bcrypt";
import JwtService from "../../services/JwtService";
import { REFRESH_SECRET } from "../../config";

const registerController = {

    async register(req, res, next){
        
        // Validate the request body --------------------------------------------------------------------------------------------

        const schema = Joi.object().keys({
            name: Joi.string().min(5).max(30).required(),
            email: Joi.string().email().required(),
            password: Joi.string().pattern(new RegExp('^[a-zA-Z0-9]{3,30}$')).required(),
            confirmPassword: Joi.ref('password'),
        });


        const { error } = schema.validate(req.body);

        if(error){
            return next(error);
        }
        //Check if User already exists --------------------------------------------------------------------------------------------

        try{
            const exist = await User.exists({email: req.body.email});
            if(exist){
                return next(CustomErrorHandler.alreadyExists('This email already exists'));
            }
        }
        catch(error){
            return next(error);
        }

        //Hash the password ------------------------------------------------------------------------------------------------------
        const { name, email, password } = req.body;

        const hashedPassword = await bcrypt.hash(password, 10);

        //Prepare the model ------------------------------------------------------------------------------------------------------


        const user = new User({
            name,
            email,
            password: hashedPassword,
            token_id: null,
        });

        let access_token;
        let refresh_token;

        try{
            const result = await user.save();

            //Generate JWT token ------------------------------------------------------------------------------------------------
            access_token = JwtService.sign({_id: result._id, role: result.role})
            refresh_token = JwtService.sign({_id: result._id, role: result.role}, '1y', REFRESH_SECRET)

            //Store the refresh token in the database and its Id in the user data ---------------------------------------------------------
            const token = await RefreshToken.create({user_id: user._id, token: refresh_token});
            user.token_id = token._id;
            await user.save();
            


        }
        catch(error){
        
            return next(error);

        }

        res.json({'access_token': access_token, 'refresh_token': refresh_token});


    }
    

}

export default registerController;