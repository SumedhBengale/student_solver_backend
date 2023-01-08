import refreshToken from "../../models/refreshToken";
import JwtService from "../../services/JwtService";
import CustomErrorHandler from "../../services/CustomErrorHandler";
import Joi from "joi";
import { REFRESH_SECRET } from "../../config";
import { User } from "../../models";

const refreshController = {

    async refresh(req, res, next){

        ///Validate the refresh token --------------------------------------------------------------------------------------------

        const refreshSchema = Joi.object().keys({
            refresh_token: Joi.string().required()
        });

        const { error } = refreshSchema.validate(req.body);

        if(error){
            return next(error);
        }

        //Check if the refresh token exists in the database ---------------------------------------------------------------------

        let refreshtoken;

        try{
         
            refreshtoken = await refresh_token.findOne({token:req.body.refresh_token});
        
            if(!refreshtoken){
                return next(CustomErrorHandler.unAuthorized('Invalid refresh token'));
            }

            //Verify the refresh token --------------------------------------------------------------------------------------------
            let userId;

            try{

                const {_id} = JwtService.verify(refreshtoken.token, REFRESH_SECRET);
                userId = _id;

            }
            catch(error){
                return next(new Error("Something went wrong "+ error.message));
            }

            //Check if the user exists --------------------------------------------------------------------------------------------

            const user = await User.findOne({_id: userId});
            if(!user){
                return next(CustomErrorHandler.unAuthorized('No user found'));
            }

            //Generate new access token --------------------------------------------------------------------------------------------

            const access_token = JwtService.sign({_id: user._id, role: user.role});
            const refresh_token = JwtService.sign({_id: user._id, role: user.role}, '1y', REFRESH_SECRET);

            //Save the refresh token in the database ---------------------------------------------------------------------------

            await refreshToken.create({token: refresh_token});

            res.json({access_token, refresh_token});


        }
        catch(error){
            return next(new Error("Something went wrong: "+ error.message));
        }

    }

}

export default refreshController;