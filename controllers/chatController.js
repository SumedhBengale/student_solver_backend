import Joi from "joi";
import { Chat, User } from "../models";


const chatController ={

    sendMessage: async (req, res, next) => {

        //Validate Request
        const schema = Joi.object({
            chatId: Joi.string().required(),
            text: Joi.string().required(),
            owner: Joi.string().required(),
        });

        const {error} = schema.validate(req.body);

        if(error){
            return next(error);
        }

        try{

            //Add Text to chat

            const update = await Chat.findByIdAndUpdate(req.body.chatId, {
                $push: {
                    messages: {
                        text: req.body.text,
                        owner: req.body.owner,
                    }
                }
            })

            if(!update){
                return res.send("Chat not found");
            }

            return res.send("Message sent");
        }catch(error){
            return next(error);
        }

    },

    getMyChats: async(req, res, next) => {

        //Validate Request
        const schema = Joi.object({
            userId: Joi.string().required(),
        });

        const {error} = schema.validate(req.body);

        if(error){
            return next(error)
        }

        try{

            //Get Chats Array from User

            const chats = await User.findById(req.body.userId).select('chats');

            //Get Chat Objects from Chats Array

            return res.send(chats);

        }catch(error){
            return next(error);
        }

    },

    getChat: async(req, res, next) =>{

        //Validate Request

        const schema = Joi.object({
            chatId: Joi.string().required(),
        });

        const {error} = schema.validate(req.body);

        if(error){
            return next(error);
        }

        try{

            //Get Chat Object

            const chat = await Chat.findById(req.body.chatId);

            return res.send(chat);

        }catch(error){
            return next(error)
        }
    },

    newChat: async(req, res, next) =>{

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

            const user = await User.findByIdAndUpdate(req.body.firstPersonId, {
                $push: {
                    chats: chat._id
                }
            })

            const user2 = await User.findByIdAndUpdate(req.body.thirdPersonId, {
                $push: {
                    chats: chat._id
                }
            })

        }catch(error){
            return next(error);
        }

        return res.send("Chat Created");


    },


}

export default chatController;