import Joi from 'joi';
import { Question, Bid } from '../models';
import CustomErrorHandler from '../services/CustomErrorHandler';

const bidController = {

    async createBid(req, res, next){
            
        //Validate the request --------------------------------------------------------------------------------------------

        const bidSchema = Joi.object({
            amount: Joi.number().required(),
            questionId: Joi.string().required(),
            description: Joi.string().required(),
        });

        const { error } = bidSchema.validate(req.body);

        if(error){
            return next(error);
        }

        //Check if the question exists ---------------------------------------------------------------------------------------

        const { questionId, amount, description } = req.body;
        try{

            const question = await Question.findOne({_id: questionId});

            if(!question){
                return next(CustomErrorHandler.notFound('Question not found'));
            }

            //Check if the question has already been answered -------------------------------------------------------------------

            if(question.answer){
                return next(CustomErrorHandler.alreadyExists('Question already answered'));
            }

            //Check if the question has already has an accpted bid --------------------------------------------------------------

            if(question.acceptedBid){
                return next(CustomErrorHandler.alreadyExists('Question already has an accepted bid'));
            }

            //Check if the user has already placed a bid ------------------------------------------------------------------------
            const bid = await Bid.findOne({questionId: questionId, user: req.user})

            if(bid){
                return next(CustomErrorHandler.alreadyExists('You have already placed a bid on this question'));
            }

            //Create the bid ----------------------------------------------------------------------------------------------------

            const newBid = new Bid({
                amount,
                questionId,
                description,
                user: req.user
            });

            const savedBid = await newBid.save();

            //Update the question with the new bid ------------------------------------------------------------------------------
            console.log(savedBid._id)
            question.bids.push(savedBid._id);

            await question.save();



        }
        catch(err){
            return next(err);
        }

        return res.send('Bid created successfully');
    },

    async deleteBid(req, res, next){
        //Validate the request --------------------------------------------------------------------------------------------

        const bidSchema = Joi.object({
            bidId: Joi.string().required(),
        });

        const { error } = bidSchema.validate(req.body);

        if(error){
            return next(error);
        }

        //Check if the bid exists ---------------------------------------------------------------------------------------

        const { bidId } = req.body;
        try{
        
            const bid = await Bid.findOne({_id: bidId});

            if(!bid){
                return next(CustomErrorHandler.notFound('Bid not found'));
            }

            //Check if the bid belongs to the user ----------------------------------------------------------------------

            if(bid.user.toString() !== req.user._id.toString()){
                return next(CustomErrorHandler.unAuthorized('You are not authorized to delete this bid'));
            }

            //Delete the bid ----------------------------------------------------------------------------------------------

            await bid.remove();

            //Update the question with the new bid ------------------------------------------------------------------------

            const question = await Question.findOneAndUpdate({_id: bid.questionId}, {$pull: {bids: bidId}});

            if(!question){
                return next(CustomErrorHandler.notFound('Question not found'));
            }

        }catch(err){
            return next(err);
        }

        return res.send('Bid deleted successfully');
    },

    async acceptBid(req, res, next){
        
        //Validate the request -------------------------------------------------------------------------------------------

        const bidSchema = Joi.object({
            bidId: Joi.string().required(),
        });

        const { error } = bidSchema.validate(req.body);

        if(error){
            return next(error);
        }

        //Check if the bid exists ---------------------------------------------------------------------------------------

        const { bidId } = req.body;

        try{

            const bid = await Bid.findOne({_id: bidId});

            if(!bid){
                return next(CustomErrorHandler.notFound('Bid not found'));
            }

            //Check if the question in the bid belongs to the user ------------------------------------------------------

            const question = await Question.findOne({_id: bid.questionId});

            if(question.studentId.toString() !== req.user._id.toString()){
                return next(CustomErrorHandler.unAuthorized('You are not authorized to accept this bid'));
            }

            //Check if the question has already been answered ------------------------------------------------------------

            if(question.answer){
                return next(CustomErrorHandler.alreadyExists('Question already answered'));
            }

            //Check if the question has already has an accpted bid -------------------------------------------------------

            if(question.acceptedBid){
                return next(CustomErrorHandler.alreadyExists('Question already has an accepted bid'));
            }

            //Accept the bid ---------------------------------------------------------------------------------------------

            bid.accepted = true;

            await bid.save();


        }catch(err){
            return next(err);
        }

        return res.send('Bid accepted successfully');
    }

}

export default bidController;