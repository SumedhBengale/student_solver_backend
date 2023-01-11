const mongoose = require('mongoose');

const refreshTokenSchema = new mongoose.Schema({
    user_id:{
        type: String,
        required: true,
    },
    token: {
        type: String,
        required: true,
        unique: true
    },

}, { timestamps: false });

export default mongoose.model('RefreshToken', refreshTokenSchema, 'refreshTokens');