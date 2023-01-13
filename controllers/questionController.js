import multer from 'multer';
import { Question, User, Answer } from '../models';
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

    deleteFiles(files){

        for(let i = 0; i < files.length; i++){
            fs.unlink(`${appRoot}/${files[i].path}`, (err) => {
                if(err){
                    return next(CustomErrorHandler.serverError(err.message));
                }
            });
        }

    },

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
                // attachments: (req.body.attchments =='')? Joi.string() : Joi.array().items(),
                attachments:(req.body.attachments == '') ? Joi.string().valid('')
                                    : Joi.array().items(),
            });

            const { error } = questionSchema.validate(req.body);
            if(error){
                //Delete the uploaded files --------------------------------------------------------------------------------------------
                deleteFiles(req.files);
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
                "studentId": req.user._id,
                attachments: paths,
            });
            await question.save();

            //Add QuestionId to Questions Array in User Model ----------------------------------------------------------------------------
            const update = await User
                    .findByIdAndUpdate(req.user._id
                        , { $push: { questions: question._id.toString()} }
                        , { new: true }
                    );

                if(!update){
                    return next(CustomErrorHandler.notFound('Question not found'));
                }


            }catch(err){
                //Delete the uploaded files --------------------------------------------------------------------------------------------
                deleteFiles(req.files);
                return next(err);
            }
            return res.status(201).json({message: 'Question Created'});

        });
    },

    async myQuestions(req, res, next){
        //Validate Request --------------------------------------------------------------------------------------------

        

        const studentId = req.user._id;
        console.log(studentId);

        try{

            //Get all Questions from User
            const questions = await User.findById(studentId).select('questions');
            
            //Get all Questions from Question Model and select name and description
            let questionsArray = [];
            for(let i = 0; i < questions.questions.length; i++){
                questionsArray[i] = await Question.findById(questions.questions[i]).select('name description');
            }
            return res.send(questionsArray);


        }catch(err){
            return next(err);
        }

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
                studentId: Joi.string(),
                attachments:(req.body.attachments == '') ? Joi.string().valid('')
                                                         : Joi.array().items(),
            });

            const { error } = questionSchema.validate(req.body);

            if(error){
                //Delete the uploaded files --------------------------------------------------------------------------------------------
                deleteFiles(req.files);
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

    async deleteQuestion(req, res, next){
            
            //Validate Request --------------------------------------------------------------------------------------------
    
            const questionSchema = Joi.object({
                id: Joi.string().required(),
            });
    
            const { error } = questionSchema.validate(req.body);
    
            if(error){
                return next(error);
            }
            
            //Delete the Question if the user is the owner ----------------------------------------------------------------

            const { id } = req.body;
            try{
                    
                    const question = await Question.findById(id);
                    if(!question){
                        return next(CustomErrorHandler.notFound('Question not found'));
                    }

                    if(question.studentId.toString() !== req.user._id.toString()){
                        return next(CustomErrorHandler.unauthorized('You are not allowed to delete this question'));
                    }

                    await Question.findByIdAndDelete(id);

                    //Delete the question from the user model -------------------------------------------------------------

                    await User.findByIdAndUpdate(req.user._id, { $pull: { questions: id } }, { new: true });

                    //Delete the files from the server -------------------------------------------------------------------

                    deleteFiles(req.files);

            }catch(err){
                return next(err);
            }

            return res.status(201).json({message: 'Question Deleted'});
        
    },

    async acceptAnswer(req, res, next){

        //Validate Request --------------------------------------------------------------------------------------------

        const questionSchema = Joi.object({
            questionId: Joi.string().required(),
        });

        const { error } = questionSchema.validate(req.body);

        if(error){
            return next(error);
        }

        const { questionId } = req.body;

        try{

            const question = await Question.findById(questionId);
            if(!question){
                return next(CustomErrorHandler.notFound('Question not found'));
            }

            if(question.studentId.toString() !== req.user._id.toString()){
                return next(CustomErrorHandler.unauthorized('You are not allowed to accept this answer'));
            }

            //Check if question has an answer --------------------------------------------------------------------------------------------

            if(!question.answer){
                return next(CustomErrorHandler.notFound('Question does not have an answer'));
            }

            //Check if the answer is already accepted --------------------------------------------------------------------------------------------

            const answer = await Answer.findById(question.answer);

            if(answer.accepted){
                return next(CustomErrorHandler.badRequest('Answer is already accepted'));
            }

            // TODO: Send the payment to the tutor --------------------------------------------------------------------------------------------
            // This is where I want to send the payment to the tutor --------------------------------------------------------------------------


            //Accept the answer ------------------------------------------------------------------------------------------------------------------


            const update = await answer.updateOne({accepted: true});

            if(!update){
                return next(CustomErrorHandler.notFound('Answer not found'));
            }


        }catch(err){
            return next(err);
        }

        return res.status(201).json({message: 'Answer Accepted'});


    },

    async downloadAttachments(req, res, next){

        //Validate Request --------------------------------------------------------------------------------------------

        const questionSchema = Joi.object({
            questionId: Joi.string().required(),
        });

        const { error } = questionSchema.validate(req.body);

        if(error){
            return next(error);
        }

        const { questionId } = req.body;

        try{
                
                //Check if the question exists --------------------------------------------------------------------------------------------
    
                const attachments = await Question.findById(questionId).select('attachments');

                if(!attachments){
                    return next(CustomErrorHandler.notFound('Question does not have any attachments'));
                }

                //Send the attachment path to the client ----------------------------------------------------------------------------------

                let attachmentsArray = [];
                for(let i = 0; i < attachments.attachments.length; i++){
                    attachmentsArray.push(attachments.attachments[i]);
                }

                return res.status(200).json({attachmentsArray});

            }catch(err){
                return next(err);
            }

    }

}

export default questionController;