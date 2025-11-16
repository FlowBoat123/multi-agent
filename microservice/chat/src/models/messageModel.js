const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    conversationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Conversation',
        required: true
    },
    message: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['user', 'bot'],
        required: true
    },
    context: {
        type: String,
        default: null
    },
    documents: {
        type: Array,
        default: []
    },
}, {
    timestamps: true,
    toJSON: {
        virtuals: true,
        transform(doc, ret) {
            ret.id = ret._id.toString();
            delete ret._id;
            delete ret.__v;
            ret.documentId = ret.documentId ? ret.documentId.toString() : null;
        }
    },
    toObject: {
        virtuals: true,
        transform(doc, ret) {
            ret.id = ret._id.toString();
            delete ret._id;
            delete ret.__v;
            ret.documentId = ret.documentId ? ret.documentId.toString() : null;
        }
    }
});

module.exports = mongoose.model('Message', messageSchema, "messages");