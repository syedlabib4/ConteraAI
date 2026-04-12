const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class ImageGeneratorAgent {
    constructor() {
        this.outputDir = path.join(__dirname, '..', 'generated-images');
        if (!fs.existsSync(this.outputDir)) {
            fs.mkdirSync(this.outputDir, { recursive: true });
        }
        console.log('🖼️ Image Generator Agent initialized (Pollinations.ai)');
    }

    /**
     * Generate an image using Pollinations.ai (free, no API key needed)
     */
    async generateImage(userPrompt, options = {}) {
        const { style = 'photorealistic', width = 1024, height = 1024 } = options;

        try {
            const enhancedPrompt = this.enhancePrompt(userPrompt, style);
            const encodedPrompt = encodeURIComponent(enhancedPrompt);
            const seed = Math.floor(Math.random() * 999999);

            // Pollinations.ai generates images via URL
            const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&seed=${seed}&nologo=true&enhance=true`;

            // Fetch the image
            const response = await fetch(imageUrl);
            if (!response.ok) {
                throw new Error(`Image generation failed with status ${response.status}`);
            }

            const arrayBuffer = await response.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            // Determine file type
            const contentType = response.headers.get('content-type') || 'image/jpeg';
            const ext = contentType.includes('png') ? 'png' : 'jpg';
            const filename = `img_${crypto.randomBytes(8).toString('hex')}_${Date.now()}.${ext}`;
            const filepath = path.join(this.outputDir, filename);

            fs.writeFileSync(filepath, buffer);

            return {
                success: true,
                filename,
                imageUrl: `/generated-images/${filename}`,
                mimeType: contentType,
                prompt: userPrompt,
                enhancedPrompt,
                style,
                width,
                height,
                fileSize: buffer.length,
                generatedAt: new Date().toISOString(),
                generatedWith: 'Pollinations AI'
            };
        } catch (error) {
            console.error('Image generation error:', error.message);
            throw new Error(`Image generation failed: ${error.message}`);
        }
    }

    /**
     * Generate multiple image variations
     */
    async generateBatch(userPrompt, count = 2, options = {}) {
        const results = [];
        const variations = this.createVariations(userPrompt, count);

        for (let i = 0; i < variations.length; i++) {
            try {
                const result = await this.generateImage(variations[i], options);
                results.push({ ...result, variationIndex: i + 1, originalPrompt: userPrompt });
            } catch (error) {
                results.push({ success: false, error: error.message, variationIndex: i + 1, prompt: variations[i] });
            }
        }

        return {
            success: results.some(r => r.success),
            images: results,
            totalGenerated: results.filter(r => r.success).length,
            totalFailed: results.filter(r => !r.success).length,
            generatedAt: new Date().toISOString()
        };
    }

    enhancePrompt(userPrompt, style = 'photorealistic') {
        const styleMap = {
            photorealistic: 'photorealistic, ultra detailed, 8k, professional photography',
            illustration: 'digital illustration, vibrant colors, detailed artwork',
            '3d-render': '3D render, high quality, studio lighting, octane render',
            'digital-art': 'digital art, vibrant, detailed, trending on artstation',
            watercolor: 'watercolor painting, soft colors, artistic, traditional media',
            'pixel-art': 'pixel art, retro game style, detailed sprites',
            anime: 'anime style, manga art, detailed, studio quality',
            minimalist: 'minimalist design, clean lines, simple, modern',
            'oil-painting': 'oil painting, classical technique, rich textures, fine art',
            'concept-art': 'concept art, detailed environment, cinematic, professional'
        };
        const styleSuffix = styleMap[style] || styleMap.photorealistic;
        return `${userPrompt}, ${styleSuffix}`;
    }

    createVariations(basePrompt, count) {
        if (count <= 1) return [basePrompt];
        const angles = ['', ', different perspective', ', close-up view', ', wide angle', ', dramatic lighting'];
        return Array.from({ length: Math.min(count, 5) }, (_, i) => basePrompt + (angles[i] || ''));
    }

    deleteImage(filename) {
        const filepath = path.join(this.outputDir, filename);
        if (fs.existsSync(filepath)) { fs.unlinkSync(filepath); return true; }
        return false;
    }

    listImages() {
        if (!fs.existsSync(this.outputDir)) return [];
        return fs.readdirSync(this.outputDir)
            .filter(f => /\.(png|jpg|jpeg|webp)$/i.test(f))
            .map(filename => {
                const stats = fs.statSync(path.join(this.outputDir, filename));
                return { filename, imageUrl: `/generated-images/${filename}`, fileSize: stats.size, createdAt: stats.birthtime.toISOString() };
            })
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
}

module.exports = new ImageGeneratorAgent();
