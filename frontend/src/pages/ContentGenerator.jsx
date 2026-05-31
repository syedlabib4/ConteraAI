import React, { useState, useEffect, useRef } from 'react';
import Layout from '../components/Layout';
import { handleError, handleSuccess } from '../utils';
import { useLocation } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { HiOutlineTrendingUp, HiOutlineSearch, HiOutlinePencilAlt, HiOutlineClipboardCopy, HiOutlineDownload } from 'react-icons/hi';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(useGSAP);

function ContentGenerator() {
    const location = useLocation();
    const [topic, setTopic] = useState('');
    const [tone, setTone] = useState('professional');
    const [length, setLength] = useState('medium');
    const [running, setRunning] = useState(false);
    const [pipelineResult, setPipelineResult] = useState(null);
    const [currentStep, setCurrentStep] = useState(0);
    const containerRef = useRef(null);
    const resultRef = useRef(null);

    useGSAP(() => {
        if (!pipelineResult?.result || !resultRef.current) return;
        gsap.fromTo(resultRef.current, { y: 25, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.45, ease: 'power3.out' });
        const cards = resultRef.current.querySelectorAll('.stats-grid .card');
        if (cards.length) gsap.fromTo(cards, { y: 15, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.35, stagger: 0.08, delay: 0.15 });
        const chips = resultRef.current.querySelectorAll('.keyword-chip');
        if (chips.length) gsap.fromTo(chips, { scale: 0.85, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.25, stagger: 0.04, delay: 0.3 });
    }, { dependencies: [pipelineResult], scope: containerRef });

    useEffect(() => {
        if (location.state?.topic) setTopic(location.state.topic);
        if (location.state?.outline) generateFromOutline(location.state.outline);
    }, [location.state]);

    const generateFromOutline = async (outline) => {
        setRunning(true); setCurrentStep(3);
        try {
            const url = `${import.meta.env.VITE_API_URL}/api/content/generate`;
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': localStorage.getItem('token') },
                body: JSON.stringify({ outline, options: { tone, length } })
            });
            const result = await response.json();
            if (result.success) {
                setPipelineResult({ status: 'completed', result: { ...result.data, outline, seoScore: outline.seoScore, keywords: outline.keywords?.map(k => k.keyword || k) || [] } });
                setCurrentStep(4); handleSuccess('Content generated!');
            }
        } catch (err) { handleError('Content generation failed'); }
        finally { setRunning(false); }
    };

    const runPipeline = async (e) => {
        e.preventDefault();
        if (!topic.trim()) return handleError('Please enter a topic');
        setRunning(true); setPipelineResult(null); setCurrentStep(1);
        const t1 = setTimeout(() => setCurrentStep(2), 2000);
        const t2 = setTimeout(() => setCurrentStep(3), 4000);
        try {
            const url = `${import.meta.env.VITE_API_URL}/api/pipeline/run`;
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': localStorage.getItem('token') },
                body: JSON.stringify({ topic: topic.trim(), options: { tone, length } })
            });
            const result = await response.json();
            clearTimeout(t1); clearTimeout(t2);
            if (result.success && result.data) { setPipelineResult(result.data); setCurrentStep(4); handleSuccess('Pipeline completed!'); }
            else { handleError(result.message || 'Pipeline failed'); setCurrentStep(0); }
        } catch (err) { clearTimeout(t1); clearTimeout(t2); handleError('Pipeline failed'); setCurrentStep(0); }
        finally { setRunning(false); }
    };

    const copyContent = () => {
        if (pipelineResult?.result?.body) { navigator.clipboard.writeText(pipelineResult.result.body); handleSuccess('Copied!'); }
    };
    const downloadContent = () => {
        if (pipelineResult?.result?.body) {
            const blob = new Blob([pipelineResult.result.body], { type: 'text/markdown' });
            const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
            a.download = `${topic.replace(/\s+/g, '-').toLowerCase()}-article.md`; a.click(); handleSuccess('Downloaded!');
        }
    };
    const getStepStatus = (step) => currentStep > step ? 'completed' : currentStep === step ? 'active' : 'pending';

    return (
        <Layout pageTitle="Content Generator">
            <div ref={containerRef}>
                <div className="card" style={{ marginBottom: 'var(--space-xl)' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: 'var(--space-md)' }}>✨ AI Content Pipeline</h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: 'var(--space-lg)' }}>
                        Enter a topic and our AI agents will research trends, optimize for SEO, and generate content.
                    </p>
                    <form onSubmit={runPipeline}>
                        <div className="input-group" style={{ marginBottom: 'var(--space-md)' }}>
                            <label>Topic *</label>
                            <input className="input-field" placeholder="e.g., the future of AI in healthcare" value={topic} onChange={(e) => setTopic(e.target.value)} disabled={running} />
                        </div>
                        <div className="content-grid" style={{ marginBottom: 'var(--space-md)' }}>
                            <div className="input-group">
                                <label>Tone</label>
                                <select className="input-field select-field" value={tone} onChange={(e) => setTone(e.target.value)} disabled={running}>
                                    <option value="professional">Professional</option>
                                    <option value="casual">Casual</option>
                                    <option value="academic">Academic</option>
                                    <option value="persuasive">Persuasive</option>
                                    <option value="friendly">Friendly</option>
                                </select>
                            </div>
                            <div className="input-group">
                                <label>Length</label>
                                <select className="input-field select-field" value={length} onChange={(e) => setLength(e.target.value)} disabled={running}>
                                    <option value="short">Short (~600 words)</option>
                                    <option value="medium">Medium (~1200 words)</option>
                                    <option value="long">Long (~2000 words)</option>
                                </select>
                            </div>
                        </div>
                        <button className="btn btn-primary btn-lg" type="submit" disabled={running || !topic.trim()} style={{ width: '100%' }}>
                            {running ? <><span className="spinner" style={{ width: 18, height: 18 }}></span> Running Pipeline...</> : '⚡ Run Full Pipeline'}
                        </button>
                    </form>
                </div>

                {currentStep > 0 && (
                    <div className="card" style={{ marginBottom: 'var(--space-xl)' }}>
                        <div className="pipeline-stepper">
                            <div className={`pipeline-step ${getStepStatus(1)}`}><div className="step-circle"><HiOutlineTrendingUp /></div><div className="step-label">Trends</div></div>
                            <div className={`step-connector ${currentStep > 1 ? 'completed' : ''}`}></div>
                            <div className={`pipeline-step ${getStepStatus(2)}`}><div className="step-circle"><HiOutlineSearch /></div><div className="step-label">SEO</div></div>
                            <div className={`step-connector ${currentStep > 2 ? 'completed' : ''}`}></div>
                            <div className={`pipeline-step ${getStepStatus(3)}`}><div className="step-circle"><HiOutlinePencilAlt /></div><div className="step-label">Content</div></div>
                        </div>
                        {running && <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                            {currentStep === 1 && '🔍 Analyzing trends...'}{currentStep === 2 && '📝 Building SEO outline...'}{currentStep === 3 && '✍️ Generating content...'}
                        </div>}
                    </div>
                )}

                {pipelineResult?.result && (
                    <div ref={resultRef} style={{ visibility: 'hidden' }}>
                        <div className="stats-grid" style={{ marginBottom: 'var(--space-xl)' }}>
                            <div className="card"><div className="card-header"><div><div className="card-title">Words</div><div className="card-value">{pipelineResult.result.wordCount}</div></div><div className="card-icon purple"><HiOutlinePencilAlt /></div></div></div>
                            <div className="card"><div className="card-header"><div><div className="card-title">SEO Score</div><div className="card-value">{pipelineResult.result.seoScore || 'N/A'}</div></div><div className="card-icon teal"><HiOutlineSearch /></div></div></div>
                            <div className="card"><div className="card-header"><div><div className="card-title">Readability</div><div className="card-value" style={{ fontSize: '20px' }}>{pipelineResult.result.readabilityGrade}</div></div><div className="card-icon green">📖</div></div></div>
                            <div className="card"><div className="card-header"><div><div className="card-title">Engine</div><div className="card-value" style={{ fontSize: '18px' }}>{pipelineResult.result.generatedWith || 'AI'}</div></div><div className="card-icon yellow">🤖</div></div></div>
                        </div>
                        {pipelineResult.result.keywords?.length > 0 && (
                            <div className="card" style={{ marginBottom: 'var(--space-xl)' }}>
                                <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: 'var(--space-md)' }}>🏷️ Keywords</h3>
                                <div className="keyword-chips">
                                    {pipelineResult.result.keywords.slice(0, 12).map((kw, i) => (
                                        <span key={i} className={`keyword-chip ${i < 3 ? '' : i < 6 ? 'secondary' : 'tertiary'}`}>{typeof kw === 'string' ? kw : kw.keyword}</span>
                                    ))}
                                </div>
                            </div>
                        )}
                        <div className="card" style={{ marginBottom: 'var(--space-xl)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
                                <h3 style={{ fontSize: '16px', fontWeight: 700 }}>📄 Generated Content</h3>
                                <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                                    <button className="btn btn-secondary btn-sm" onClick={copyContent}><HiOutlineClipboardCopy /> Copy</button>
                                    <button className="btn btn-secondary btn-sm" onClick={downloadContent}><HiOutlineDownload /> Download</button>
                                </div>
                            </div>
                            <div className="content-preview"><ReactMarkdown>{pipelineResult.result.body}</ReactMarkdown></div>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
}

export default ContentGenerator;
