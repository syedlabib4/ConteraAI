const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ProjectSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'users',
        required: true
    },
    name: {
        type: String,
        required: true
    },
    topic: {
        type: String,
        required: true
    },
    niche: {
        type: String,
        default: 'general'
    },
    contents: [{
        type: Schema.Types.ObjectId,
        ref: 'contents'
    }]
}, { timestamps: true });

const ProjectModel = mongoose.model('projects', ProjectSchema);
module.exports = ProjectModel;
