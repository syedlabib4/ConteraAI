const ensureAuthenticated = require('../Middlewares/Auth');
const PipelineService = require('../Services/PipelineService');

const router = require('express').Router();

// POST /api/seo/outline - Generate SEO outline
router.post('/outline', ensureAuthenticated, async (req, res) => {
    try {
        const { topic, keywords } = req.body;
        if (!topic) {
            return res.status(400).json({
                success: false,
                message: 'Topic is required'
            });
        }

        const outline = PipelineService.runSeoStep(topic, keywords || []);
        res.status(200).json({
            success: true,
            data: outline
        });
    } catch (error) {
        console.error('SEO outline error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate SEO outline',
            error: error.message
        });
    }
});

// POST /api/seo/analyze - Analyze existing content for SEO
router.post('/analyze', ensureAuthenticated, async (req, res) => {
    try {
        const { content, keywords } = req.body;
        if (!content) {
            return res.status(400).json({
                success: false,
                message: 'Content is required'
            });
        }

        const analysis = PipelineService.analyzeContent(content, keywords || []);
        res.status(200).json({
            success: true,
            data: analysis
        });
    } catch (error) {
        console.error('SEO analysis error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to analyze content',
            error: error.message
        });
    }
});

module.exports = router;
