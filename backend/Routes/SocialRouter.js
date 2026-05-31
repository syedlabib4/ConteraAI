const ensureAuthenticated = require('../Middlewares/Auth');
const SocialMediaAgent = require('../Services/SocialMediaAgent');

const router = require('express').Router();

// POST /api/social/generate - Generate social media posts
router.post('/generate', ensureAuthenticated, async (req, res) => {
    try {
        const { topic, contentSummary, platforms, tone, includeHashtags } = req.body;
        if (!topic) {
            return res.status(400).json({ success: false, message: 'Topic is required' });
        }
        const result = await SocialMediaAgent.generatePosts(
            topic, contentSummary || '',
            { platforms: platforms || undefined, tone: tone || 'engaging', includeHashtags: includeHashtags !== false }
        );
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        console.error('Social media generation error:', error);
        res.status(500).json({ success: false, message: 'Failed to generate posts', error: error.message });
    }
});

// POST /api/social/repurpose - Generate content repurposing plan
router.post('/repurpose', ensureAuthenticated, async (req, res) => {
    try {
        const { topic, content } = req.body;
        if (!topic) {
            return res.status(400).json({ success: false, message: 'Topic is required' });
        }
        const result = await SocialMediaAgent.repurposePlan(content || '', topic);
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to generate repurpose plan', error: error.message });
    }
});

module.exports = router;
