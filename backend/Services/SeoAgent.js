class SeoAgent {

    // Generate a full SEO-optimized outline from topic + keywords
    generateOutline(topic, keywords = []) {
        const titleSuggestions = this.generateTitleSuggestions(topic, keywords);
        const metaDescription = this.generateMetaDescription(topic, keywords);
        const headings = this.generateHeadingStructure(topic, keywords);
        const keywordPlan = this.buildKeywordPlan(topic, keywords);

        const seoScore = this.calculateSeoScore({
            titleSuggestions,
            metaDescription,
            headings,
            keywords: keywordPlan
        });

        return {
            topic,
            titleSuggestions,
            metaDescription,
            headings,
            keywords: keywordPlan,
            seoScore,
            recommendations: this.generateRecommendations(topic, seoScore),
            estimatedWordCount: this.estimateWordCount(headings),
            generatedAt: new Date().toISOString()
        };
    }

    // Analyze existing content for SEO quality
    analyzeContent(content, targetKeywords = []) {
        const wordCount = content.split(/\s+/).length;
        const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
        const avgSentenceLength = wordCount / Math.max(sentences.length, 1);

        // Check keyword presence
        const contentLower = content.toLowerCase();
        const keywordAnalysis = targetKeywords.map(keyword => {
            const regex = new RegExp(keyword.toLowerCase(), 'gi');
            const matches = contentLower.match(regex);
            const count = matches ? matches.length : 0;
            const density = ((count * keyword.split(' ').length) / wordCount * 100).toFixed(2);

            return {
                keyword,
                count,
                density: parseFloat(density),
                status: density >= 0.5 && density <= 2.5 ? 'optimal' : density < 0.5 ? 'low' : 'high'
            };
        });

        // Readability check
        const readabilityScore = this.calculateReadability(avgSentenceLength, wordCount);

        // Check for headings
        const headingMatches = content.match(/^#{1,6}\s.+/gm) || [];
        const hasProperStructure = headingMatches.length >= 3;

        const seoScore = this.calculateContentSeoScore({
            wordCount,
            keywordAnalysis,
            readabilityScore,
            hasProperStructure,
            avgSentenceLength
        });

        return {
            wordCount,
            sentenceCount: sentences.length,
            avgSentenceLength: Math.round(avgSentenceLength),
            readabilityScore,
            readabilityGrade: this.getReadabilityGrade(readabilityScore),
            keywordAnalysis,
            headingCount: headingMatches.length,
            hasProperStructure,
            seoScore,
            suggestions: this.generateImprovementSuggestions({
                wordCount, keywordAnalysis, readabilityScore, hasProperStructure, avgSentenceLength
            })
        };
    }

    // Generate SEO-optimized title suggestions
    generateTitleSuggestions(topic, keywords) {
        const year = new Date().getFullYear();
        const mainKeyword = keywords[0] || topic;
        const topicCap = this.capitalizeWords(topic);

        return [
            `The Ultimate Guide to ${topicCap} in ${year}`,
            `${topicCap}: Best Practices, Tips & Strategies`,
            `How to Master ${topicCap} – A Complete Guide`,
            `Top 10 ${topicCap} Strategies That Actually Work`,
            `${topicCap}: Everything You Need to Know in ${year}`,
            `Why ${topicCap} Matters and How to Get Started`
        ];
    }

    // Generate meta description
    generateMetaDescription(topic, keywords) {
        const keywordStr = keywords.slice(0, 3).join(', ');
        const year = new Date().getFullYear();
        return `Discover the latest insights on ${topic} in ${year}. Learn about ${keywordStr || topic} with actionable tips, strategies, and expert recommendations. Read more now.`;
    }

    // Generate a structured heading outline
    generateHeadingStructure(topic, keywords) {
        const topicCap = this.capitalizeWords(topic);
        const mainKeywords = keywords.slice(0, 5);

        const headings = [
            { level: 1, text: `The Complete Guide to ${topicCap}` },
            { level: 2, text: `What is ${topicCap}?` },
            { level: 3, text: `Key Concepts and Definitions` },
            { level: 3, text: `Why ${topicCap} Matters Today` },
            { level: 2, text: `Current Trends in ${topicCap}` },
            { level: 3, text: `Industry Developments` },
            { level: 3, text: `Statistics and Data` },
            { level: 2, text: `Best Practices for ${topicCap}` },
            { level: 3, text: `Getting Started` },
            { level: 3, text: `Advanced Strategies` },
            { level: 3, text: `Common Mistakes to Avoid` },
            { level: 2, text: `Tools and Resources` },
            { level: 3, text: `Recommended Tools` },
            { level: 3, text: `Helpful Resources and Further Reading` },
            { level: 2, text: `Case Studies and Examples` },
            { level: 2, text: `Future of ${topicCap}` },
            { level: 2, text: `Frequently Asked Questions (FAQ)` },
            { level: 2, text: `Conclusion` }
        ];

        return headings;
    }

    // Build keyword targeting plan
    buildKeywordPlan(topic, keywords) {
        const topicLower = topic.toLowerCase();
        const allKeywords = [...new Set([topicLower, ...keywords.map(k => k.toLowerCase())])];

        return allKeywords.slice(0, 10).map((kw, index) => ({
            keyword: kw,
            type: index === 0 ? 'primary' : index < 3 ? 'secondary' : 'long-tail',
            targetDensity: index === 0 ? '1.5-2.0%' : index < 3 ? '0.8-1.2%' : '0.3-0.5%',
            placement: index === 0
                ? ['title', 'h1', 'first paragraph', 'meta description', 'conclusion']
                : index < 3
                    ? ['h2 headings', 'body paragraphs']
                    : ['body paragraphs', 'subheadings']
        }));
    }

    // Calculate SEO score for an outline
    calculateSeoScore({ titleSuggestions, metaDescription, headings, keywords }) {
        let score = 0;

        // Title check (20 pts)
        if (titleSuggestions.length >= 3) score += 20;
        else score += titleSuggestions.length * 5;

        // Meta description length check (20 pts)
        if (metaDescription.length >= 120 && metaDescription.length <= 160) score += 20;
        else if (metaDescription.length >= 80) score += 12;
        else score += 5;

        // Heading structure (30 pts)
        const h1Count = headings.filter(h => h.level === 1).length;
        const h2Count = headings.filter(h => h.level === 2).length;
        if (h1Count === 1) score += 10;
        if (h2Count >= 4) score += 10;
        if (headings.length >= 10) score += 10;

        // Keywords (30 pts)
        const hasPrimary = keywords.some(k => k.type === 'primary');
        const secondaryCount = keywords.filter(k => k.type === 'secondary').length;
        if (hasPrimary) score += 15;
        if (secondaryCount >= 2) score += 10;
        if (keywords.length >= 5) score += 5;

        return Math.min(score, 100);
    }

    // Calculate content SEO score
    calculateContentSeoScore({ wordCount, keywordAnalysis, readabilityScore, hasProperStructure, avgSentenceLength }) {
        let score = 0;

        if (wordCount >= 1000) score += 25;
        else if (wordCount >= 500) score += 15;
        else score += 5;

        const optimalKeywords = keywordAnalysis.filter(k => k.status === 'optimal').length;
        score += Math.min(optimalKeywords * 8, 25);

        score += Math.min(readabilityScore * 0.25, 25);

        if (hasProperStructure) score += 15;
        if (avgSentenceLength <= 20) score += 10;

        return Math.min(Math.round(score), 100);
    }

    // Calculate readability (simplified Flesch-like score)
    calculateReadability(avgSentenceLength, wordCount) {
        const base = 100 - (avgSentenceLength * 1.5);
        return Math.max(Math.min(Math.round(base), 100), 0);
    }

    getReadabilityGrade(score) {
        if (score >= 80) return 'Very Easy';
        if (score >= 60) return 'Easy';
        if (score >= 40) return 'Moderate';
        if (score >= 20) return 'Difficult';
        return 'Very Difficult';
    }

    // Generate improvement suggestions
    generateImprovementSuggestions({ wordCount, keywordAnalysis, readabilityScore, hasProperStructure, avgSentenceLength }) {
        const suggestions = [];

        if (wordCount < 1000)
            suggestions.push({ type: 'warning', text: `Content is only ${wordCount} words. Aim for at least 1,000 words for better SEO ranking.` });
        if (wordCount < 500)
            suggestions.push({ type: 'critical', text: `Content is very short (${wordCount} words). Search engines prefer comprehensive content.` });

        const lowKeywords = keywordAnalysis.filter(k => k.status === 'low');
        lowKeywords.forEach(k => {
            suggestions.push({ type: 'warning', text: `Keyword "${k.keyword}" density is too low (${k.density}%). Aim for 0.5-2.5%.` });
        });

        const highKeywords = keywordAnalysis.filter(k => k.status === 'high');
        highKeywords.forEach(k => {
            suggestions.push({ type: 'warning', text: `Keyword "${k.keyword}" density is too high (${k.density}%). This may be seen as keyword stuffing.` });
        });

        if (!hasProperStructure)
            suggestions.push({ type: 'info', text: 'Add more headings (H2, H3) to improve content structure and readability.' });

        if (avgSentenceLength > 25)
            suggestions.push({ type: 'info', text: 'Your sentences are quite long. Consider breaking them into shorter sentences for better readability.' });

        if (readabilityScore < 40)
            suggestions.push({ type: 'warning', text: 'Readability score is low. Simplify your language and shorten sentences.' });

        if (suggestions.length === 0)
            suggestions.push({ type: 'success', text: 'Your content looks great! Keep up the good work.' });

        return suggestions;
    }

    // Generate content recommendations
    generateRecommendations(topic, seoScore) {
        const recs = [
            `Include the primary keyword "${topic}" in the first 100 words of your content.`,
            `Add internal and external links to boost SEO authority.`,
            `Use descriptive alt text for any images you include.`,
            `Keep paragraphs short (3-4 sentences max) for better readability.`,
            `Include a clear call-to-action at the end of the article.`
        ];

        if (seoScore < 70) {
            recs.unshift(`Your outline SEO score is ${seoScore}. Consider adding more targeted keywords.`);
        }

        return recs;
    }

    estimateWordCount(headings) {
        const sectionCount = headings.filter(h => h.level === 2).length;
        return sectionCount * 200 + 300; // ~200 words per section + intro/conclusion
    }

    capitalizeWords(str) {
        return str.replace(/\b\w/g, c => c.toUpperCase());
    }
}

module.exports = new SeoAgent();
