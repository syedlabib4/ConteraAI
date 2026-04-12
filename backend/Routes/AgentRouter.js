const ensureAuthenticated = require('../Middlewares/Auth');
const AgentOrchestrator = require('../Services/AgentOrchestrator');
const SchedulerService = require('../Services/SchedulerService');
const AgentTask = require('../Models/AgentTask');

const router = require('express').Router();

// POST /api/agent/run - Run full autonomous pipeline
router.post('/run', ensureAuthenticated, async (req, res) => {
    try {
        const { topic, tone, length, platforms, imageStyle, imageCount, autoPost } = req.body;
        if (!topic) {
            return res.status(400).json({ success: false, message: 'Topic is required' });
        }

        // Start the pipeline asynchronously but return the task ID immediately
        const userId = req.user._id;

        // Create a quick-response task and start pipeline in background
        const task = await AgentOrchestrator.runAutonomousPipeline(userId, topic, {
            tone, length, platforms, imageStyle, imageCount, autoPost
        });

        res.status(200).json({
            success: true,
            data: task
        });
    } catch (error) {
        console.error('Agent run error:', error);
        res.status(500).json({ success: false, message: error.message || 'Agent pipeline failed' });
    }
});

// GET /api/agent/task/:id - Get task status (for polling)
router.get('/task/:id', ensureAuthenticated, async (req, res) => {
    try {
        const task = await AgentOrchestrator.getTaskStatus(req.params.id);
        if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
        res.status(200).json({ success: true, data: task });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to get task status' });
    }
});

// GET /api/agent/history - Get user's task history
router.get('/history', ensureAuthenticated, async (req, res) => {
    try {
        const tasks = await AgentOrchestrator.getUserTasks(req.user._id, parseInt(req.query.limit) || 20);
        res.status(200).json({ success: true, data: tasks });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to get history' });
    }
});

// GET /api/agent/analytics - Get agent analytics
router.get('/analytics', ensureAuthenticated, async (req, res) => {
    try {
        const analytics = await AgentOrchestrator.getAnalytics(req.user._id);
        res.status(200).json({ success: true, data: analytics });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to get analytics' });
    }
});

// POST /api/agent/schedule - Schedule a recurring pipeline
router.post('/schedule', ensureAuthenticated, async (req, res) => {
    try {
        const { topic, preset, cronExpression, ...options } = req.body;
        if (!topic) return res.status(400).json({ success: false, message: 'Topic is required' });

        let cronExpr = cronExpression;
        let label = options.label || 'Custom Schedule';

        if (preset && SchedulerService.constructor.PRESETS[preset]) {
            cronExpr = SchedulerService.constructor.PRESETS[preset].cron;
            label = SchedulerService.constructor.PRESETS[preset].label;
        }

        if (!cronExpr) return res.status(400).json({ success: false, message: 'Schedule is required' });

        const task = await SchedulerService.scheduleTask(req.user._id, topic, cronExpr, { ...options, label });
        res.status(200).json({ success: true, data: task });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message || 'Failed to schedule' });
    }
});

// GET /api/agent/schedules - Get active schedules
router.get('/schedules', ensureAuthenticated, async (req, res) => {
    try {
        const jobs = SchedulerService.getScheduledJobs();
        res.status(200).json({ success: true, data: jobs });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to get schedules' });
    }
});

// DELETE /api/agent/schedule/:id - Cancel a schedule
router.delete('/schedule/:id', ensureAuthenticated, async (req, res) => {
    try {
        const cancelled = SchedulerService.cancelSchedule(req.params.id);
        if (cancelled) {
            await AgentTask.findByIdAndUpdate(req.params.id, { status: 'cancelled' });
            res.status(200).json({ success: true, message: 'Schedule cancelled' });
        } else {
            res.status(404).json({ success: false, message: 'Schedule not found' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to cancel schedule' });
    }
});

// PUT /api/agent/schedule/:id - Edit a pipeline schedule
router.put('/schedule/:id', ensureAuthenticated, async (req, res) => {
    try {
        const { cronExpression, label } = req.body;
        if (!cronExpression) return res.status(400).json({ success: false, message: 'Schedule is required' });

        const task = await SchedulerService.editPipelineSchedule(req.params.id, cronExpression, label);
        res.status(200).json({ success: true, message: 'Schedule updated successfully', data: task });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message || 'Failed to edit schedule' });
    }
});

// GET /api/agent/presets - Get schedule presets
router.get('/presets', ensureAuthenticated, (req, res) => {
    const presets = Object.entries(SchedulerService.constructor.PRESETS).map(([key, value]) => ({
        id: key, ...value
    }));
    res.status(200).json({ success: true, data: presets });
});

// POST /api/agent/schedule-one-time - Schedule an exact date/time post
router.post('/schedule-one-time', ensureAuthenticated, async (req, res) => {
    try {
        const { caption, imageUrl, scheduledTime } = req.body;
        if (!caption || !imageUrl || !scheduledTime) {
            return res.status(400).json({ success: false, message: 'Missing parameters' });
        }

        const targetDate = new Date(scheduledTime);
        const id = SchedulerService.scheduleExactPost(caption, imageUrl, targetDate.getTime());

        res.status(200).json({ success: true, message: `Post successfully scheduled for ${targetDate.toLocaleString()}`, data: { id } });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message || 'Failed to schedule post' });
    }
});

// GET /api/agent/schedule-one-time - List single posts
router.get('/schedule-one-time', ensureAuthenticated, (req, res) => {
    try {
        const posts = SchedulerService.getExactPosts();
        res.status(200).json({ success: true, data: posts });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to list posts' });
    }
});

// DELETE /api/agent/schedule-one-time/:id - Delete single post
router.delete('/schedule-one-time/:id', ensureAuthenticated, (req, res) => {
    try {
        const cancelled = SchedulerService.cancelExactPost(req.params.id);
        if (cancelled) {
            res.status(200).json({ success: true, message: 'Scheduled post cancelled' });
        } else {
            res.status(404).json({ success: false, message: 'Post not found' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to cancel post' });
    }
});

// PUT /api/agent/schedule-one-time/:id - Edit single post time
router.put('/schedule-one-time/:id', ensureAuthenticated, (req, res) => {
    try {
        const newTargetDate = new Date(req.body.scheduledTime);
        const updated = SchedulerService.editExactPost(req.params.id, newTargetDate.getTime());
        res.status(200).json({ success: true, message: 'Post schedule updated', data: updated });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message || 'Failed to update post' });
    }
});

// POST /api/agent/cancel/:id - Cancel a running task
router.post('/cancel/:id', ensureAuthenticated, async (req, res) => {
    try {
        const cancelled = await AgentOrchestrator.cancelTask(req.params.id);
        res.status(200).json({ success: cancelled, message: cancelled ? 'Task cancelled' : 'Task not found or not running' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to cancel task' });
    }
});

module.exports = router;
