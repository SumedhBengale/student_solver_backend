import mongoose from 'mongoose';

const answerSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    questionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Question',
        required: true,
    },
    attachments: [
        {
            type: String,
        }
    ],
});

export default mongoose.model('Answer', answerSchema, 'answers');