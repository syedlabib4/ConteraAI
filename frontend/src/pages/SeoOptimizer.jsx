import React, { useState, useEffect, useRef } from 'react';
import Layout from '../components/Layout';
import { handleError, handleSuccess } from '../utils';
import { useLocation, useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(useGSAP);

function SeoOptimizer() {
    const location = useLocation();
    const navigate = useNavigate();
    const [topic, setTopic] = useState('');
    const [keywords, setKeywords] = useState('');
    const [outline, setOutline] = useState(null);
    const [loading, setLoading] = useState(false);
    const [analyzing, setAnalyzing] = useState(false);
    const [contentToAnalyze, setContentToAnalyze] = useState('');
    const [analysisResult, setAnalysisResult] = useState(null);
    const containerRef = useRef(null);
    const outlineRef = useRef(null);
    const analysisRef = useRef(null);

    useGSAP(() => {
        if (!outline || !outlineRef.current) return;
        gsap.fromTo(outlineRef.current, { y: 25, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.45, ease: 'power3.out' });
        const items = outlineRef.current.querySelectorAll('.outline-item');
        if (items.length) gsap.fromTo(items, { x: -15, autoAlpha: 0 }, { x: 0, autoAlpha: 1, duration: 0.25, stagger: 0.04, delay: 0.15 });
    }, { dependencies: [outline], scope: containerRef });

    useGSAP(() => {
        if (!analysisResult || !analysisRef.current) return;
        gsap.fromTo(analysisRef.current, { y: 25, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.45, ease: 'power3.out' });
    }, { dependencies: [analysisResult], scope: containerRef });

    useEffect(() => {
        if (location.state?.topic) setTopic(location.state.topic);
        if (location.state?.keywords) setKeywords(location.state.keywords.join(', '));
    }, [location.state]);

    const generateOutline = async (e) => {
        e.preventDefault();
        if (!topic.trim()) return handleError('Topic is required');
        setLoading(true);
        try {
            const kwArray = keywords.split(',').map(k => k.trim()).filter(k => k);
            const url = `${import.meta.env.VITE_API_URL}/api/seo/outline`;
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': localStorage.getItem('token') },
                body: JSON.stringify({ topic: topic.trim(), keywords: kwArray })
            });
            const result = await response.json();
            if (result.success) { setOutline(result.data); handleSuccess('SEO outline generated!'); }
            else handleError(result.message);
        } catch (err) { handleError('Failed to generate outline'); }
        finally { setLoading(false); }
    };

    const analyzeContent = async () => {
        if (!contentToAnalyze.trim()) return handleError('Paste content to analyze');
        setAnalyzing(true);
        try {
            const kwArray = keywords.split(',').map(k => k.trim()).filter(k => k);
            const url = `${import.meta.env.VITE_API_URL}/api/seo/analyze`;
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': localStorage.getItem('token') },
                body: JSON.stringify({ content: contentToAnalyze, keywords: kwArray })
            });
            const result = await response.json();
            if (result.success) { setAnalysisResult(result.data); handleSuccess('Content analyzed!'); }
        } catch (err) { handleError('Failed to analyze content'); }
        finally { setAnalyzing(false); }
    };

    return (
        <Layout pageTitle="SEO Optimizer">
            <div ref={containerRef}>
                {/* Generate Outline Form */}
                <div className="card" style={{ marginBottom: 'var(--space-xl)' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: 'var(--space-md)' }}>📝 Generate SEO Outline</h3>
                    <form onSubmit={generateOutline} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                        <div className="content-grid" style={{ marginBottom: 0 }}>
                            <div className="input-group">
                                <label>Topic *</label>
                                <input className="input-field" placeholder="e.g., artificial intelligence in healthcare" value={topic} onChange={(e) => setTopic(e.target.value)} />
                            </div>
                            <div className="input-group">
                                <label>Keywords (comma separated)</label>
                                <input className="input-field" placeholder="e.g., AI, healthcare, machine learning" value={keywords} onChange={(e) => setKeywords(e.target.value)} />
                            </div>
                        </div>
                        <button className="btn btn-primary" type="submit" disabled={loading || !topic.trim()}>
                            {loading ? <span className="spinner" style={{ width: 18, height: 18 }}></span> : '🔍'} Generate SEO Outline
                        </button>
                    </form>
                </div>

                {/* Outline Result */}
                {outline && (
                    <div ref={outlineRef} style={{ visibility: 'hidden' }}>
                        <div className="content-grid" style={{ marginBottom: 'var(--space-xl)' }}>
                            <div className="card">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
                                    <h3 style={{ fontSize: '16px', fontWeight: 700 }}>📋 Content Outline</h3>
                                    <span className="badge badge-info">~{outline.estimatedWordCount} words</span>
                                </div>
                                <div className="outline-tree">
                                    {outline.headings?.map((h, i) => (
                                        <div key={i} className={`outline-item h${h.level}`}>
                                            <span className="outline-level">H{h.level}</span> {h.text}
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
                                <div className="card">
                                    <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: 'var(--space-md)' }}>📊 SEO Score</h3>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xl)' }}>
                                        <div style={{ width: 80, height: 80, borderRadius: '50%', border: `4px solid ${outline.seoScore >= 70 ? 'var(--accent-success)' : outline.seoScore >= 40 ? 'var(--accent-warning)' : 'var(--accent-danger)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', fontWeight: 800 }}>
                                            {outline.seoScore}
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '14px', fontWeight: 600, color: outline.seoScore >= 70 ? 'var(--accent-success)' : outline.seoScore >= 40 ? 'var(--accent-warning)' : 'var(--accent-danger)' }}>
                                                {outline.seoScore >= 70 ? 'Great' : outline.seoScore >= 40 ? 'Good' : 'Needs work'}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="card">
                                    <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: 'var(--space-md)' }}>💡 Title Suggestions</h3>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                                        {outline.titleSuggestions?.map((title, i) => (
                                            <div key={i} style={{ padding: '10px 14px', background: 'var(--bg-glass)', borderRadius: 'var(--radius-sm)', fontSize: '13px', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}>{title}</div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div style={{ textAlign: 'center', marginBottom: 'var(--space-xl)' }}>
                            <button className="btn btn-primary btn-lg" onClick={() => navigate('/generate', { state: { outline, topic } })}>
                                ✨ Generate Content from this Outline
                            </button>
                        </div>
                    </div>
                )}

                {/* Content Analyzer */}
                <div className="card">
                    <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: 'var(--space-md)' }}>🔬 Analyze Existing Content</h3>
                    <div className="input-group" style={{ marginBottom: 'var(--space-md)' }}>
                        <label>Paste your content here</label>
                        <textarea className="input-field" placeholder="Paste content to get SEO analysis..." value={contentToAnalyze}
                            onChange={(e) => setContentToAnalyze(e.target.value)} style={{ minHeight: '120px' }} />
                    </div>
                    <button className="btn btn-secondary" onClick={analyzeContent} disabled={analyzing}>
                        {analyzing ? <span className="spinner" style={{ width: 18, height: 18 }}></span> : '📊'} Analyze Content
                    </button>

                    {analysisResult && (
                        <div ref={analysisRef} style={{ marginTop: 'var(--space-lg)', visibility: 'hidden' }}>
                            <div className="stats-grid">
                                {[
                                    { val: analysisResult.wordCount, label: 'Word Count', color: 'var(--accent-primary-light)' },
                                    { val: analysisResult.seoScore, label: 'SEO Score', color: 'var(--accent-secondary)' },
                                    { val: analysisResult.readabilityScore, label: `Readability (${analysisResult.readabilityGrade})`, color: 'var(--accent-tertiary)' },
                                    { val: analysisResult.headingCount, label: 'Headings', color: 'var(--accent-warning)' },
                                ].map((s, i) => (
                                    <div key={i} style={{ padding: 'var(--space-md)', background: 'var(--bg-glass)', borderRadius: 'var(--radius-md)' }}>
                                        <div style={{ fontSize: '24px', fontWeight: 800, color: s.color }}>{s.val}</div>
                                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{s.label}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
}

export default SeoOptimizer;
