import mongoose from "mongoose";

const bidSchema = new mongoose.Schema({
    amount: {
        type: Number,
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    questionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Question',
        required: true
    },
    description: {
        type: String,
        required: true
    },
    accepted: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

export default mongoose.model('Bid', bidSchema);