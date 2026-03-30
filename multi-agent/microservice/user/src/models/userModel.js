const mongoose = require('mongoose');

// Định nghĩa schema
const userSchema = new mongoose.Schema({
    google_id: { type: String, unique: false },
    birthdate: { type: Date },
    username: { type: String },
    password: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    roles: { type: String, enum: ['user', 'admin'], default: 'user' },
    avatar: { type: String, default: 'https://example.com/default-avatar.png' },
}, {
    timestamps: true,
    toJSON: {
        virtuals: true,
        transform(doc, ret) {
            ret.id = ret._id.toString();
            delete ret._id;
            delete ret.__v;
        }
    },
    toObject: {
        virtuals: true,
        transform(doc, ret) {
            ret.id = ret._id.toString();
            delete ret._id;
            delete ret.__v;
        }
    }
});


module.exports = mongoose.model('User', userSchema, 'users');