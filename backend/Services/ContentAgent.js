const { GoogleGenerativeAI } = require('@google/generative-ai');

class ContentAgent {
    constructor() {
        this.genAI = null;
        this.model = null;
        this.initializeAI();
    }

    initializeAI() {
        const apiKey = process.env.GEMINI_API_KEY;
        if (apiKey && apiKey.trim() !== '') {
            try {
                this.genAI = new GoogleGenerativeAI(apiKey);
                this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
                console.log('✅ Gemini AI initialized successfully');
            } catch (error) {
                console.warn('⚠️ Gemini AI initialization failed, using fallback:', error.message);
                this.genAI = null;
                this.model = null;
            }
        } else {
            console.log('ℹ️ No Gemini API key found, using template-based content generation');
        }
    }

    // Generate content using AI or fallback
    async generateContent(outline, options = {}) {
        const { tone = 'professional', length = 'medium', includeConclusion = true } = options;

        if (this.model) {
            return await this.generateWithAI(outline, { tone, length, includeConclusion });
        }
        return this.generateWithTemplate(outline, { tone, length, includeConclusion });
    }

    // AI-powered content generation with Gemini
    async generateWithAI(outline, options) {
        try {
            const { tone, length } = options;

            const wordTarget = length === 'short' ? 600 : length === 'long' ? 2000 : 1200;

            const headingsStr = outline.headings
                .map(h => `${'#'.repeat(h.level)} ${h.text}`)
                .join('\n');

            const keywordsStr = outline.keywords
                ? outline.keywords.map(k => k.keyword || k).join(', ')
                : outline.topic;

            const prompt = `Write a comprehensive, SEO-optimized article on the topic "${outline.topic}".

REQUIREMENTS:
- Tone: ${tone}
- Target word count: approximately ${wordTarget} words
- Use the following outline structure (use markdown headings):
${headingsStr}

- Naturally incorporate these keywords throughout the content: ${keywordsStr}
- Meta description to use: ${outline.metaDescription || ''}
- Write engaging, informative, and unique content
- Include practical examples and actionable advice
- Use short paragraphs (3-4 sentences max)
- Include a compelling introduction and strong conclusion
- Format in Markdown

Write the article now:`;

            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            const wordCount = text.split(/\s+/).length;
            const readabilityScore = this.calculateReadability(text);

            return {
                title: outline.titleSuggestions?.[0] || `Guide to ${outline.topic}`,
                body: text,
                wordCount,
                readabilityScore,
                readabilityGrade: this.getReadabilityGrade(readabilityScore),
                generatedWith: 'Gemini AI',
                generatedAt: new Date().toISOString(),
                meta: {
                    tone,
                    targetLength: length,
                    actualWordCount: wordCount,
                    topic: outline.topic
                }
            };
        } catch (error) {
            console.error('Gemini API error:', error.message);
            // Fallback to template if AI fails
            return this.generateWithTemplate(outline, options);
        }
    }

    // Template-based content generation (fallback)
    generateWithTemplate(outline, options) {
        const { tone, length } = options;
        const topic = outline.topic;
        const topicCap = topic.replace(/\b\w/g, c => c.toUpperCase());
        const year = new Date().getFullYear();

        const keywords = outline.keywords
            ? outline.keywords.map(k => k.keyword || k)
            : [topic];

        let content = '';

        // Generate content for each heading
        outline.headings.forEach(heading => {
            content += `${'#'.repeat(heading.level)} ${heading.text}\n\n`;
            content += this.generateSectionContent(heading, topic, keywords, tone);
            content += '\n\n';
        });

        const wordCount = content.split(/\s+/).length;
        const readabilityScore = this.calculateReadability(content);

        return {
            title: outline.titleSuggestions?.[0] || `The Complete Guide to ${topicCap}`,
            body: content.trim(),
            wordCount,
            readabilityScore,
            readabilityGrade: this.getReadabilityGrade(readabilityScore),
            generatedWith: 'Template Engine',
            generatedAt: new Date().toISOString(),
            meta: {
                tone,
                targetLength: length,
                actualWordCount: wordCount,
                topic: outline.topic
            }
        };
    }

    // Generate content for a specific section
    generateSectionContent(heading, topic, keywords, tone) {
        const topicCap = topic.replace(/\b\w/g, c => c.toUpperCase());
        const year = new Date().getFullYear();
        const kw = keywords[0] || topic;

        const sections = {
            'what is': `${topicCap} is a rapidly evolving field that has gained significant attention in recent years. At its core, ${topic} encompasses a set of practices, tools, and methodologies designed to deliver exceptional results. Understanding ${topic} is essential for anyone looking to stay competitive in today's landscape.\n\nThe concept of ${topic} has evolved significantly over the past decade. What started as a niche area has now become a mainstream consideration for businesses and professionals alike. The growing importance of ${kw} cannot be overstated.`,

            'key concepts': `To fully understand ${topic}, it's important to grasp several fundamental concepts:\n\n- **Core Principles**: The foundational ideas that drive ${topic} and inform best practices.\n- **Key Terminology**: Understanding the language used by professionals in the ${topic} space.\n- **Framework Models**: Structured approaches to implementing ${topic} effectively.\n\nThese concepts form the building blocks upon which successful ${topic} strategies are built.`,

            'why': `The importance of ${topic} in ${year} cannot be understated. Organizations that embrace ${kw} are seeing significant improvements in efficiency, engagement, and overall performance.\n\nKey reasons why ${topic} matters include:\n\n1. **Competitive Advantage**: Early adopters of ${topic} strategies gain a significant edge.\n2. **Cost Efficiency**: Proper implementation reduces operational costs by up to 30%.\n3. **Scalability**: ${topicCap} solutions grow with your needs.\n4. **Future-Readiness**: Staying current with ${topic} trends ensures long-term relevance.`,

            'trends': `The ${topic} landscape is constantly evolving. Here are the most significant trends shaping the industry in ${year}:\n\n1. **AI Integration**: Artificial intelligence is transforming how professionals approach ${topic}.\n2. **Automation**: Repetitive tasks are being automated, freeing up time for strategic thinking.\n3. **Personalization**: Tailored approaches are becoming the standard in ${topic}.\n4. **Data-Driven Decisions**: Analytics and data are driving ${topic} strategies more than ever.\n\nStaying ahead of these trends ensures you remain competitive in the ${topic} space.`,

            'best practices': `Implementing ${topic} effectively requires following proven best practices:\n\n1. **Start with a Clear Strategy**: Define your goals and objectives before diving in.\n2. **Measure and Iterate**: Use data to track progress and continuously improve.\n3. **Stay Updated**: The ${topic} field evolves rapidly — commit to ongoing learning.\n4. **Focus on Quality**: In ${topic}, quality always outperforms quantity.\n5. **Collaborate and Network**: Connect with other professionals in the ${kw} space.\n\nFollowing these practices will set you up for success with ${topic}.`,

            'getting started': `If you're new to ${topic}, here's a step-by-step guide to getting started:\n\n1. **Research**: Spend time understanding the fundamentals of ${topic}.\n2. **Set Goals**: Define what you want to achieve with ${kw}.\n3. **Choose Tools**: Select the right tools and platforms for your needs.\n4. **Start Small**: Begin with a pilot project before scaling up.\n5. **Seek Feedback**: Get input from peers and mentors as you implement.`,

            'tools': `Having the right tools is essential for success with ${topic}. Here are some recommended options:\n\n- **Analytics Tools**: Track performance metrics and gather insights.\n- **Automation Platforms**: Streamline repetitive tasks and workflows.\n- **Collaboration Software**: Work effectively with team members.\n- **Learning Resources**: Stay updated with the latest in ${topic}.\n\nThe right combination of tools can significantly enhance your ${topic} outcomes.`,

            'case studies': `Real-world examples demonstrate the power of effective ${topic} strategies:\n\n**Case Study 1**: A mid-size company implemented ${topic} best practices and saw a 45% increase in engagement within six months.\n\n**Case Study 2**: A startup leveraged ${kw} tools to reduce costs by 30% while improving output quality.\n\nThese examples illustrate the tangible benefits that ${topic} can deliver when implemented correctly.`,

            'future': `Looking ahead, the future of ${topic} is bright. Several developments are expected to shape the industry:\n\n- **Advanced AI**: More sophisticated AI tools will transform ${topic} workflows.\n- **Greater Integration**: ${topicCap} will become more integrated into daily business operations.\n- **Emerging Technologies**: New technologies will open up unprecedented possibilities.\n- **Global Adoption**: ${topicCap} practices will see wider adoption across industries and regions.\n\nProfessionals who prepare now for these changes will be best positioned for success.`,

            'faq': `**Q: What is the best way to get started with ${topic}?**\nA: Begin by understanding the fundamentals, setting clear goals, and choosing the right tools for your needs.\n\n**Q: How long does it take to see results from ${topic}?**\nA: Results vary, but most professionals report meaningful improvements within 2-3 months of implementation.\n\n**Q: Is ${topic} suitable for small businesses?**\nA: Absolutely. ${topicCap} strategies can be scaled to fit any size organization.\n\n**Q: What are the most common mistakes in ${topic}?**\nA: The most common mistakes include lack of strategy, ignoring data, and failing to iterate on approaches.`,

            'conclusion': `${topicCap} is an essential area that continues to grow in importance. By understanding the key concepts, following best practices, and staying current with trends, you can leverage ${kw} to achieve outstanding results.\n\nWhether you're just getting started or looking to optimize your existing approach, the strategies outlined in this guide will help you succeed. Take action today and start implementing these ${topic} practices to see real results.`
        };

        const headingLower = heading.text.toLowerCase();
        for (const [key, value] of Object.entries(sections)) {
            if (headingLower.includes(key)) {
                return value;
            }
        }

        return `${topicCap} plays a critical role in this area. Understanding the nuances of ${kw} helps professionals make better decisions and achieve their goals. As the field continues to evolve, staying informed about the latest developments in ${topic} is more important than ever.\n\nThis section explores the key aspects of ${heading.text.toLowerCase()} and provides actionable insights for implementation.`;
    }

    // Calculate readability score (simplified Flesch Reading Ease)
    calculateReadability(text) {
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
        const words = text.split(/\s+/).filter(w => w.length > 0);
        const avgSentenceLength = words.length / Math.max(sentences.length, 1);
        const score = 100 - (avgSentenceLength * 1.5);
        return Math.max(Math.min(Math.round(score), 100), 0);
    }

    getReadabilityGrade(score) {
        if (score >= 80) return 'Very Easy';
        if (score >= 60) return 'Easy';
        if (score >= 40) return 'Moderate';
        if (score >= 20) return 'Difficult';
        return 'Very Difficult';
    }

    // Regenerate a specific section
    async regenerateSection(outline, sectionHeading, feedback, options = {}) {
        if (!this.model) {
            return {
                heading: sectionHeading,
                content: `This section about "${sectionHeading}" has been refreshed with updated information about ${outline.topic}. Please note that for AI-powered regeneration, a Gemini API key is required.`,
                regeneratedAt: new Date().toISOString()
            };
        }

        try {
            const prompt = `Regenerate the following section of an article about "${outline.topic}".

Section heading: "${sectionHeading}"
User feedback: "${feedback || 'Make it better and more detailed'}"
Tone: ${options.tone || 'professional'}

Write only this section (2-4 paragraphs, use markdown formatting):`;

            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            return {
                heading: sectionHeading,
                content: text,
                regeneratedAt: new Date().toISOString()
            };
        } catch (error) {
            console.error('Section regeneration error:', error.message);
            return {
                heading: sectionHeading,
                content: `Updated content for "${sectionHeading}" related to ${outline.topic}.`,
                regeneratedAt: new Date().toISOString(),
                error: error.message
            };
        }
    }
}

module.exports = new ContentAgent();
