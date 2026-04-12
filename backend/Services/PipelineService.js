const TrendAgent = require('./TrendAgent');
const SeoAgent = require('./SeoAgent');
const ContentAgent = require('./ContentAgent');

class PipelineService {

    // Run the full pipeline: Trends → SEO → Content
    async runFullPipeline(topic, options = {}) {
        const { tone = 'professional', length = 'medium', region = 'US' } = options;

        const pipeline = {
            topic,
            status: 'running',
            startedAt: new Date().toISOString(),
            steps: {},
            error: null
        };

        try {
            // Step 1: Trend Research
            pipeline.steps.trends = { status: 'running', startedAt: new Date().toISOString() };
            const trendData = await TrendAgent.analyzeTopic(topic);
            pipeline.steps.trends = {
                status: 'completed',
                data: trendData,
                completedAt: new Date().toISOString()
            };

            // Step 2: SEO Optimization
            pipeline.steps.seo = { status: 'running', startedAt: new Date().toISOString() };
            const seoOutline = SeoAgent.generateOutline(topic, trendData.keywords || []);
            pipeline.steps.seo = {
                status: 'completed',
                data: seoOutline,
                completedAt: new Date().toISOString()
            };

            // Step 3: Content Generation
            pipeline.steps.content = { status: 'running', startedAt: new Date().toISOString() };
            const generatedContent = await ContentAgent.generateContent(seoOutline, { tone, length });
            pipeline.steps.content = {
                status: 'completed',
                data: generatedContent,
                completedAt: new Date().toISOString()
            };

            // Final result
            pipeline.status = 'completed';
            pipeline.completedAt = new Date().toISOString();
            pipeline.result = {
                title: generatedContent.title,
                body: generatedContent.body,
                wordCount: generatedContent.wordCount,
                readabilityScore: generatedContent.readabilityScore,
                readabilityGrade: generatedContent.readabilityGrade,
                seoScore: seoOutline.seoScore,
                keywords: trendData.keywords,
                outline: seoOutline,
                trendData: {
                    isTrending: trendData.isTrending,
                    popularityScore: trendData.popularityScore,
                    relatedTopics: trendData.relatedTopics
                },
                generatedWith: generatedContent.generatedWith,
                meta: generatedContent.meta
            };

            return pipeline;

        } catch (error) {
            pipeline.status = 'failed';
            pipeline.error = error.message;
            pipeline.failedAt = new Date().toISOString();
            console.error('Pipeline error:', error);
            return pipeline;
        }
    }

    // Run only the trend analysis step
    async runTrendStep(topic, region = 'US') {
        return await TrendAgent.analyzeTopic(topic);
    }

    // Run only the SEO step
    runSeoStep(topic, keywords = []) {
        return SeoAgent.generateOutline(topic, keywords);
    }

    // Run only the content generation step
    async runContentStep(outline, options = {}) {
        return await ContentAgent.generateContent(outline, options);
    }

    // Analyze existing content
    analyzeContent(content, keywords = []) {
        return SeoAgent.analyzeContent(content, keywords);
    }

    // Regenerate a specific section
    async regenerateSection(outline, sectionHeading, feedback, options = {}) {
        return await ContentAgent.regenerateSection(outline, sectionHeading, feedback, options);
    }

    // Get trending topics
    async getTrending(region = 'US') {
        return await TrendAgent.fetchGoogleTrends(region);
    }
}

module.exports = new PipelineService();
