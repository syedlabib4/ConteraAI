const ensureAuthenticated = require('../Middlewares/Auth');
const ImageGeneratorAgent = require('../Services/ImageGeneratorAgent');
const path = require('path');
const fs = require('fs');

const router = require('express').Router();

// POST /api/images/generate - Generate a single image
router.post('/generate', ensureAuthenticated, async (req, res) => {
    try {
        const { prompt, style, aspectRatio } = req.body;
        if (!prompt) {
            return res.status(400).json({ success: false, message: 'Prompt is required' });
        }
        const result = await ImageGeneratorAgent.generateImage(prompt, {
            style: style || 'photorealistic',
            aspectRatio: aspectRatio || '16:9'
        });
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        console.error('Image generation error:', error);
        res.status(500).json({ success: false, message: error.message || 'Failed to generate image' });
    }
});

// POST /api/images/batch - Generate multiple image variations
router.post('/batch', ensureAuthenticated, async (req, res) => {
    try {
        const { prompt, count, style } = req.body;
        if (!prompt) {
            return res.status(400).json({ success: false, message: 'Prompt is required' });
        }
        const result = await ImageGeneratorAgent.generateBatch(prompt, count || 2, {
            style: style || 'photorealistic'
        });
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        console.error('Batch generation error:', error);
        res.status(500).json({ success: false, message: error.message || 'Batch generation failed' });
    }
});

// GET /api/images/list - List all generated images
router.get('/list', ensureAuthenticated, async (req, res) => {
    try {
        const images = ImageGeneratorAgent.listImages();
        res.status(200).json({ success: true, data: images });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to list images' });
    }
});

// GET /api/images/download/:filename - Download a generated image
router.get('/download/:filename', ensureAuthenticated, async (req, res) => {
    try {
        const filename = req.params.filename;
        const filepath = path.join(__dirname, '..', 'generated-images', filename);
        if (!fs.existsSync(filepath)) {
            return res.status(404).json({ success: false, message: 'Image not found' });
        }
        res.download(filepath, filename);
    } catch (error) {
        res.status(500).json({ success: false, message: 'Download failed' });
    }
});

// DELETE /api/images/:filename - Delete a generated image
router.delete('/:filename', ensureAuthenticated, async (req, res) => {
    try {
        const deleted = ImageGeneratorAgent.deleteImage(req.params.filename);
        if (deleted) {
            res.status(200).json({ success: true, message: 'Image deleted' });
        } else {
            res.status(404).json({ success: false, message: 'Image not found' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: 'Delete failed' });
    }
});

module.exports = router;
