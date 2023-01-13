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
    attachments: [
        {
            type: String,
        }
    ],
    teacherId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,

    },
    bidId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Bid',
        required: true,
    },
    accepted: {
        type: Boolean,
        default: false
    }
});

export default mongoose.model('Answer', answerSchema, 'answers');