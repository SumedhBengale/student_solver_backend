const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
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
            required: true,
        }
    ],
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    bids: [
        {
            user: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
                required: true,
            },
            amount: {
                type: Number,
                required: true,
            },
            accepted: {
                type: Boolean,
                default: false,
            },
        }
    ],
    answer : {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Answer',
        default : null,
    },

});

export default mongoose.model('Question', questionSchema, 'questions');