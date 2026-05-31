import React, { useEffect, useState, useRef } from 'react';
import Layout from '../components/Layout';
import { useNavigate } from 'react-router-dom';
import {
    HiOutlinePencilAlt,
    HiOutlineTrendingUp,
    HiOutlineSearch,
    HiOutlineDocumentText
} from 'react-icons/hi';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(useGSAP);

function Home() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const loggedInUser = localStorage.getItem('loggedInUser') || 'User';
    const containerRef = useRef(null);

    useGSAP(() => {
        if (loading) return;
        const ctx = containerRef.current;
        if (!ctx) return;
        const cards = ctx.querySelectorAll('.stats-grid .card');
        const gridCards = ctx.querySelectorAll('.content-grid > .card');
        const steps = ctx.querySelectorAll('.pipeline-step');

        if (cards.length) gsap.fromTo(cards,
            { y: 30, autoAlpha: 0 },
            { y: 0, autoAlpha: 1, duration: 0.45, stagger: 0.08, ease: 'power3.out' });
        if (gridCards.length) gsap.fromTo(gridCards,
            { y: 25, autoAlpha: 0 },
            { y: 0, autoAlpha: 1, duration: 0.45, stagger: 0.12, delay: 0.25, ease: 'power2.out' });
        if (steps.length) gsap.fromTo(steps,
            { scale: 0.85, autoAlpha: 0 },
            { scale: 1, autoAlpha: 1, duration: 0.35, stagger: 0.12, delay: 0.4, ease: 'back.out(1.7)' });
    }, { dependencies: [loading], scope: containerRef });

    useEffect(() => { fetchStats(); }, []);

    const fetchStats = async () => {
        try {
            const url = `${import.meta.env.VITE_API_URL}/api/pipeline/stats`;
            const response = await fetch(url, {
                headers: { 'Authorization': localStorage.getItem('token') }
            });
            const result = await response.json();
            if (result.success) setStats(result.data);
        } catch (err) {
            console.error('Stats fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Layout pageTitle="Dashboard">
            <div ref={containerRef}>
                {/* Welcome section */}
                <div style={{ marginBottom: 'var(--space-xl)' }}>
                    <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '6px' }}>
                        Welcome back, {loggedInUser}! 👋
                    </h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
                        Here's an overview of your content creation activity.
                    </p>
                </div>

                {/* Stats Cards */}
                <div className="stats-grid">
                    <div className="card" onClick={() => navigate('/history')} style={{ cursor: 'pointer' }}>
                        <div className="card-header">
                            <div>
                                <div className="card-title">Total Content</div>
                                <div className="card-value">{stats?.totalContent || 0}</div>
                                <div className="card-subtitle">Articles generated</div>
                            </div>
                            <div className="card-icon purple"><HiOutlineDocumentText /></div>
                        </div>
                    </div>
                    <div className="card" onClick={() => navigate('/seo')} style={{ cursor: 'pointer' }}>
                        <div className="card-header">
                            <div>
                                <div className="card-title">Avg SEO Score</div>
                                <div className="card-value">{stats?.avgSeoScore || 0}</div>
                                <div className="card-subtitle">Out of 100</div>
                            </div>
                            <div className="card-icon teal"><HiOutlineSearch /></div>
                        </div>
                    </div>
                    <div className="card" onClick={() => navigate('/generate')} style={{ cursor: 'pointer' }}>
                        <div className="card-header">
                            <div>
                                <div className="card-title">Total Words</div>
                                <div className="card-value">
                                    {stats?.totalWords ? (stats.totalWords > 1000 ? `${(stats.totalWords / 1000).toFixed(1)}K` : stats.totalWords) : 0}
                                </div>
                                <div className="card-subtitle">Words generated</div>
                            </div>
                            <div className="card-icon pink"><HiOutlinePencilAlt /></div>
                        </div>
                    </div>
                    <div className="card" onClick={() => navigate('/trends')} style={{ cursor: 'pointer' }}>
                        <div className="card-header">
                            <div>
                                <div className="card-title">Trending Now</div>
                                <div className="card-value" style={{ fontSize: '24px' }}>Explore</div>
                                <div className="card-subtitle">Discover hot topics</div>
                            </div>
                            <div className="card-icon yellow"><HiOutlineTrendingUp /></div>
                        </div>
                    </div>
                </div>

                {/* Quick Actions + Recent Content */}
                <div className="content-grid">
                    <div className="card">
                        <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: 'var(--space-lg)' }}>🚀 Quick Actions</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                            <button className="btn btn-primary btn-lg" onClick={() => navigate('/generate')} style={{ width: '100%', justifyContent: 'flex-start' }}>
                                <HiOutlinePencilAlt /> Generate New Content
                            </button>
                            <button className="btn btn-secondary" onClick={() => navigate('/trends')} style={{ width: '100%', justifyContent: 'flex-start' }}>
                                <HiOutlineTrendingUp /> Explore Trending Topics
                            </button>
                            <button className="btn btn-secondary" onClick={() => navigate('/seo')} style={{ width: '100%', justifyContent: 'flex-start' }}>
                                <HiOutlineSearch /> Create SEO Outline
                            </button>
                        </div>
                    </div>
                    <div className="card">
                        <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: 'var(--space-lg)' }}>📝 Recent Content</h3>
                        {stats?.recentContent && stats.recentContent.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                                {stats.recentContent.map((item, i) => (
                                    <div key={item._id} className="trend-item" onClick={() => navigate('/history')}>
                                        <div className="trend-rank">{i + 1}</div>
                                        <div className="trend-info">
                                            <div className="trend-title">{item.title}</div>
                                            <div className="trend-meta">
                                                <span>{item.wordCount} words</span>
                                                <span>SEO: {item.seoScore}/100</span>
                                            </div>
                                        </div>
                                        <span className={`badge ${item.seoScore >= 70 ? 'badge-success' : item.seoScore >= 40 ? 'badge-warning' : 'badge-danger'}`}>
                                            {item.status}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="empty-state">
                                <div className="empty-icon">📄</div>
                                <h3>No content yet</h3>
                                <p>Start by generating your first AI-powered content!</p>
                                <button className="btn btn-primary" onClick={() => navigate('/generate')}>Get Started</button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Pipeline Visual */}
                <div className="card" style={{ textAlign: 'center' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: 'var(--space-lg)' }}>⚡ AI Content Pipeline</h3>
                    <div className="pipeline-stepper">
                        <div className="pipeline-step completed">
                            <div className="step-circle"><HiOutlineTrendingUp /></div>
                            <div className="step-label">Trend Research</div>
                        </div>
                        <div className="step-connector completed"></div>
                        <div className="pipeline-step completed">
                            <div className="step-circle"><HiOutlineSearch /></div>
                            <div className="step-label">SEO Optimizer</div>
                        </div>
                        <div className="step-connector completed"></div>
                        <div className="pipeline-step completed">
                            <div className="step-circle"><HiOutlinePencilAlt /></div>
                            <div className="step-label">Content Writer</div>
                        </div>
                    </div>
                    <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                        Our three AI agents work together to create SEO-optimized content from trending topics.
                    </p>
                </div>
            </div>
        </Layout>
    );
}

export default Home;
