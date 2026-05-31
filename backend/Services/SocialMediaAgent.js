const { GoogleGenerativeAI } = require('@google/generative-ai');

class SocialMediaAgent {
    constructor() {
        this.genAI = null;
        this.model = null;
        this.initializeAI();
        this.platforms = ['twitter', 'linkedin', 'instagram', 'facebook', 'threads'];
    }

    initializeAI() {
        const apiKey = process.env.GEMINI_API_KEY;
        if (apiKey && apiKey.trim() !== '') {
            try {
                this.genAI = new GoogleGenerativeAI(apiKey);
                this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
                console.log('📱 Social Media Agent initialized');
            } catch (error) {
                console.warn('⚠️ Social Media AI init failed:', error.message);
            }
        }
    }

    // Generate social media posts for multiple platforms
    async generatePosts(topic, contentSummary = '', options = {}) {
        const { platforms = this.platforms, tone = 'engaging', includeHashtags = true } = options;

        if (this.model) {
            return await this.generateWithAI(topic, contentSummary, { platforms, tone, includeHashtags });
        }
        return this.generateWithTemplate(topic, { platforms, tone, includeHashtags });
    }

    async generateWithAI(topic, contentSummary, options) {
        try {
            const platformSpecs = {
                twitter: { maxChars: 280, name: 'Twitter/X', hashtagCount: 3 },
                linkedin: { maxChars: 3000, name: 'LinkedIn', hashtagCount: 5 },
                instagram: { maxChars: 2200, name: 'Instagram', hashtagCount: 15 },
                facebook: { maxChars: 5000, name: 'Facebook', hashtagCount: 3 },
                threads: { maxChars: 500, name: 'Threads', hashtagCount: 3 }
            };

            const platformList = options.platforms.map(p => {
                const spec = platformSpecs[p] || { maxChars: 280, name: p, hashtagCount: 3 };
                return `- ${spec.name} (max ${spec.maxChars} chars, ${spec.hashtagCount} hashtags)`;
            }).join('\n');

            const prompt = `You are an expert social media manager. Create optimized posts for the topic "${topic}".

${contentSummary ? `Content summary: ${contentSummary}` : ''}
Tone: ${options.tone}

Generate a post for EACH platform:
${platformList}

For each post include:
1. **main**: The main post text (platform-optimized)
2. **hashtags**: Relevant hashtags as an array
3. **bestTime**: Best time to post
4. **engagementTip**: A brief engagement tip
5. **cta**: Call-to-action text

Respond in valid JSON:
{
  "posts": {
    "twitter": { "main": "...", "hashtags": ["#tag1"], "bestTime": "...", "engagementTip": "...", "cta": "..." },
    "linkedin": { "main": "...", "hashtags": ["#tag1"], "bestTime": "...", "engagementTip": "...", "cta": "..." }
  },
  "contentCalendar": {
    "frequency": "...",
    "bestDays": ["..."],
    "strategy": "..."
  },
  "hashtagStrategy": {
    "primary": ["#tag1"],
    "secondary": ["#tag2"],
    "trending": ["#tag3"]
  }
}`;

            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            let text = response.text().trim();
            text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

            try {
                const parsed = JSON.parse(text);
                return {
                    success: true,
                    topic,
                    posts: parsed.posts || {},
                    contentCalendar: parsed.contentCalendar || {},
                    hashtagStrategy: parsed.hashtagStrategy || {},
                    generatedWith: 'Gemini AI',
                    generatedAt: new Date().toISOString()
                };
            } catch (parseErr) {
                return this.generateWithTemplate(topic, options);
            }
        } catch (error) {
            console.error('Social media generation error:', error.message);
            return this.generateWithTemplate(topic, options);
        }
    }

    generateWithTemplate(topic, options) {
        const topicCap = topic.replace(/\b\w/g, c => c.toUpperCase());
        const hashtags = this.generateHashtags(topic);

        const posts = {};
        const platformTemplates = {
            twitter: {
                main: `🚀 ${topicCap} is changing the game! Here are the key insights you need to know about ${topic} in ${new Date().getFullYear()}. A thread 🧵👇`,
                hashtags: hashtags.slice(0, 3),
                bestTime: '9:00 AM - 12:00 PM',
                engagementTip: 'Use a thread format for higher engagement',
                cta: 'Retweet if you agree! 🔄'
            },
            linkedin: {
                main: `I've been researching ${topic} extensively, and here's what I've found:\n\n📌 The landscape is evolving rapidly\n📌 Organizations that adapt early gain competitive advantage\n📌 The key to success lies in strategic implementation\n\n${topicCap} isn't just a trend — it's a fundamental shift in how we approach ${topic.split(' ')[0]}.\n\nWhat's your experience with ${topic}? I'd love to hear your thoughts in the comments.\n\n#${topic.replace(/\s+/g, '')} #Innovation #Industry`,
                hashtags: hashtags.slice(0, 5),
                bestTime: '7:00 AM - 8:30 AM',
                engagementTip: 'Ask a question at the end to encourage comments',
                cta: 'Share your thoughts below! 👇'
            },
            instagram: {
                main: `✨ ${topicCap} — Everything You Need to Know! ✨\n\n🔹 Stay ahead of the curve\n🔹 Learn the latest strategies\n🔹 Transform your approach\n\nSwipe through for key insights! ➡️\n\nSave this for later! 🔖\n\n.\n.\n.`,
                hashtags: hashtags.slice(0, 15),
                bestTime: '11:00 AM - 1:00 PM',
                engagementTip: 'Use carousel posts for 3x more engagement',
                cta: 'Save & Share with someone who needs this! 🔖'
            },
            facebook: {
                main: `📢 ${topicCap}: What You Need to Know\n\nWe just published a comprehensive guide on ${topic} that covers:\n\n✅ Current trends and developments\n✅ Best practices for implementation\n✅ Real-world case studies\n✅ Expert predictions for the future\n\nCheck it out and let us know what you think! Link in the first comment. 👇`,
                hashtags: hashtags.slice(0, 3),
                bestTime: '1:00 PM - 4:00 PM',
                engagementTip: 'Post the link in the first comment for better reach',
                cta: 'Like & Share if you found this helpful! ❤️'
            },
            threads: {
                main: `Here's why everyone's talking about ${topic} right now 🔥\n\nThe latest developments are genuinely exciting, and I think more people need to know about this.\n\nWhat's your take? 👇`,
                hashtags: hashtags.slice(0, 3),
                bestTime: '10:00 AM - 2:00 PM',
                engagementTip: 'Keep it conversational and authentic',
                cta: 'Reply with your thoughts! 💬'
            }
        };

        options.platforms.forEach(platform => {
            if (platformTemplates[platform]) {
                posts[platform] = platformTemplates[platform];
            }
        });

        return {
            success: true,
            topic,
            posts,
            contentCalendar: {
                frequency: '3-5 posts per week',
                bestDays: ['Tuesday', 'Wednesday', 'Thursday'],
                strategy: `Consistent posting about ${topic} with a mix of educational, engaging, and promotional content.`
            },
            hashtagStrategy: {
                primary: hashtags.slice(0, 3),
                secondary: hashtags.slice(3, 7),
                trending: [`#${new Date().getFullYear()}Trends`, '#Innovation', '#TechTrends']
            },
            generatedWith: 'Template Engine',
            generatedAt: new Date().toISOString()
        };
    }

    generateHashtags(topic) {
        const words = topic.split(/\s+/).filter(w => w.length > 2);
        const base = [
            `#${topic.replace(/\s+/g, '')}`,
            `#${words[0] || 'content'}`,
            ...words.slice(1).map(w => `#${w.charAt(0).toUpperCase() + w.slice(1)}`),
            '#ContentCreation',
            '#DigitalMarketing',
            '#ContentStrategy',
            '#SocialMediaMarketing',
            '#Marketing',
            '#Business',
            '#Innovation',
            '#Growth',
            '#Strategy',
            '#Insights',
            `#${new Date().getFullYear()}Goals`
        ];
        return [...new Set(base)].slice(0, 20);
    }

    // Generate a content repurposing plan
    async repurposePlan(originalContent, topic) {
        if (!this.model) {
            return {
                topic,
                plan: [
                    { platform: 'Twitter', format: 'Thread', description: `Break down the ${topic} article into a 5-7 tweet thread with key takeaways.` },
                    { platform: 'LinkedIn', format: 'Article Summary', description: `Create a professional summary post highlighting industry implications of ${topic}.` },
                    { platform: 'Instagram', format: 'Carousel', description: `Design a 5-slide carousel with key points about ${topic}.` },
                    { platform: 'YouTube', format: 'Script Outline', description: `Outline a 5-minute explainer video about ${topic}.` },
                    { platform: 'Newsletter', format: 'Email', description: `Craft a newsletter edition featuring the ${topic} insights.` }
                ]
            };
        }
        try {
            const prompt = `Create a content repurposing plan for an article about "${topic}". Suggest 5 ways to repurpose this for different platforms with specific format recommendations. Return JSON: {"plan": [{"platform": "...", "format": "...", "description": "..."}]}`;
            const result = await this.model.generateContent(prompt);
            let text = result.response.text().trim().replace(/```json\n?/g, '').replace(/```\n?/g, '');
            const parsed = JSON.parse(text);
            return { topic, plan: parsed.plan || [] };
        } catch (error) {
            return { topic, plan: [{ platform: 'Multi', format: 'Cross-post', description: `Share the ${topic} content across all platforms.` }] };
        }
    }

    /**
     * EXPERIMENTAL: Actually post to Instagram using the provided Meta Graph API tokens.
     */
    async publishToInstagram(caption, imageUrl) {
        const token = process.env.INSTAGRAM_ACCESS_TOKEN;
        if (!token) return { success: false, error: 'INSTAGRAM_ACCESS_TOKEN not configured in .env' };

        try {
            // 1. Get Facebook Pages this user manages
            const pagesRes = await fetch(`https://graph.facebook.com/v19.0/me/accounts?access_token=${token}`);
            const pagesData = await pagesRes.json();

            if (!pagesData.data || pagesData.data.length === 0) {
                if (pagesData.error) throw new Error(pagesData.error.message);
                throw new Error('No Facebook Pages found. Make sure your Instagram is linked to a Facebook Page.');
            }

            const pageId = pagesData.data[0].id;

            // 2. Get the linked Instagram Business Account ID
            const igRes = await fetch(`https://graph.facebook.com/v19.0/${pageId}?fields=instagram_business_account&access_token=${token}`);
            const igData = await igRes.json();

            if (!igData.instagram_business_account) {
                throw new Error('No Instagram Business Account linked to this Facebook Page.');
            }

            const igUserId = igData.instagram_business_account.id;

            // 3. Create Media Container (Requires a PUBLIC image URL)
            const containerRes = await fetch(`https://graph.facebook.com/v19.0/${igUserId}/media`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    image_url: imageUrl,
                    caption: caption,
                    access_token: token
                })
            });
            const containerData = await containerRes.json();

            if (containerData.error) {
                throw new Error(`Upload failed: ${containerData.error.message}`);
            }

            const creationId = containerData.id;

            // 4. Publish Media Container
            const publishRes = await fetch(`https://graph.facebook.com/v19.0/${igUserId}/media_publish`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    creation_id: creationId,
                    access_token: token
                })
            });
            const publishData = await publishRes.json();

            if (publishData.error) {
                throw new Error(`Publish failed: ${publishData.error.message}`);
            }

            return { success: true, postId: publishData.id, igUserId };

        } catch (error) {
            console.error('❌ Instagram Auto-Post Error:', error.message);
            return { success: false, error: error.message };
        }
    }
}

module.exports = new SocialMediaAgent();
