const mongoose = require('mongoose');

const refreshTokenSchema = new mongoose.Schema({
    token: {
        type: String,
        required: true,
        unique: true
    },

}, { timestamps: false });

export default mongoose.model('RefreshToken', refreshTokenSchema, 'refreshTokens');