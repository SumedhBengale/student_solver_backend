import multer from 'multer';
import fs from 'fs';
import Joi from 'joi';
import path from 'path';
import { Answer, Bid, Question } from '../models';
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
    deleteFiles(files){
        for(let i = 0; i < files.length; i++){
            fs.unlink(`${appRoot}/${files[i].path}`, (err) => {
                if(err){
                    return next(CustomErrorHandler.serverError(err.message));
                }
            });
        }
    },

    async answerQuestion(req, res, next){
        console.log(req.files)

        handleMultipartData(req, res, async (err) => {


        //validate the request --------------------------------------------------------------------------------------------

        const answerSchema = Joi.object({
            title: Joi.string().required(),
            description: Joi.string().required(),
            bidId: Joi.string().required(),
            attachments:(req.body.attachments == '') ? Joi.string().valid('')
                                                        : Joi.array().items(),
        });

        const { error } = answerSchema.validate(req.body);

        if(error){
            //Delete the uploaded files --------------------------------------------------------------------------------------------
            deleteFiles(req.files);
            return next(error);
        }

        try {
            const { title, description, bidId } = req.body;

            //Check if the bid exists and is accepted ---------------------------------------------------------------------

            const bid = await Bid.findById(bidId);

            if(!bid || !bid.accepted){
                //Delete the uploaded files --------------------------------------------------------------------------------------------
                deleteFiles(req.files);
                if(!bid) {
                    return next(CustomErrorHandler.notFound('Bid not found'));
                }
                else if(!bid.accepted) {
                    return next(CustomErrorHandler.badRequest('Bid not accepted'));
                }
            }

            //Check if the bid belongs to the user ----------------------------------------------------------------------

            if(bid.user.toString() !== req.user._id.toString()){
                //Delete the uploaded files --------------------------------------------------------------------------------------------
                deleteFiles(req.files);
                return next(CustomErrorHandler.unAuthorized('You are not authorized to answer this question'));
            }

            //Check if the question has already been answered ------------------------------------------------------------------

            const question = await Question.findById(bid.questionId);

            if(question.answer){
                //Delete the uploaded files --------------------------------------------------------------------------------------------
                deleteFiles(req.files);
                return next(CustomErrorHandler.badRequest('Question already answered'));
            }

            //Create the answer ------------------------------------------------------------------------------------------------

            let paths = [];
                for(let i = 0; i < req.files.length; i++){
                    paths.push(req.files[i].path,);
                }

            const newAnswer = new Answer({
                title,
                description,
                attachments: paths,
                bidId,
                teacherId: req.user
            });

            const savedAnswer = await newAnswer.save();

            //Update the question with the new answer ------------------------------------------------------------------------------

            question.answer = savedAnswer._id;

            await question.save();

        }catch(err){
            return next(err);
        }

        return res.status(200).json({message: 'Answer submitted'});
    })
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
            deleteFiles(req.files);
        }catch(err){
            return next(err);
        }

        return res.status(200).json({message: 'Answer deleted'});

    }

}

export default answerController