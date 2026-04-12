const ensureAuthenticated = require('../Middlewares/Auth');
const PipelineService = require('../Services/PipelineService');

const router = require('express').Router();

// GET /api/trends - Fetch current trending topics
router.get('/', ensureAuthenticated, async (req, res) => {
    try {
        const region = req.query.region || 'US';
        const trends = await PipelineService.getTrending(region);
        res.status(200).json({
            success: true,
            data: trends,
            count: trends.length
        });
    } catch (error) {
        console.error('Trends fetch error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch trending topics',
            error: error.message
        });
    }
});

// POST /api/trends/analyze - Analyze a specific topic
router.post('/analyze', ensureAuthenticated, async (req, res) => {
    try {
        const { topic } = req.body;
        if (!topic) {
            return res.status(400).json({
                success: false,
                message: 'Topic is required'
            });
        }

        const analysis = await PipelineService.runTrendStep(topic);
        res.status(200).json({
            success: true,
            data: analysis
        });
    } catch (error) {
        console.error('Topic analysis error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to analyze topic',
            error: error.message
        });
    }
});

module.exports = router;
