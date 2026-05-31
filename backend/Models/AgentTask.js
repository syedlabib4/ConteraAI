const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const AgentTaskSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'users', required: true },
    type: {
        type: String,
        enum: ['full-pipeline', 'trend-research', 'seo-outline', 'content-generation', 'image-generation', 'social-posting', 'scheduled-pipeline'],
        required: true
    },
    status: {
        type: String,
        enum: ['queued', 'running', 'completed', 'failed', 'scheduled', 'cancelled'],
        default: 'queued'
    },
    topic: { type: String, required: true },
    options: {
        tone: { type: String, default: 'professional' },
        length: { type: String, default: 'medium' },
        platforms: [String],
        imageStyle: { type: String, default: 'photorealistic' },
        autoPost: { type: Boolean, default: false },
        schedule: { type: String }, // cron expression
        scheduleLabel: { type: String } // human-readable schedule
    },
    // Agent execution log - each step the agent took
    agentLog: [{
        agent: String,     // which agent ran
        action: String,    // what it did
        status: String,    // success/failed
        duration: Number,  // ms
        timestamp: { type: Date, default: Date.now },
        data: Schema.Types.Mixed // summary output
    }],
    // Results from each agent
    results: {
        trends: Schema.Types.Mixed,
        seo: Schema.Types.Mixed,
        content: Schema.Types.Mixed,
        images: Schema.Types.Mixed,
        social: Schema.Types.Mixed
    },
    // Final output
    contentId: { type: Schema.Types.ObjectId, ref: 'contents' },
    error: String,
    startedAt: Date,
    completedAt: Date,
    scheduledFor: Date,
    nextRun: Date
}, { timestamps: true });

AgentTaskSchema.index({ userId: 1, createdAt: -1 });
AgentTaskSchema.index({ status: 1 });

const AgentTask = mongoose.model('agent_tasks', AgentTaskSchema);
module.exports = AgentTask;
