const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ContentSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'users',
        required: true
    },
    title: {
        type: String,
        required: true
    },
    body: {
        type: String,
        required: true
    },
    topic: {
        type: String,
        required: true
    },
    keywords: [{
        type: String
    }],
    seoScore: {
        type: Number,
        default: 0
    },
    outline: {
        metaDescription: String,
        headings: [String],
        titleSuggestions: [String]
    },
    trendData: {
        source: String,
        relatedTopics: [String],
        popularityScore: Number
    },
    wordCount: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ['draft', 'generated', 'optimized', 'published'],
        default: 'generated'
    }
}, { timestamps: true });

const ContentModel = mongoose.model('contents', ContentSchema);
module.exports = ContentModel;
