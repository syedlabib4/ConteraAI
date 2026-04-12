const cron = require('node-cron');
const AgentOrchestrator = require('./AgentOrchestrator');
const AgentTask = require('../Models/AgentTask');

class SchedulerService {
    constructor() {
        this.scheduledJobs = new Map();
        this.scheduledSinglePosts = new Map();
        console.log('⏰ Scheduler Service initialized');
    }

    /**
     * Schedule a recurring autonomous pipeline
     */
    async scheduleTask(userId, topic, cronExpression, options = {}) {
        const { label = 'Scheduled Pipeline' } = options;

        // Validate cron expression
        if (!cron.validate(cronExpression)) {
            throw new Error(`Invalid schedule expression: ${cronExpression}`);
        }

        // Create the task record
        const task = new AgentTask({
            userId,
            type: 'scheduled-pipeline',
            topic,
            status: 'scheduled',
            options: { ...options, schedule: cronExpression, scheduleLabel: label },
            scheduledFor: new Date(),
            nextRun: this.getNextRunDate(cronExpression)
        });
        await task.save();

        // Setup the cron job
        const job = cron.schedule(cronExpression, async () => {
            console.log(`⏰ Running scheduled pipeline for topic: "${topic}"`);
            try {
                await AgentOrchestrator.runAutonomousPipeline(userId, topic, options);
                // Update next run
                task.nextRun = this.getNextRunDate(cronExpression);
                await task.save();
            } catch (error) {
                console.error(`Scheduled pipeline failed for "${topic}":`, error.message);
            }
        }, { scheduled: true });

        this.scheduledJobs.set(task._id.toString(), { job, task });

        return task;
    }

    /**
     * Cancel a scheduled task
     */
    cancelSchedule(taskId) {
        const entry = this.scheduledJobs.get(taskId);
        if (entry) {
            entry.job.stop();
            this.scheduledJobs.delete(taskId);
            return true;
        }
        return false;
    }

    /**
     * Edit a pipeline schedule
     */
    async editPipelineSchedule(taskId, newCronExpression, newLabel) {
        if (!cron.validate(newCronExpression)) {
            throw new Error(`Invalid schedule expression: ${newCronExpression}`);
        }

        const task = await AgentTask.findById(taskId);
        if (!task) throw new Error('Task not found in Database');

        const entry = this.scheduledJobs.get(taskId);
        if (!entry) throw new Error('Job is not active in memory');

        // Stop old job
        entry.job.stop();

        // Update task DB record
        task.options.schedule = newCronExpression;
        task.options.scheduleLabel = newLabel || task.options.scheduleLabel;
        task.nextRun = this.getNextRunDate(newCronExpression);
        await task.save();

        // Setup the new cron job
        const job = cron.schedule(newCronExpression, async () => {
            console.log(`⏰ Running scheduled pipeline for topic: "${task.topic}"`);
            try {
                await AgentOrchestrator.runAutonomousPipeline(task.userId, task.topic, task.options);
                task.nextRun = this.getNextRunDate(newCronExpression);
                await task.save();
            } catch (error) {
                console.error(`Scheduled pipeline failed for "${task.topic}":`, error.message);
            }
        }, { scheduled: true });

        // Update tracking map
        entry.job = job;
        entry.task = task;

        return task;
    }

    /**
     * Get all scheduled jobs
     */
    getScheduledJobs() {
        const jobs = [];
        this.scheduledJobs.forEach((value, key) => {
            jobs.push({
                taskId: key,
                topic: value.task.topic,
                schedule: value.task.options?.schedule,
                scheduleLabel: value.task.options?.scheduleLabel,
                nextRun: value.task.nextRun,
                status: 'active'
            });
        });
        return jobs;
    }

    /**
     * Calculate next run date from cron expression
     */
    getNextRunDate(cronExpression) {
        // Simple approximation for display purposes
        const now = new Date();
        const parts = cronExpression.split(' ');
        // For common patterns, give a rough next run
        if (cronExpression === '0 9 * * 1-5') return this.nextWeekday(now, 9, 0); // 9 AM weekdays
        if (cronExpression === '0 9 * * 1') return this.nextDayOfWeek(now, 1, 9); // Monday 9 AM
        if (cronExpression === '0 9 * * *') { // Daily 9 AM
            const next = new Date(now);
            next.setHours(9, 0, 0, 0);
            if (next <= now) next.setDate(next.getDate() + 1);
            return next;
        }
        // Default: next hour
        const next = new Date(now);
        next.setHours(next.getHours() + 1, 0, 0, 0);
        return next;
    }

    nextWeekday(from, hour, minute) {
        const d = new Date(from);
        d.setHours(hour, minute, 0, 0);
        if (d <= from) d.setDate(d.getDate() + 1);
        while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() + 1);
        return d;
    }

    nextDayOfWeek(from, dayOfWeek, hour) {
        const d = new Date(from);
        d.setHours(hour, 0, 0, 0);
        const diff = (dayOfWeek - d.getDay() + 7) % 7;
        d.setDate(d.getDate() + (diff === 0 && d <= from ? 7 : diff));
        return d;
    }

    /**
     * Preset schedules for convenience
     */
    static PRESETS = {
        'every-minute': { cron: '* * * * *', label: 'Every minute' },
        'daily-morning': { cron: '0 9 * * *', label: 'Every day at 9:00 AM' },
        'weekdays-morning': { cron: '0 9 * * 1-5', label: 'Weekdays at 9:00 AM' },
        'weekly-monday': { cron: '0 9 * * 1', label: 'Every Monday at 9:00 AM' },
        'twice-weekly': { cron: '0 9 * * 1,4', label: 'Mon & Thu at 9:00 AM' },
        'every-6-hours': { cron: '0 */6 * * *', label: 'Every 6 hours' },
        'every-12-hours': { cron: '0 */12 * * *', label: 'Every 12 hours' }
    };

    /**
     * Exact Date/Time Single Post Scheduling
     */
    scheduleExactPost(caption, imageUrl, targetDateMs) {
        const id = Date.now().toString() + Math.random().toString(36).substring(7);
        const delayMs = targetDateMs - Date.now();

        if (delayMs <= 0) throw new Error('Time must be in the future');

        const timeout = setTimeout(async () => {
            console.log(`⏰ Executing exact-time scheduled Instagram post for ID ${id}...`);
            const SocialMediaAgent = require('./SocialMediaAgent');
            try {
                await SocialMediaAgent.publishToInstagram(caption, imageUrl);
            } catch (err) {
                console.error('Scheduled post failed:', err.message);
            }
            this.scheduledSinglePosts.delete(id);
        }, delayMs);

        this.scheduledSinglePosts.set(id, {
            id,
            timeout,
            caption,
            imageUrl,
            targetDate: new Date(targetDateMs)
        });

        return id;
    }

    cancelExactPost(id) {
        const post = this.scheduledSinglePosts.get(id);
        if (post) {
            clearTimeout(post.timeout);
            this.scheduledSinglePosts.delete(id);
            return true;
        }
        return false;
    }

    editExactPost(id, newTargetDateMs) {
        const post = this.scheduledSinglePosts.get(id);
        if (!post) throw new Error('Post not found');

        // Cancel old
        clearTimeout(post.timeout);

        // Schedule new
        const delayMs = newTargetDateMs - Date.now();
        if (delayMs <= 0) {
            this.scheduledSinglePosts.delete(id);
            throw new Error('New time must be in the future');
        }

        const timeout = setTimeout(async () => {
            console.log(`⏰ Executing edited exact-time scheduled post for ID ${id}...`);
            const SocialMediaAgent = require('./SocialMediaAgent');
            try {
                await SocialMediaAgent.publishToInstagram(post.caption, post.imageUrl);
            } catch (err) {
                console.error('Scheduled post failed:', err.message);
            }
            this.scheduledSinglePosts.delete(id);
        }, delayMs);

        post.timeout = timeout;
        post.targetDate = new Date(newTargetDateMs);

        return post;
    }

    getExactPosts() {
        return Array.from(this.scheduledSinglePosts.values()).map(p => ({
            id: p.id,
            caption: p.caption,
            imageUrl: p.imageUrl,
            targetDate: p.targetDate
        }));
    }
}

module.exports = new SchedulerService();
