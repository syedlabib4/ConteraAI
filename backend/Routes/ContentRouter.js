const ensureAuthenticated = require('../Middlewares/Auth');
const PipelineService = require('../Services/PipelineService');
const ContentModel = require('../Models/Content');

const router = require('express').Router();

// POST /api/content/generate - Generate content from outline
router.post('/generate', ensureAuthenticated, async (req, res) => {
    try {
        const { outline, options } = req.body;
        if (!outline || !outline.topic) {
            return res.status(400).json({
                success: false,
                message: 'Outline with topic is required'
            });
        }

        const content = await PipelineService.runContentStep(outline, options || {});
        res.status(200).json({
            success: true,
            data: content
        });
    } catch (error) {
        console.error('Content generation error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate content',
            error: error.message
        });
    }
});

// POST /api/content/regenerate-section - Regenerate a specific section
router.post('/regenerate-section', ensureAuthenticated, async (req, res) => {
    try {
        const { outline, sectionHeading, feedback, options } = req.body;
        if (!outline || !sectionHeading) {
            return res.status(400).json({
                success: false,
                message: 'Outline and section heading are required'
            });
        }

        const result = await PipelineService.regenerateSection(outline, sectionHeading, feedback, options || {});
        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Section regeneration error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to regenerate section',
            error: error.message
        });
    }
});

// POST /api/content/save - Save generated content
router.post('/save', ensureAuthenticated, async (req, res) => {
    try {
        const { title, body, topic, keywords, seoScore, outline, trendData, wordCount } = req.body;
        if (!title || !body || !topic) {
            return res.status(400).json({
                success: false,
                message: 'Title, body, and topic are required'
            });
        }

        const content = new ContentModel({
            userId: req.user._id,
            title,
            body,
            topic,
            keywords: keywords || [],
            seoScore: seoScore || 0,
            outline: outline || {},
            trendData: trendData || {},
            wordCount: wordCount || body.split(/\s+/).length,
            status: 'generated'
        });

        await content.save();

        res.status(201).json({
            success: true,
            message: 'Content saved successfully',
            data: content
        });
    } catch (error) {
        console.error('Content save error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to save content',
            error: error.message
        });
    }
});

// GET /api/content/history - Get user's content history
router.get('/history', ensureAuthenticated, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const contents = await ContentModel.find({ userId: req.user._id })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .select('-body'); // exclude body for listing

        const total = await ContentModel.countDocuments({ userId: req.user._id });

        res.status(200).json({
            success: true,
            data: contents,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Content history error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch content history',
            error: error.message
        });
    }
});

// GET /api/content/:id - Get specific content
router.get('/:id', ensureAuthenticated, async (req, res) => {
    try {
        const content = await ContentModel.findOne({
            _id: req.params.id,
            userId: req.user._id
        });

        if (!content) {
            return res.status(404).json({
                success: false,
                message: 'Content not found'
            });
        }

        res.status(200).json({
            success: true,
            data: content
        });
    } catch (error) {
        console.error('Content fetch error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch content',
            error: error.message
        });
    }
});

// DELETE /api/content/:id - Delete content
router.delete('/:id', ensureAuthenticated, async (req, res) => {
    try {
        const content = await ContentModel.findOneAndDelete({
            _id: req.params.id,
            userId: req.user._id
        });

        if (!content) {
            return res.status(404).json({
                success: false,
                message: 'Content not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Content deleted successfully'
        });
    } catch (error) {
        console.error('Content delete error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete content',
            error: error.message
        });
    }
});

module.exports = router;
