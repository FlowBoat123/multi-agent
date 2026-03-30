const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
    user: {
        id: { type: String, required: true },
        username: { type: String, required: true },
        email: { type: String, required: true },
        avatar: { type: String, default: 'https://example.com/default-avatar.png' },
        role: { type: String, enum: ['user', 'admin'], default: 'user' }
    },
    name: { type: String, required: true, },
    visitedAt: { type: Date, default: Date.now },
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

module.exports = mongoose.model('Conversation', conversationSchema, "conversations");