const ensureAuthenticated = require('../Middlewares/Auth');
const PipelineService = require('../Services/PipelineService');
const ContentModel = require('../Models/Content');

const router = require('express').Router();

// POST /api/pipeline/run - Run full pipeline (topic → trends → SEO → content)
router.post('/run', ensureAuthenticated, async (req, res) => {
    try {
        const { topic, options } = req.body;
        if (!topic) {
            return res.status(400).json({
                success: false,
                message: 'Topic is required'
            });
        }

        const result = await PipelineService.runFullPipeline(topic, options || {});

        // Auto-save if pipeline completed successfully
        if (result.status === 'completed' && result.result) {
            try {
                const content = new ContentModel({
                    userId: req.user._id,
                    title: result.result.title,
                    body: result.result.body,
                    topic: topic,
                    keywords: result.result.keywords || [],
                    seoScore: result.result.seoScore || 0,
                    outline: result.result.outline ? {
                        metaDescription: result.result.outline.metaDescription,
                        headings: result.result.outline.headings?.map(h => h.text) || [],
                        titleSuggestions: result.result.outline.titleSuggestions || []
                    } : {},
                    trendData: result.result.trendData ? {
                        source: 'pipeline',
                        relatedTopics: result.result.trendData.relatedTopics || [],
                        popularityScore: result.result.trendData.popularityScore || 0
                    } : {},
                    wordCount: result.result.wordCount || 0,
                    status: 'generated'
                });
                await content.save();
                result.savedContentId = content._id;
            } catch (saveError) {
                console.error('Auto-save error:', saveError.message);
                // Don't fail the whole pipeline if save fails
            }
        }

        res.status(200).json({
            success: result.status === 'completed',
            data: result
        });
    } catch (error) {
        console.error('Pipeline error:', error);
        res.status(500).json({
            success: false,
            message: 'Pipeline execution failed',
            error: error.message
        });
    }
});

// GET /api/pipeline/stats - Get user's pipeline usage stats
router.get('/stats', ensureAuthenticated, async (req, res) => {
    try {
        const totalContent = await ContentModel.countDocuments({ userId: req.user._id });
        const recentContent = await ContentModel.find({ userId: req.user._id })
            .sort({ createdAt: -1 })
            .limit(5)
            .select('title topic seoScore wordCount status createdAt');

        const avgSeoScore = await ContentModel.aggregate([
            { $match: { userId: req.user._id } },
            { $group: { _id: null, avgScore: { $avg: '$seoScore' }, totalWords: { $sum: '$wordCount' } } }
        ]);

        res.status(200).json({
            success: true,
            data: {
                totalContent,
                avgSeoScore: avgSeoScore[0]?.avgScore ? Math.round(avgSeoScore[0].avgScore) : 0,
                totalWords: avgSeoScore[0]?.totalWords || 0,
                recentContent
            }
        });
    } catch (error) {
        console.error('Stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch stats',
            error: error.message
        });
    }
});

module.exports = router;
