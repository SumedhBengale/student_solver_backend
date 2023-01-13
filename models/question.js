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
    subject: {
        type: String,
        required: true,
    },
    attachments: [
        {
            type: String,
        }
    ],
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    bids: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Bid',
    }],
    acceptedBid: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Bid',
        default: null,
    },
    answer : {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Answer',
        default : null,
    },

});

export default mongoose.model('Question', questionSchema, 'questions');