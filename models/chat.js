import { string } from 'joi';
import mongoose from 'mongoose';

const chatSchema = new mongoose.Schema({

    participants: [{
        type:mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }],

    //Messages should contain text string with owner id

    messages: [{
        text: {
            type: String,
            required: true
        },
        owner: {
            type: String,
            required: true
        }
    }]
});

export default mongoose.model('Chat', chatSchema, 'chats');