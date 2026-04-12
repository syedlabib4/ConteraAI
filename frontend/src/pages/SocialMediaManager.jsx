import React, { useState, useRef } from 'react';
import Layout from '../components/Layout';
import { handleError, handleSuccess } from '../utils';
import { useLocation } from 'react-router-dom';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(useGSAP);

const PLATFORM_ICONS = {
    twitter: '🐦', linkedin: '💼', instagram: '📸', facebook: '📘', threads: '🧵'
};
const PLATFORM_COLORS = {
    twitter: '#1da1f2', linkedin: '#0077b5', instagram: '#e4405f', facebook: '#1877f2', threads: '#000000'
};

function SocialMediaManager() {
    const location = useLocation();
    const [topic, setTopic] = useState(location.state?.topic || '');
    const [contentSummary, setContentSummary] = useState('');
    const [tone, setTone] = useState('engaging');
    const [selectedPlatforms, setSelectedPlatforms] = useState(['twitter', 'linkedin', 'instagram', 'facebook', 'threads']);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [activePlatform, setActivePlatform] = useState('twitter');
    const containerRef = useRef(null);
    const resultRef = useRef(null);

    useGSAP(() => {
        if (!result || !resultRef.current) return;
        gsap.fromTo(resultRef.current, { y: 25, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.45, ease: 'power3.out' });
    }, { dependencies: [result] });

    const togglePlatform = (p) => {
        setSelectedPlatforms(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);
    };

    const generatePosts = async (e) => {
        e.preventDefault();
        if (!topic.trim()) return handleError('Topic is required');
        if (!selectedPlatforms.length) return handleError('Select at least one platform');
        setLoading(true);
        try {
            const url = `${import.meta.env.VITE_API_URL}/api/social/generate`;
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': localStorage.getItem('token') },
                body: JSON.stringify({ topic: topic.trim(), contentSummary, platforms: selectedPlatforms, tone })
            });
            const data = await response.json();
            if (data.success) {
                setResult(data.data);
                setActivePlatform(selectedPlatforms[0]);
                handleSuccess('Social posts generated!');
            } else handleError(data.message);
        } catch (err) { handleError('Failed to generate posts'); }
        finally { setLoading(false); }
    };

    const copyPost = (text, hashtags) => {
        const full = `${text}\n\n${hashtags?.join(' ') || ''}`;
        navigator.clipboard.writeText(full);
        handleSuccess('Post copied!');
    };

    const activePost = result?.posts?.[activePlatform];

    return (
        <Layout pageTitle="Social Media Manager">
            <div ref={containerRef}>
                {/* Input */}
                <div className="card" style={{ marginBottom: 'var(--space-xl)' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: 'var(--space-md)' }}>📱 Social Media Post Generator</h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: 'var(--space-lg)' }}>
                        Generate optimized posts for multiple platforms with hashtag strategies and content calendars.
                    </p>
                    <form onSubmit={generatePosts}>
                        <div className="content-grid" style={{ marginBottom: 'var(--space-md)' }}>
                            <div className="input-group">
                                <label>Topic *</label>
                                <input className="input-field" placeholder="e.g., AI content creation tools" value={topic} onChange={(e) => setTopic(e.target.value)} disabled={loading} />
                            </div>
                            <div className="input-group">
                                <label>Tone</label>
                                <select className="input-field select-field" value={tone} onChange={(e) => setTone(e.target.value)}>
                                    <option value="engaging">Engaging</option>
                                    <option value="professional">Professional</option>
                                    <option value="casual">Casual</option>
                                    <option value="humorous">Humorous</option>
                                    <option value="inspirational">Inspirational</option>
                                </select>
                            </div>
                        </div>
                        <div className="input-group" style={{ marginBottom: 'var(--space-md)' }}>
                            <label>Content Summary (optional)</label>
                            <textarea className="input-field" placeholder="Paste a summary of your content for more targeted posts..." value={contentSummary}
                                onChange={(e) => setContentSummary(e.target.value)} style={{ minHeight: '80px' }} />
                        </div>

                        {/* Platform Selector */}
                        <div style={{ marginBottom: 'var(--space-lg)' }}>
                            <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 'var(--space-sm)' }}>Platforms</label>
                            <div style={{ display: 'flex', gap: 'var(--space-sm)', flexWrap: 'wrap' }}>
                                {Object.entries(PLATFORM_ICONS).map(([key, icon]) => (
                                    <button key={key} type="button" onClick={() => togglePlatform(key)}
                                        style={{
                                            padding: '8px 16px', borderRadius: 'var(--radius-md)', border: `2px solid ${selectedPlatforms.includes(key) ? PLATFORM_COLORS[key] : 'var(--border-color)'}`,
                                            background: selectedPlatforms.includes(key) ? `${PLATFORM_COLORS[key]}15` : 'var(--bg-glass)',
                                            color: selectedPlatforms.includes(key) ? PLATFORM_COLORS[key] : 'var(--text-muted)',
                                            cursor: 'pointer', fontSize: '14px', fontWeight: 600, fontFamily: 'Inter, sans-serif', transition: 'all 0.2s ease',
                                            display: 'flex', alignItems: 'center', gap: '6px'
                                        }}>
                                        {icon} {key.charAt(0).toUpperCase() + key.slice(1)}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button className="btn btn-primary btn-lg" type="submit" disabled={loading || !topic.trim() || !selectedPlatforms.length} style={{ width: '100%' }}>
                            {loading ? <><span className="spinner" style={{ width: 18, height: 18 }}></span> Generating...</> : '📱 Generate Social Posts'}
                        </button>
                    </form>
                </div>

                {/* Results */}
                {result && (
                    <div ref={resultRef} style={{ visibility: 'hidden' }}>
                        {/* Platform Tabs */}
                        <div style={{ display: 'flex', gap: 'var(--space-sm)', marginBottom: 'var(--space-lg)', overflowX: 'auto', paddingBottom: '4px' }}>
                            {Object.keys(result.posts || {}).map(platform => (
                                <button key={platform} onClick={() => setActivePlatform(platform)}
                                    style={{
                                        padding: '10px 20px', borderRadius: 'var(--radius-md)', border: `2px solid ${activePlatform === platform ? PLATFORM_COLORS[platform] : 'var(--border-color)'}`,
                                        background: activePlatform === platform ? `${PLATFORM_COLORS[platform]}20` : 'var(--bg-glass)',
                                        color: activePlatform === platform ? PLATFORM_COLORS[platform] : 'var(--text-muted)',
                                        cursor: 'pointer', fontSize: '14px', fontWeight: 600, fontFamily: 'Inter, sans-serif',
                                        display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap', transition: 'all 0.2s ease'
                                    }}>
                                    {PLATFORM_ICONS[platform]} {platform.charAt(0).toUpperCase() + platform.slice(1)}
                                </button>
                            ))}
                        </div>

                        {/* Active Post */}
                        {activePost && (
                            <div className="content-grid" style={{ marginBottom: 'var(--space-xl)' }}>
                                <div className="card">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
                                        <h3 style={{ fontSize: '16px', fontWeight: 700 }}>
                                            {PLATFORM_ICONS[activePlatform]} {activePlatform.charAt(0).toUpperCase() + activePlatform.slice(1)} Post
                                        </h3>
                                        <button className="btn btn-secondary btn-sm" onClick={() => copyPost(activePost.main, activePost.hashtags)}>📋 Copy</button>
                                    </div>
                                    <div style={{ padding: 'var(--space-lg)', background: 'var(--bg-glass)', borderRadius: 'var(--radius-md)', borderLeft: `4px solid ${PLATFORM_COLORS[activePlatform]}`, fontSize: '14px', lineHeight: 1.7, color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', marginBottom: 'var(--space-md)' }}>
                                        {activePost.main}
                                    </div>
                                    {activePost.hashtags?.length > 0 && (
                                        <div className="keyword-chips" style={{ marginBottom: 'var(--space-md)' }}>
                                            {activePost.hashtags.map((tag, i) => (
                                                <span key={i} className={`keyword-chip ${i < 3 ? '' : i < 6 ? 'secondary' : 'tertiary'}`}>{tag}</span>
                                            ))}
                                        </div>
                                    )}
                                    <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                                        <strong>CTA:</strong> {activePost.cta}
                                    </div>
                                </div>

                                {/* Tips */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
                                    <div className="card">
                                        <h4 style={{ fontSize: '14px', fontWeight: 700, marginBottom: 'var(--space-md)' }}>⏰ Best Time to Post</h4>
                                        <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--accent-primary-light)' }}>{activePost.bestTime}</div>
                                    </div>
                                    <div className="card">
                                        <h4 style={{ fontSize: '14px', fontWeight: 700, marginBottom: 'var(--space-md)' }}>💡 Engagement Tip</h4>
                                        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{activePost.engagementTip}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Content Calendar + Hashtag Strategy */}
                        <div className="content-grid">
                            {result.contentCalendar && (
                                <div className="card">
                                    <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: 'var(--space-md)' }}>📅 Content Calendar</h3>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                                        <div style={{ padding: 'var(--space-md)', background: 'var(--bg-glass)', borderRadius: 'var(--radius-sm)' }}>
                                            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Frequency</div>
                                            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{result.contentCalendar.frequency}</div>
                                        </div>
                                        <div style={{ padding: 'var(--space-md)', background: 'var(--bg-glass)', borderRadius: 'var(--radius-sm)' }}>
                                            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Best Days</div>
                                            <div style={{ display: 'flex', gap: 'var(--space-sm)', marginTop: '4px' }}>
                                                {result.contentCalendar.bestDays?.map((day, i) => (
                                                    <span key={i} className="badge badge-info">{day}</span>
                                                ))}
                                            </div>
                                        </div>
                                        <div style={{ padding: 'var(--space-md)', background: 'var(--bg-glass)', borderRadius: 'var(--radius-sm)' }}>
                                            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Strategy</div>
                                            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{result.contentCalendar.strategy}</div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {result.hashtagStrategy && (
                                <div className="card">
                                    <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: 'var(--space-md)' }}>#️⃣ Hashtag Strategy</h3>
                                    {[
                                        { label: 'Primary', tags: result.hashtagStrategy.primary, cls: '' },
                                        { label: 'Secondary', tags: result.hashtagStrategy.secondary, cls: 'secondary' },
                                        { label: 'Trending', tags: result.hashtagStrategy.trending, cls: 'tertiary' },
                                    ].map((group, i) => (
                                        <div key={i} style={{ marginBottom: 'var(--space-md)' }}>
                                            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: 'var(--space-sm)', fontWeight: 600 }}>{group.label}</div>
                                            <div className="keyword-chips">
                                                {group.tags?.map((tag, ti) => (
                                                    <span key={ti} className={`keyword-chip ${group.cls}`}>{tag}</span>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
}

export default SocialMediaManager;
