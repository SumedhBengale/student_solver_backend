import Joi from "joi";
import { Chat, User } from "../models";


const chatController ={

    sendMessage: async (req, res) => {},

    getMyChats: async(req, res) => {},

    getChat: async(req, res) =>{},

    newChat: async(req, res) =>{

        //Validate request
        const schema = Joi.object({
            firstPersonId: Joi.string().required(),
            thirdPersonId: Joi.string().required(),
        });

        const {error} = schema.validate(req.body);

        if(error){
            return next(error);
        }

        try{

            //Create new Chat

            const chat = new Chat({
                participants: [req.body.firstPersonId, req.body.thirdPersonId],
                messages: []
            });
            await chat.save();

            //Update user Model

            const user = User

        }catch(error){
            return next(error);
        }


    },


}

export default chatController;