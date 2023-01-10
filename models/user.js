import { string } from 'joi';
import mongoose from 'mongoose';

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
    //Array of Questions

    questions: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Question',
    }]
}, { timestamps: true });

export default mongoose.model('User', userSchema, 'users');