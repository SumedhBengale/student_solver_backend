import { string } from 'joi';
import mongoose from 'mongoose';
import { Chat } from '.';

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        min: 5,
        max: 30,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        enum: ['student', 'teacher'],
        default: 'student',
    },
    token_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'RefreshToken',
    },
    //Array of Questions

    questions: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Question',
    }],
    chats: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: Chat,
    }],
}, { timestamps: true });

export default mongoose.model('User', userSchema, 'users');