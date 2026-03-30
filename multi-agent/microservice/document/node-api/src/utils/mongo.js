require('dotenv').config();
const mongoose = require('mongoose');

const connectMongo = () => {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/documents';

    try {
        mongoose.connect(mongoUri);
        console.log('MongoDB connected successfully to database: documents');
    } catch (error) {
        console.error('Failed to connect to MongoDB:', error);
        process.exit(1);
    }
};

module.exports = connectMongo;