import multer from 'multer';
import fs from 'fs';
import Joi from 'joi';
import path from 'path';
import { Answer, Question } from '../models';
import CustomErrorHandler from '../services/CustomErrorHandler';

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => {
        const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    }
});
const handleMultipartData = multer({ storage, limits: { fileSize: 1000000 * 10 } }).array('attachments', 10);  // 10MB max file size


const answerController = {


    async answerQuestion(req, res, next){
            console.log(req.files)

            handleMultipartData(req, res, async (err) => {


            //validate the request --------------------------------------------------------------------------------------------

            const answerSchema = Joi.object({
                title: Joi.string().required(),
                description: Joi.string().required(),
                questionId: Joi.string().required(),
                teacherId: Joi.string().required(),
            });

            const { error } = answerSchema.validate(req.body);

            if(error){
                //Delete the uploaded files --------------------------------------------------------------------------------------------
                for(let i = 0; i < req.files.length; i++){
                    fs.unlink(`${appRoot}/${req.files[i].path}`, (err) => {
                        if(err){
                            return next(CustomErrorHandler.serverError(err.message));
                        }
                    });
                }
                return next(error);
            }

            //Check if bid with teacherId is accepted --------------------------------------------------------------------------------------------
            const bids = await Question.findById(req.body.questionId).select('bids');
            
            const acceptedBid = bids.bids.find(bid => bid.teacherId == req.body.teacherId && bid.accepted == true);

            if(!acceptedBid){
                return next(CustomErrorHandler.notAccepted('Your bid is not accepted yet'));
            }

            //Create the answer --------------------------------------------------------------------------------------------

            const { title, description, questionId } = req.body;

            let paths = [];

            for(let i = 0; i < req.files.length; i++){
                paths.push(req.files[i].path);
            }

            console.log(paths);

            try{

                //Check if the answer for the question already exists --------------------------------------------------------------------------------------------

                const exists = await Answer.findOne({questionId: req.body.questionId});

                if(exists){
                    //Delete the uploaded files --------------------------------------------------------------------------------------------
                    for(let i = 0; i < req.files.length; i++){
                        fs.unlink(`${appRoot}/${req.files[i].path}`, (err) => {
                            if(err){
                                return next(CustomErrorHandler.serverError(err.message));
                            }
                        });
                    }

                    return next(CustomErrorHandler.alreadyExists('Answer for this question already exists'));
                }

                const answer = new Answer({
                    title,
                    description,
                    questionId,
                    attachments: paths,
                });
                await answer.save();
                }catch(err){
                    //Delete the uploaded files --------------------------------------------------------------------------------------------
                    for(let i = 0; i < req.files.length; i++){
                        fs.unlink(`${appRoot}/${req.files[i].path}`, (err) => {
                            if(err){
                                return next(CustomErrorHandler.serverError(err.message));
                            }
                        });
                    }
    
                    return next(err);
                }
                return res.status(201).json({message: 'Answer Created'});


        });
    },

    async deleteAnswer(req, res, next){

        //Validate the request --------------------------------------------------------------------------------------------

        const answerSchema = Joi.object({
            answerId: Joi.string().required(),
        });

        const { error } = answerSchema.validate(req.body);

        if(error){
            return next(error);
        }

        //Check if the answer exists ---------------------------------------------------------------------------------------

        const answer = await Answer.findById(req.body.answerId);

        if(!answer){
            return next(CustomErrorHandler.notFound('Answer not found'));
        }

        //Delete the answer ------------------------------------------------------------------------------------------------

        try{
            await answer.deleteOne();

            //Delete the files ------------------------------------------------------------------------------------------------

            for(let i = 0; i < answer.attachments.length; i++){
                fs.unlink(`${appRoot}/${answer.attachments[i]}`, (err) => {
                    if(err){
                        return next(CustomErrorHandler.serverError(err.message));
                    }
                });
            }
        }catch(err){
            return next(err);
        }

        return res.status(200).json({message: 'Answer deleted'});

    }

}

export default answerController