const mongoose = require('mongoose');

const OtpSchema = new mongoose.Schema({
    otp: { type: String, unique: true, required: true },
    email: { type: String, required: true },
    expire: { type: Date, required: true },
}, { timestamps: true });

module.exports = mongoose.model('Otp', OtpSchema, 'otps');