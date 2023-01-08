import multer from 'multer';
import { Question } from '../models';
import path from 'path';
import CustomErrorHandler from '../services/CustomErrorHandler';
import fs from 'fs';
import Joi from 'joi';

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => {
        const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    }
});
const handleMultipartData = multer({ storage, limits: { fileSize: 1000000 * 10 } }).array('attachments', 10);  // 10MB max file size

const questionController = {

    async createQuestion(req, res, next){

        //MultiPart Form Data --------------------------------------------------------------------------------------------
        handleMultipartData(req, res, async (err) => {
            if(err){
                return next(CustomErrorHandler.serverError(err.message));
            }
            console.log(req.files)

            //Validate Request --------------------------------------------------------------------------------------------

            const questionSchema = Joi.object({
                title: Joi.string().required(),
                description: Joi.string().required(),
                subject: Joi.string().required(),
                studentId: Joi.string().required(),
            });

            const { error } = questionSchema.validate(req.body);

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

            //Store Question into Database --------------------------------------------------------------------------------------------
            
            const { title, description, subject, studentId } = req.body;
            let paths = [];
            for(let i = 0; i < req.files.length; i++){
                paths.push(req.files[i].path,);
            }

            console.log(paths);
            try{
            const question = new Question({
                title,
                description,
                subject,
                studentId,
                attachments: paths,
            });
            await question.save();
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
            return res.status(201).json({message: 'Question Created'});

        });
    },

    updateQuestion(req, res, next){

        handleMultipartData(req, res, async (err) => {

            if(err){
                return next(CustomErrorHandler.serverError(err.message));
            }

            //Validate Request --------------------------------------------------------------------------------------------

            const questionSchema = Joi.object({
                id: Joi.string().required(),
                title: Joi.string(),
                description: Joi.string(),
                subject: Joi.string(),
                studentId: Joi.string()
            });

            const { error } = questionSchema.validate(req.body);

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

            //Update the Question --------------------------------------------------------------------------------------------

            try{

                const { id, title, description, subject, studentId } = req.body;
                let paths = [];
                for(let i = 0; i < req.files.length; i++){
                    paths.push(req.files[i].path,);
                }

                const update = await Question.findByIdAndUpdate(id, {
                    title,
                    description,
                    subject,
                    studentId,
                    ...(paths.length > 0 && {attachments: paths})
                    
                });
                
                if(!update){
                    return next(CustomErrorHandler.notFound('Question not found'));
                }

                
            }catch(err){

                return next(err);

            }

            return res.status(201).json({message: 'Question Updated'});
        });
    },

    async addBid(req, res, next){

        //Validate Request --------------------------------------------------------------------------------------------

        const questionSchema = Joi.object({
            questionId: Joi.string().required(),
            teacherId: Joi.string().required(),
            amount: Joi.number().required(),
        });

        const { error } = questionSchema.validate(req.body);

        if(error){
            return next(error);
        }

        const { teacherId, amount, questionId } = req.body;

        try{

            //Check if a bid from the same teacher exists --------------------------------------------------------------------------------------------

            const bid = await Question.findOne({_id: questionId, 'bids.teacherId': teacherId});

            if(bid){
                return next(CustomErrorHandler.alreadyExists('You have already bid on this question'));
            }


            //Add the bid --------------------------------------------------------------------------------------------
            const update = await Question.findByIdAndUpdate(questionId, {
                $push: {
                    bids: {
                        teacherId,
                        amount,
                    }
                }
            });

            if(!update){
                return next(CustomErrorHandler.notFound('Question not found'));
            }

        }catch(err){
            return next(err);
        }

        return res.status(201).json({message: 'Bid Added'});

    },

    async deleteBid(req, res, next){
            
            //Validate Request --------------------------------------------------------------------------------------------
    
            const questionSchema = Joi.object({
                questionId: Joi.string().required(),
                teacherId: Joi.string().required(),
            });
    
            const { error } = questionSchema.validate(req.body);
    
            if(error){
                return next(error);
            }
    
            const { teacherId, questionId } = req.body;
    
            try{
    
                //Check if a bid from the same teacher exists --------------------------------------------------------------------------------------------

                const bid = await Question.findOne({_id: questionId, 'bids.teacherId': teacherId});

                if(!bid){
                    return next(CustomErrorHandler.notFound('Bid not found'));
                }

                //Delete the bid --------------------------------------------------------------------------------------------
                const update = await Question.findByIdAndUpdate(questionId, {
                    $pull: {
                        bids: {
                            teacherId,
                        }
                    }
                })
            }catch(err){
                return next(err);
            }

            return res.status(201).json({message: 'Bid Deleted'});
    
    },

    async acceptBid(req, res, next){

        //Validate Request --------------------------------------------------------------------------------------------
        
        const questionSchema = Joi.object({
            bidId: Joi.string().required(),
            questionId: Joi.string().required(),
        });

        const { error } = questionSchema.validate(req.body);

        if(error){
            return next(error);
        }

        const { questionId, bidId } = req.body;

        try{

            //Check if the question exists
            //Only select bids and answer to reduce the size of the response --------------------------------------------------------------------------------------------

            const question = await Question.findById(questionId).select('bids answer');

            if(!question){
                return next(CustomErrorHandler.notFound('Question not found'));
            }

            //Check if the question has an accepted answer --------------------------------------------------------------------------------------------

            if(question.answer){
                return next(CustomErrorHandler.alreadyExists('Question already has an accepted answer'));
            }

            //Check if the question has bids --------------------------------------------------------------------------------------------

            if(question.bids.length === 0){
                return next(CustomErrorHandler.badRequest('Question has no bids'));
            }

            //Check if the bid exists --------------------------------------------------------------------------------------------

            const bid = question.bids.find(bid => bid._id == bidId);

            if(!bid){
                return next(CustomErrorHandler.notFound('Bid not found'));
            }

            //Accept the bid --------------------------------------------------------------------------------------------

            const update = await Question.findOne({'bids._id': bidId})

            if(!update){
                return next(CustomErrorHandler.notFound('Question not found'));
            }

            try{

                update.bids.id(bidId).accepted = true;
                await update.save();

            }catch(err){
                return next(err);
            }


        }catch(err){
            return next(err);
        }

        return res.status(201).json({message: 'Bid Accepted'});

    },

    async acceptAnswer(req, res, next){

        //Validate Request --------------------------------------------------------------------------------------------

        const questionSchema = Joi.object({
            questionId: Joi.string().required(),
            answerId: Joi.string().required(),
        });

        const { error } = questionSchema.validate(req.body);

        if(error){
            return next(error);
        }

        const { questionId, answerId } = req.body;

        try{

            //Check if an answer has already been accepted --------------------------------------------------------------------------------------------

            const question = await Question.findById(questionId).select('answer');

            if(question.answer != null){
                return next(CustomErrorHandler.alreadyExists('Question already has an accepted answer'));
            }

            //Save the answer --------------------------------------------------------------------------------------------

            const update = await Question.findByIdAndUpdate(questionId, {
                answer: answerId
            })

            if(!update){
                return next(CustomErrorHandler.notFound('Question not found'));
            }


        }catch(err){
            return next(err);
        }

        return res.status(201).json({message: 'Answer Accepted'});


    }

}

export default questionController;