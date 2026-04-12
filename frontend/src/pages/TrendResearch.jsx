import React, { useEffect, useState, useRef } from 'react';
import Layout from '../components/Layout';
import { handleError } from '../utils';
import { useNavigate } from 'react-router-dom';
import { HiOutlineTrendingUp, HiOutlineSearch, HiOutlineRefresh } from 'react-icons/hi';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(useGSAP);

function TrendResearch() {
    const [trends, setTrends] = useState([]);
    const [loading, setLoading] = useState(true);
    const [analyzing, setAnalyzing] = useState(false);
    const [searchTopic, setSearchTopic] = useState('');
    const [analysis, setAnalysis] = useState(null);
    const navigate = useNavigate();
    const containerRef = useRef(null);
    const analysisRef = useRef(null);

    useGSAP(() => {
        if (loading || !trends.length) return;
        const items = containerRef.current?.querySelectorAll('.trend-list .trend-item');
        if (items?.length) gsap.fromTo(items,
            { y: 15, autoAlpha: 0 },
            { y: 0, autoAlpha: 1, duration: 0.35, stagger: 0.04, ease: 'power2.out' });
    }, { dependencies: [loading, trends], scope: containerRef });

    useGSAP(() => {
        if (!analysis || !analysisRef.current) return;
        gsap.fromTo(analysisRef.current, { y: 25, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.45, ease: 'power3.out' });
        const chips = analysisRef.current.querySelectorAll('.keyword-chip');
        if (chips.length) gsap.fromTo(chips,
            { scale: 0.85, autoAlpha: 0 },
            { scale: 1, autoAlpha: 1, duration: 0.25, stagger: 0.04, delay: 0.15 });
    }, { dependencies: [analysis] });

    useEffect(() => { fetchTrends(); }, []);

    const fetchTrends = async () => {
        setLoading(true);
        try {
            const url = `${import.meta.env.VITE_API_URL}/api/trends`;
            const response = await fetch(url, { headers: { 'Authorization': localStorage.getItem('token') } });
            const result = await response.json();
            if (result.success) setTrends(result.data);
        } catch (err) { handleError('Failed to fetch trends'); }
        finally { setLoading(false); }
    };

    const analyzeTopic = async (topic) => {
        setAnalyzing(true); setAnalysis(null);
        try {
            const url = `${import.meta.env.VITE_API_URL}/api/trends/analyze`;
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': localStorage.getItem('token') },
                body: JSON.stringify({ topic })
            });
            const result = await response.json();
            if (result.success) setAnalysis(result.data);
        } catch (err) { handleError('Failed to analyze topic'); }
        finally { setAnalyzing(false); }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchTopic.trim()) analyzeTopic(searchTopic.trim());
    };

    const useForContent = (topic) => navigate('/generate', { state: { topic } });

    return (
        <Layout pageTitle="Trend Research">
            <div ref={containerRef}>
                {/* Search Bar */}
                <div className="card" style={{ marginBottom: 'var(--space-xl)' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: 'var(--space-md)' }}>🔍 Analyze a Topic</h3>
                    <form onSubmit={handleSearch} style={{ display: 'flex', gap: 'var(--space-md)' }}>
                        <input className="input-field" placeholder="Enter a topic to analyze..." value={searchTopic}
                            onChange={(e) => setSearchTopic(e.target.value)} style={{ flex: 1 }} />
                        <button className="btn btn-primary" type="submit" disabled={analyzing || !searchTopic.trim()}>
                            {analyzing ? <span className="spinner" style={{ width: 18, height: 18 }}></span> : <HiOutlineSearch />}
                            Analyze
                        </button>
                    </form>
                </div>

                {/* Analysis Result */}
                {analysis && (
                    <div className="card" style={{ marginBottom: 'var(--space-xl)', visibility: 'hidden' }} ref={analysisRef}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-lg)' }}>
                            <div>
                                <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '4px' }}>Analysis: {analysis.topic}</h3>
                                <span className={`badge ${analysis.isTrending ? 'badge-success' : 'badge-warning'}`}>
                                    {analysis.isTrending ? '🔥 Currently Trending' : '📊 Not Currently Trending'}
                                </span>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--accent-primary-light)' }}>{analysis.popularityScore}</div>
                                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Popularity Score</div>
                            </div>
                        </div>
                        <div className="content-grid">
                            <div>
                                <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 'var(--space-md)' }}>Keywords</h4>
                                <div className="keyword-chips">
                                    {analysis.keywords?.slice(0, 10).map((kw, i) => (
                                        <span key={i} className={`keyword-chip ${i < 3 ? '' : i < 6 ? 'secondary' : 'tertiary'}`}>{kw}</span>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 'var(--space-md)' }}>Related Topics</h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                                    {analysis.relatedTopics?.slice(0, 5).map((topic, i) => (
                                        <div key={i} className="trend-item" onClick={() => { setSearchTopic(topic); analyzeTopic(topic); }}>
                                            <div style={{ fontSize: '14px', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{topic}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div style={{ marginTop: 'var(--space-lg)', display: 'flex', gap: 'var(--space-md)' }}>
                            <button className="btn btn-primary" onClick={() => useForContent(analysis.topic)}>✨ Generate Content</button>
                            <button className="btn btn-secondary" onClick={() => navigate('/seo', { state: { topic: analysis.topic, keywords: analysis.keywords } })}>📝 Create SEO Outline</button>
                        </div>
                    </div>
                )}

                {/* Trending Topics List */}
                <div className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
                        <h3 style={{ fontSize: '16px', fontWeight: 700 }}>🔥 Trending Topics</h3>
                        <button className="btn btn-secondary btn-sm" onClick={fetchTrends} disabled={loading}>
                            <HiOutlineRefresh style={{ animation: loading ? 'spin 0.7s linear infinite' : 'none' }} /> Refresh
                        </button>
                    </div>
                    {loading ? (
                        <div className="loading-spinner"><div className="spinner spinner-lg"></div><span>Loading trending topics...</span></div>
                    ) : trends.length > 0 ? (
                        <div className="trend-list">
                            {trends.map((trend, i) => (
                                <div key={i} className="trend-item" onClick={() => { setSearchTopic(trend.title); analyzeTopic(trend.title); }}>
                                    <div className="trend-rank">{i + 1}</div>
                                    <div className="trend-info">
                                        <div className="trend-title">{trend.title}</div>
                                        <div className="trend-meta"><span>{trend.traffic} searches</span><span>{trend.source}</span></div>
                                    </div>
                                    <span className={`trend-score ${trend.popularityScore >= 70 ? 'high' : trend.popularityScore >= 40 ? 'medium' : 'low'}`}>{trend.popularityScore}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="empty-state"><div className="empty-icon">📡</div><h3>No trends available</h3><p>Try refreshing or search a specific topic.</p></div>
                    )}
                </div>
            </div>
        </Layout>
    );
}

export default TrendResearch;
