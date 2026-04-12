const axios = require('axios');
const cheerio = require('cheerio');
const NodeCache = require('node-cache');

// Cache trending data for 30 minutes
const trendCache = new NodeCache({ stdTTL: 1800 });

class TrendAgent {

    // Fetch trending topics from Google Trends RSS
    async fetchGoogleTrends(region = 'US') {
        const cacheKey = `google_trends_${region}`;
        const cached = trendCache.get(cacheKey);
        if (cached) return cached;

        try {
            const url = `https://trends.google.com/trending/rss?geo=${region}`;
            const response = await axios.get(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                },
                timeout: 10000
            });

            const $ = cheerio.load(response.data, { xmlMode: true });
            const trends = [];

            $('item').each((i, el) => {
                if (i >= 20) return false; // limit to 20
                const title = $(el).find('title').text();
                const traffic = $(el).find('ht\\:approx_traffic, approx_traffic').text();
                const newsUrl = $(el).find('ht\\:news_item_url, news_item_url').first().text();
                const pubDate = $(el).find('pubDate').text();

                trends.push({
                    title: title.trim(),
                    traffic: traffic || 'N/A',
                    url: newsUrl || '',
                    date: pubDate || new Date().toISOString(),
                    source: 'Google Trends',
                    popularityScore: Math.max(90 - i * 4, 20)
                });
            });

            if (trends.length > 0) {
                trendCache.set(cacheKey, trends);
            }
            return trends.length > 0 ? trends : this.getFallbackTrends();
        } catch (error) {
            console.error('Google Trends fetch error:', error.message);
            return this.getFallbackTrends();
        }
    }

    // Analyze a specific topic for trend relevance
    async analyzeTopic(topic) {
        try {
            const trends = await this.fetchGoogleTrends();
            const relatedTopics = [];
            const keywords = this.extractKeywords(topic);

            // Check if topic matches any current trends
            const matchingTrends = trends.filter(t =>
                t.title.toLowerCase().includes(topic.toLowerCase()) ||
                topic.toLowerCase().includes(t.title.toLowerCase())
            );

            // Generate related keywords
            const expandedKeywords = this.expandKeywords(topic, keywords);

            return {
                topic,
                isTrending: matchingTrends.length > 0,
                matchingTrends,
                keywords: expandedKeywords,
                relatedTopics: this.generateRelatedTopics(topic),
                popularityScore: matchingTrends.length > 0
                    ? matchingTrends[0].popularityScore
                    : Math.floor(Math.random() * 40) + 30,
                analyzedAt: new Date().toISOString()
            };
        } catch (error) {
            console.error('Topic analysis error:', error.message);
            return {
                topic,
                isTrending: false,
                matchingTrends: [],
                keywords: this.extractKeywords(topic),
                relatedTopics: this.generateRelatedTopics(topic),
                popularityScore: 50,
                analyzedAt: new Date().toISOString()
            };
        }
    }

    // Extract keywords from a topic string
    extractKeywords(topic) {
        const stopWords = new Set([
            'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
            'of', 'with', 'by', 'from', 'is', 'are', 'was', 'were', 'be', 'been',
            'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
            'could', 'should', 'may', 'might', 'shall', 'can', 'this', 'that',
            'these', 'those', 'it', 'its', 'how', 'what', 'when', 'where', 'who',
            'which', 'why', 'not', 'no', 'so', 'if', 'then', 'than', 'too', 'very'
        ]);

        const words = topic.toLowerCase()
            .replace(/[^\w\s]/g, '')
            .split(/\s+/)
            .filter(w => w.length > 2 && !stopWords.has(w));

        return [...new Set(words)];
    }

    // Expand keywords with common suffixes/variants
    expandKeywords(topic, baseKeywords) {
        const expanded = [...baseKeywords];
        const suffixes = ['guide', 'tips', 'best practices', 'tutorial', 'examples', 'tools', 'strategies', 'trends'];
        const topicLower = topic.toLowerCase();

        suffixes.forEach(suffix => {
            expanded.push(`${topicLower} ${suffix}`);
        });

        // Add long-tail keywords
        expanded.push(`how to ${topicLower}`);
        expanded.push(`best ${topicLower}`);
        expanded.push(`${topicLower} for beginners`);
        expanded.push(`${topicLower} in ${new Date().getFullYear()}`);

        return expanded.slice(0, 15); // limit to 15
    }

    // Generate related topics
    generateRelatedTopics(topic) {
        const topicLower = topic.toLowerCase();
        const related = [
            `${topicLower} best practices`,
            `${topicLower} for business`,
            `future of ${topicLower}`,
            `${topicLower} vs alternatives`,
            `${topicLower} case studies`,
            `${topicLower} tools and resources`,
            `advanced ${topicLower}`,
            `${topicLower} industry trends`
        ];
        return related;
    }

    // Fallback trends when Google Trends is unavailable
    getFallbackTrends() {
        const topics = [
            { title: 'Artificial Intelligence in Business', traffic: '500K+', popularityScore: 95 },
            { title: 'Remote Work Productivity', traffic: '200K+', popularityScore: 88 },
            { title: 'Sustainable Technology', traffic: '150K+', popularityScore: 82 },
            { title: 'Cybersecurity Best Practices', traffic: '180K+', popularityScore: 85 },
            { title: 'Digital Marketing Automation', traffic: '120K+', popularityScore: 78 },
            { title: 'Cloud Computing Trends', traffic: '100K+', popularityScore: 75 },
            { title: 'E-commerce Growth Strategies', traffic: '90K+', popularityScore: 72 },
            { title: 'Health and Wellness Tech', traffic: '110K+', popularityScore: 76 },
            { title: 'Machine Learning Applications', traffic: '130K+', popularityScore: 80 },
            { title: 'Blockchain and Web3', traffic: '80K+', popularityScore: 68 },
            { title: 'Content Marketing Strategy', traffic: '95K+', popularityScore: 73 },
            { title: 'Data Analytics for Growth', traffic: '85K+', popularityScore: 70 },
            { title: 'Social Media Trends 2026', traffic: '140K+', popularityScore: 81 },
            { title: 'EdTech Innovation', traffic: '75K+', popularityScore: 65 },
            { title: 'Green Energy Solutions', traffic: '70K+', popularityScore: 63 }
        ];

        return topics.map((t, i) => ({
            ...t,
            url: '',
            date: new Date().toISOString(),
            source: 'Curated Trends'
        }));
    }
}

module.exports = new TrendAgent();
