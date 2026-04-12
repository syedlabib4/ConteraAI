const TrendAgent = require('./TrendAgent');
const SeoAgent = require('./SeoAgent');
const ContentAgent = require('./ContentAgent');
const ImageGeneratorAgent = require('./ImageGeneratorAgent');
const SocialMediaAgent = require('./SocialMediaAgent');
const AgentTask = require('../Models/AgentTask');
const ContentModel = require('../Models/Content');

class AgentOrchestrator {
    constructor() {
        this.activeRuns = new Map();
        console.log('🤖 Agent Orchestrator initialized');
    }

    /**
     * Run the FULL autonomous pipeline:
     * Trends → SEO → Content → Images → Social Media Posts
     * Everything is automatic — user just provides a topic.
     */
    async runAutonomousPipeline(userId, topic, options = {}) {
        const {
            tone = 'professional',
            length = 'medium',
            platforms = ['twitter', 'linkedin', 'instagram', 'facebook'],
            imageStyle = 'photorealistic',
            imageCount = 2,
            autoPost = false
        } = options;

        // Create task record
        const task = new AgentTask({
            userId,
            type: 'full-pipeline',
            topic,
            status: 'running',
            options: { tone, length, platforms, imageStyle, autoPost },
            startedAt: new Date(),
            results: {}
        });
        await task.save();

        this.activeRuns.set(task._id.toString(), task);

        try {
            // ═══════════════════════════════════════
            // AGENT 1: Trend Research Agent
            // ═══════════════════════════════════════
            const t1 = Date.now();
            await this.log(task, 'TrendAgent', 'Analyzing trending topics and keywords', 'running');

            const trendData = await TrendAgent.analyzeTopic(topic);

            await this.log(task, 'TrendAgent', `Found ${trendData.keywords?.length || 0} keywords, popularity: ${trendData.popularityScore}`, 'success', Date.now() - t1, {
                keywords: trendData.keywords?.slice(0, 5),
                popularityScore: trendData.popularityScore,
                isTrending: trendData.isTrending
            });
            task.results.trends = trendData;

            // ═══════════════════════════════════════
            // AGENT 2: SEO Optimizer Agent
            // ═══════════════════════════════════════
            const t2 = Date.now();
            await this.log(task, 'SeoAgent', 'Generating SEO-optimized outline and keywords', 'running');

            const seoOutline = SeoAgent.generateOutline(topic, trendData.keywords || []);

            await this.log(task, 'SeoAgent', `Created outline with ${seoOutline.headings?.length || 0} sections, SEO score: ${seoOutline.seoScore}`, 'success', Date.now() - t2, {
                seoScore: seoOutline.seoScore,
                headingCount: seoOutline.headings?.length,
                estimatedWords: seoOutline.estimatedWordCount
            });
            task.results.seo = { seoScore: seoOutline.seoScore, headings: seoOutline.headings?.length, titleSuggestions: seoOutline.titleSuggestions };

            // ═══════════════════════════════════════
            // AGENT 3: Content Writer Agent
            // ═══════════════════════════════════════
            const t3 = Date.now();
            await this.log(task, 'ContentAgent', `Writing ${length} ${tone} article (~${seoOutline.estimatedWordCount} words)`, 'running');

            const content = await ContentAgent.generateContent(seoOutline, { tone, length });

            await this.log(task, 'ContentAgent', `Generated "${content.title}" — ${content.wordCount} words, readability: ${content.readabilityGrade}`, 'success', Date.now() - t3, {
                title: content.title,
                wordCount: content.wordCount,
                readabilityGrade: content.readabilityGrade,
                generatedWith: content.generatedWith
            });
            task.results.content = { title: content.title, wordCount: content.wordCount, readabilityGrade: content.readabilityGrade };

            // Save content to DB
            const savedContent = new ContentModel({
                userId,
                title: content.title,
                body: content.body,
                topic,
                keywords: trendData.keywords || [],
                seoScore: seoOutline.seoScore,
                outline: { metaDescription: seoOutline.metaDescription, headings: seoOutline.headings?.map(h => h.text) || [], titleSuggestions: seoOutline.titleSuggestions || [] },
                trendData: { source: 'autonomous-agent', relatedTopics: trendData.relatedTopics || [], popularityScore: trendData.popularityScore || 0 },
                wordCount: content.wordCount,
                status: 'generated'
            });
            await savedContent.save();
            task.contentId = savedContent._id;

            await this.log(task, 'ContentAgent', `Content saved to database (ID: ${savedContent._id})`, 'success', 0);

            // ═══════════════════════════════════════
            // AGENT 4: Image Generator Agent
            // ═══════════════════════════════════════
            const t4 = Date.now();
            await this.log(task, 'ImageAgent', `Generating ${imageCount} images in ${imageStyle} style`, 'running');

            let imageResults = { images: [] };
            try {
                if (imageCount === 1) {
                    const img = await ImageGeneratorAgent.generateImage(topic, { style: imageStyle });
                    imageResults = { images: [img], totalGenerated: 1 };
                } else {
                    imageResults = await ImageGeneratorAgent.generateBatch(topic, imageCount, { style: imageStyle });
                }
                const successCount = imageResults.images?.filter(i => i.success).length || 0;
                await this.log(task, 'ImageAgent', `Generated ${successCount}/${imageCount} images`, 'success', Date.now() - t4, {
                    generated: successCount,
                    images: imageResults.images?.filter(i => i.success).map(i => ({ filename: i.filename, url: i.imageUrl }))
                });
            } catch (imgErr) {
                await this.log(task, 'ImageAgent', `Image generation failed: ${imgErr.message}`, 'failed', Date.now() - t4);
            }
            task.results.images = { count: imageResults.images?.filter(i => i.success).length || 0, images: imageResults.images?.filter(i => i.success).map(i => i.imageUrl) || [] };

            // ═══════════════════════════════════════
            // AGENT 5: Social Media Manager Agent
            // ═══════════════════════════════════════
            const t5 = Date.now();
            await this.log(task, 'SocialAgent', `Creating posts for ${platforms.join(', ')}`, 'running');

            const contentSummary = `Article: "${content.title}" about ${topic}. ${content.wordCount} words. Key points: ${seoOutline.headings?.slice(0, 3).map(h => h.text).join(', ')}`;
            const socialPosts = await SocialMediaAgent.generatePosts(topic, contentSummary, { platforms, tone: 'engaging' });

            const postCount = Object.keys(socialPosts.posts || {}).length;
            await this.log(task, 'SocialAgent', `Created ${postCount} platform-specific posts with hashtag strategy`, 'success', Date.now() - t5, {
                platforms: Object.keys(socialPosts.posts || {}),
                hashtagCount: socialPosts.hashtagStrategy?.primary?.length || 0
            });
            task.results.social = socialPosts;

            if (autoPost) {
                // If Instagram post generated and we have an image URL
                if (socialPosts.posts?.instagram && task.results.images?.images?.length > 0) {
                    const caption = socialPosts.posts.instagram.main + '\n\n' + (socialPosts.posts.instagram.hashtags || []).join(' ');

                    // Pollinations AI URL since FB requires a public URL
                    // We re-construct the pollinations URL to ensure it is public
                    const enhancedPrompt = `${topic}, ${imageStyle} style, highly detailed`;
                    const publicImageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(enhancedPrompt)}?width=1024&height=1024&nologo=true&enhance=true`;

                    await this.log(task, 'SocialAgent', 'Publishing directly to Instagram via Meta Graph API...', 'running');
                    const publishResult = await SocialMediaAgent.publishToInstagram(caption, publicImageUrl);

                    if (publishResult.success) {
                        await this.log(task, 'SocialAgent', `✅ Post successfully published to Instagram! (ID: ${publishResult.postId})`, 'success', 0, publishResult);
                    } else {
                        await this.log(task, 'SocialAgent', `Failed to publish to Instagram: ${publishResult.error}`, 'failed');
                    }
                } else {
                    await this.log(task, 'SocialAgent', `No image or Instagram text generated to auto-post`, 'failed');
                }
            }

            // ═══════════════════════════════════════
            // PIPELINE COMPLETE
            // ═══════════════════════════════════════
            task.status = 'completed';
            task.completedAt = new Date();
            await this.log(task, 'Orchestrator', `Full pipeline completed in ${((task.completedAt - task.startedAt) / 1000).toFixed(1)}s`, 'success', Date.now() - t1);

            await task.save();
            this.activeRuns.delete(task._id.toString());

            return task;

        } catch (error) {
            task.status = 'failed';
            task.error = error.message;
            task.completedAt = new Date();
            await this.log(task, 'Orchestrator', `Pipeline failed: ${error.message}`, 'failed');
            await task.save();
            this.activeRuns.delete(task._id.toString());
            throw error;
        }
    }

    // Add a log entry to a task
    async log(task, agent, action, status, duration = 0, data = null) {
        task.agentLog.push({ agent, action, status, duration, timestamp: new Date(), data });
        // Save intermediate state so frontend can poll for updates
        await task.save().catch(() => { });
    }

    // Get task status (for polling)
    async getTaskStatus(taskId) {
        return await AgentTask.findById(taskId);
    }

    // Get user's task history
    async getUserTasks(userId, limit = 20) {
        return await AgentTask.find({ userId }).sort({ createdAt: -1 }).limit(limit);
    }

    // Get active runs count
    getActiveRunsCount() {
        return this.activeRuns.size;
    }

    // Cancel a running task
    async cancelTask(taskId) {
        const task = await AgentTask.findById(taskId);
        if (task && task.status === 'running') {
            task.status = 'cancelled';
            task.completedAt = new Date();
            await this.log(task, 'Orchestrator', 'Task cancelled by user', 'failed');
            await task.save();
            this.activeRuns.delete(taskId);
            return true;
        }
        return false;
    }

    // Get agent analytics
    async getAnalytics(userId) {
        const tasks = await AgentTask.find({ userId }).sort({ createdAt: -1 }).limit(50);
        const completed = tasks.filter(t => t.status === 'completed');
        const totalTasks = tasks.length;
        const successRate = totalTasks > 0 ? Math.round((completed.length / totalTasks) * 100) : 0;

        // Calculate average pipeline duration
        const durations = completed.map(t => t.completedAt - t.startedAt).filter(d => d > 0);
        const avgDuration = durations.length > 0 ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length / 1000) : 0;

        // Count agent actions
        const agentActions = {};
        tasks.forEach(t => {
            t.agentLog?.forEach(log => {
                agentActions[log.agent] = (agentActions[log.agent] || 0) + 1;
            });
        });

        // Content stats
        const totalWordsGenerated = completed.reduce((sum, t) => sum + (t.results?.content?.wordCount || 0), 0);
        const totalImagesGenerated = completed.reduce((sum, t) => sum + (t.results?.images?.count || 0), 0);
        const totalPostsGenerated = completed.reduce((sum, t) => sum + Object.keys(t.results?.social?.posts || {}).length, 0);

        return {
            totalTasks,
            completedTasks: completed.length,
            failedTasks: tasks.filter(t => t.status === 'failed').length,
            successRate,
            avgDuration,
            agentActions,
            totalWordsGenerated,
            totalImagesGenerated,
            totalPostsGenerated,
            recentTasks: tasks.slice(0, 10).map(t => ({
                id: t._id,
                topic: t.topic,
                status: t.status,
                type: t.type,
                createdAt: t.createdAt,
                duration: t.completedAt && t.startedAt ? Math.round((t.completedAt - t.startedAt) / 1000) : null
            }))
        };
    }
}

module.exports = new AgentOrchestrator();
