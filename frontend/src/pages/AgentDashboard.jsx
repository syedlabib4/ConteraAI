import React, { useState, useEffect, useRef } from 'react';
import Layout from '../components/Layout';
import { handleError, handleSuccess } from '../utils';
import { HiOutlineLightningBolt, HiOutlineClock, HiOutlineChartBar, HiOutlinePlay, HiOutlineStop, HiOutlineTrash, HiOutlineRefresh, HiOutlineCheckCircle, HiOutlineXCircle, HiOutlinePhotograph, HiOutlinePencilAlt } from 'react-icons/hi';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(useGSAP);

const API = import.meta.env.VITE_API_URL;

const AGENT_ICONS = { TrendAgent: '📊', SeoAgent: '🔍', ContentAgent: '✍️', ImageAgent: '🖼️', SocialAgent: '📱', Orchestrator: '🤖' };
const AGENT_COLORS = { TrendAgent: '#6c5ce7', SeoAgent: '#00cec9', ContentAgent: '#fdcb6e', ImageAgent: '#e84393', SocialAgent: '#1da1f2', Orchestrator: '#55efc4' };

const SCHEDULE_PRESETS = [
    { id: 'every-minute', label: 'Every minute' },
    { id: 'daily-morning', label: 'Every day at 9 AM' },
    { id: 'weekdays-morning', label: 'Weekdays at 9 AM' },
    { id: 'weekly-monday', label: 'Every Monday at 9 AM' },
    { id: 'twice-weekly', label: 'Mon & Thu at 9 AM' },
    { id: 'every-6-hours', label: 'Every 6 hours' },
    { id: 'custom', label: 'Exact Date & Time (One-time run)' },
];

function AgentDashboard() {
    const [topic, setTopic] = useState('');
    const [tone, setTone] = useState('professional');
    const [length, setLength] = useState('medium');
    const [imageStyle, setImageStyle] = useState('photorealistic');
    const [running, setRunning] = useState(false);
    const [activeTask, setActiveTask] = useState(null);
    const [history, setHistory] = useState([]);
    const [analytics, setAnalytics] = useState(null);
    const [schedules, setSchedules] = useState([]);
    const [editingPipelineId, setEditingPipelineId] = useState(null);
    const [editPipelineDate, setEditPipelineDate] = useState('');
    const [singlePosts, setSinglePosts] = useState([]);
    const [editingPostId, setEditingPostId] = useState(null);
    const [editPostDate, setEditPostDate] = useState('');
    const [showSchedule, setShowSchedule] = useState(false);
    const [schedulePreset, setSchedulePreset] = useState('every-minute');
    const [customCron, setCustomCron] = useState('* * * * *');
    const [exactScheduleDate, setExactScheduleDate] = useState('');
    const [tab, setTab] = useState('run'); // run | history | analytics
    const containerRef = useRef(null);
    const logRef = useRef(null);

    useGSAP(() => {
        if (!activeTask?.agentLog?.length || !logRef.current) return;
        const items = logRef.current.querySelectorAll('.agent-log-item');
        if (items.length) {
            const last = items[items.length - 1];
            gsap.fromTo(last, { x: -20, autoAlpha: 0 }, { x: 0, autoAlpha: 1, duration: 0.35, ease: 'power2.out' });
        }
    }, { dependencies: [activeTask?.agentLog?.length] });

    useEffect(() => { loadHistory(); loadAnalytics(); loadSchedules(); loadSinglePosts(); }, []);

    const loadHistory = async () => {
        try {
            const res = await fetch(`${API}/api/agent/history`, { headers: { 'Authorization': localStorage.getItem('token') } });
            const data = await res.json();
            if (data.success) setHistory(data.data);
        } catch (err) { console.error(err); }
    };

    const loadAnalytics = async () => {
        try {
            const res = await fetch(`${API}/api/agent/analytics`, { headers: { 'Authorization': localStorage.getItem('token') } });
            const data = await res.json();
            if (data.success) setAnalytics(data.data);
        } catch (err) { console.error(err); }
    };

    const loadSchedules = async () => {
        try {
            const res = await fetch(`${API}/api/agent/schedules`, { headers: { 'Authorization': localStorage.getItem('token') } });
            const data = await res.json();
            if (data.success) setSchedules(data.data);
        } catch (err) { console.error(err); }
    };

    const loadSinglePosts = async () => {
        try {
            const res = await fetch(`${API}/api/agent/schedule-one-time`, { headers: { 'Authorization': localStorage.getItem('token') } });
            const data = await res.json();
            if (data.success) setSinglePosts(data.data);
        } catch (err) { console.error(err); }
    };

    const runAgent = async (e) => {
        e.preventDefault();
        if (!topic.trim()) return handleError('Enter a topic');
        setRunning(true);
        setActiveTask(null);
        try {
            const res = await fetch(`${API}/api/agent/run`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': localStorage.getItem('token') },
                body: JSON.stringify({ topic: topic.trim(), tone, length, imageStyle, imageCount: 2, platforms: ['twitter', 'linkedin', 'instagram', 'facebook'] })
            });
            const data = await res.json();
            if (data.success) {
                setActiveTask(data.data);
                handleSuccess('Autonomous pipeline completed!');
                loadHistory();
                loadAnalytics();
            } else {
                handleError(data.message);
            }
        } catch (err) { handleError('Agent pipeline failed'); }
        finally { setRunning(false); }
    };

    const scheduleAgent = async () => {
        if (!topic.trim()) return handleError('Enter a topic');
        try {
            const bodyData = { topic: topic.trim(), tone, length, imageStyle };
            if (schedulePreset === 'custom') {
                if (!exactScheduleDate) return handleError('Please select a date and time.');
                const d = new Date(exactScheduleDate);
                // Convert exact datetime to Cron (Minute Hour DayOfMonth Month DayOfWeek)
                const cronExpression = `${d.getMinutes()} ${d.getHours()} ${d.getDate()} ${d.getMonth() + 1} *`;

                bodyData.cronExpression = cronExpression;
                bodyData.label = `One-time: ${d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`;
            } else {
                bodyData.preset = schedulePreset;
            }

            const res = await fetch(`${API}/api/agent/schedule`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': localStorage.getItem('token') },
                body: JSON.stringify(bodyData)
            });
            const data = await res.json();
            if (data.success) { handleSuccess('Pipeline scheduled!'); loadSchedules(); setShowSchedule(false); }
            else handleError(data.message);
        } catch (err) { handleError('Failed to schedule'); }
    };

    const cancelSchedule = async (id) => {
        try {
            const res = await fetch(`${API}/api/agent/schedule/${id}`, { method: 'DELETE', headers: { 'Authorization': localStorage.getItem('token') } });
            const data = await res.json();
            if (data.success) { handleSuccess('Schedule cancelled'); loadSchedules(); }
        } catch (err) { handleError('Failed to cancel'); }
    };

    const scheduleExactPost = async (platform, postBody, imageUrl) => {
        if (!exactScheduleDate) return handleError('Please select a date and time first');
        try {
            // Include hashtags in caption
            const caption = postBody + '\n\n' + (activeTask.results.social?.posts[platform]?.hashtags || []).join(' ');

            // Pollinations URL reconstruction to ensure it's public for Meta
            const enhancedPrompt = `${topic}, ${imageStyle} style, highly detailed`;
            const publicImageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(enhancedPrompt)}?width=1024&height=1024&nologo=true&enhance=true`;

            const res = await fetch(`${API}/api/agent/schedule-one-time`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': localStorage.getItem('token') },
                body: JSON.stringify({ caption, imageUrl: publicImageUrl, scheduledTime: exactScheduleDate })
            });
            const data = await res.json();
            if (data.success) {
                handleSuccess(data.message);
                setExactScheduleDate('');
                loadSinglePosts();
            } else {
                handleError(data.message);
            }
        } catch (err) {
            handleError('Failed to schedule exact post');
        }
    };

    const cancelSinglePost = async (id) => {
        try {
            const res = await fetch(`${API}/api/agent/schedule-one-time/${id}`, { method: 'DELETE', headers: { 'Authorization': localStorage.getItem('token') } });
            const data = await res.json();
            if (data.success) { handleSuccess('Scheduled post cancelled'); loadSinglePosts(); }
        } catch (err) { handleError('Failed to cancel post'); }
    };

    const saveEditedPipelineSchedule = async (id) => {
        if (!editPipelineDate) return;
        const d = new Date(editPipelineDate);
        const cronExpression = `${d.getMinutes()} ${d.getHours()} ${d.getDate()} ${d.getMonth() + 1} *`;
        const label = `One-time: ${d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`;

        try {
            const res = await fetch(`${API}/api/agent/schedule/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': localStorage.getItem('token') },
                body: JSON.stringify({ cronExpression, label })
            });
            const data = await res.json();
            if (data.success) {
                handleSuccess('Pipeline time updated!');
                setEditingPipelineId(null);
                loadSchedules();
            } else { handleError(data.message); }
        } catch (err) { handleError('Failed to save changes'); }
    };

    const saveEditedSinglePost = async (id) => {
        if (!editPostDate) return;
        try {
            const res = await fetch(`${API}/api/agent/schedule-one-time/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': localStorage.getItem('token') },
                body: JSON.stringify({ scheduledTime: editPostDate })
            });
            const data = await res.json();
            if (data.success) {
                handleSuccess('Post format updated!');
                setEditingPostId(null);
                setEditPostDate('');
                loadSinglePosts();
            } else {
                handleError(data.message);
            }
        } catch (err) { handleError('Failed to save changes'); }
    };

    const viewTask = async (id) => {
        try {
            const res = await fetch(`${API}/api/agent/task/${id}`, { headers: { 'Authorization': localStorage.getItem('token') } });
            const data = await res.json();
            if (data.success) { setActiveTask(data.data); setTab('run'); }
        } catch (err) { handleError('Failed to load task'); }
    };

    const formatDuration = (ms) => {
        if (!ms) return '—';
        const s = ms / 1000;
        return s < 60 ? `${s.toFixed(1)}s` : `${Math.floor(s / 60)}m ${Math.round(s % 60)}s`;
    };

    const formatDate = (d) => d ? new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

    return (
        <Layout pageTitle="Agent Dashboard">
            <div ref={containerRef}>
                {/* Tab Navigation */}
                <div style={{ display: 'flex', gap: 'var(--space-sm)', marginBottom: 'var(--space-xl)' }}>
                    {[
                        { id: 'run', label: '⚡ Run Agent', icon: <HiOutlineLightningBolt /> },
                        { id: 'history', label: '📋 History', icon: <HiOutlineClock /> },
                        { id: 'analytics', label: '📊 Analytics', icon: <HiOutlineChartBar /> },
                    ].map(t => (
                        <button key={t.id} onClick={() => setTab(t.id)} style={{
                            padding: '10px 20px', borderRadius: 'var(--radius-md)',
                            border: `2px solid ${tab === t.id ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                            background: tab === t.id ? 'rgba(108,92,231,0.15)' : 'var(--bg-glass)',
                            color: tab === t.id ? 'var(--accent-primary-light)' : 'var(--text-muted)',
                            cursor: 'pointer', fontSize: '14px', fontWeight: 600, fontFamily: 'Inter, sans-serif',
                            display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s ease'
                        }}>{t.icon} {t.label}</button>
                    ))}
                </div>

                {/* ═══════════ RUN TAB ═══════════ */}
                {tab === 'run' && (
                    <>
                        <div className="card" style={{ marginBottom: 'var(--space-xl)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', marginBottom: 'var(--space-md)' }}>
                                <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>🤖</div>
                                <div>
                                    <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Autonomous Agent</h3>
                                    <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>One topic → Trends + SEO + Content + Images + Social Posts — fully automatic</p>
                                </div>
                            </div>

                            <form onSubmit={runAgent}>
                                <div className="input-group" style={{ marginBottom: 'var(--space-md)' }}>
                                    <label>Topic *</label>
                                    <input className="input-field" value={topic} onChange={e => setTopic(e.target.value)} placeholder="e.g., AI in healthcare 2025" disabled={running} />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-md)', marginBottom: 'var(--space-md)' }}>
                                    <div className="input-group"><label>Tone</label>
                                        <select className="input-field select-field" value={tone} onChange={e => setTone(e.target.value)}>
                                            <option value="professional">Professional</option><option value="casual">Casual</option><option value="academic">Academic</option><option value="persuasive">Persuasive</option>
                                        </select>
                                    </div>
                                    <div className="input-group"><label>Length</label>
                                        <select className="input-field select-field" value={length} onChange={e => setLength(e.target.value)}>
                                            <option value="short">Short (~600w)</option><option value="medium">Medium (~1200w)</option><option value="long">Long (~2000w)</option>
                                        </select>
                                    </div>
                                    <div className="input-group"><label>Image Style</label>
                                        <select className="input-field select-field" value={imageStyle} onChange={e => setImageStyle(e.target.value)}>
                                            <option value="photorealistic">📷 Photorealistic</option><option value="illustration">🖌️ Illustration</option><option value="3d-render">🧊 3D Render</option><option value="digital-art">🎨 Digital Art</option>
                                        </select>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
                                    <button className="btn btn-primary btn-lg" type="submit" disabled={running || !topic.trim()} style={{ flex: 1 }}>
                                        {running ? <><span className="spinner" style={{ width: 18, height: 18 }}></span> Running 5 Agents...</> : <><HiOutlinePlay /> Run Autonomous Pipeline</>}
                                    </button>
                                    <button type="button" className="btn btn-secondary btn-lg" onClick={() => setShowSchedule(!showSchedule)} disabled={running}>
                                        <HiOutlineClock /> Schedule
                                    </button>
                                </div>
                            </form>

                            {/* Schedule Panel */}
                            {showSchedule && (
                                <div style={{ marginTop: 'var(--space-lg)', padding: 'var(--space-lg)', background: 'var(--bg-glass)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                                    <h4 style={{ fontSize: '14px', fontWeight: 700, marginBottom: 'var(--space-md)' }}>⏰ Schedule Recurring Pipeline</h4>
                                    <div className="input-group" style={{ marginBottom: 'var(--space-md)' }}>
                                        <label>Frequency</label>
                                        <select className="input-field select-field" value={schedulePreset} onChange={e => setSchedulePreset(e.target.value)}>
                                            {SCHEDULE_PRESETS.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
                                        </select>
                                    </div>
                                    {schedulePreset === 'custom' && (
                                        <div className="input-group" style={{ marginBottom: 'var(--space-md)' }}>
                                            <label>Select Date & Time</label>
                                            <input
                                                type="datetime-local"
                                                className="input-field"
                                                value={exactScheduleDate}
                                                onChange={e => setExactScheduleDate(e.target.value)}
                                            />
                                        </div>
                                    )}
                                    <button className="btn btn-primary" onClick={scheduleAgent}>📅 Schedule Pipeline</button>
                                </div>
                            )}
                        </div>

                        {/* Agent Pipeline Stepper */}
                        {(running || activeTask) && (
                            <div className="card" style={{ marginBottom: 'var(--space-xl)' }}>
                                <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: 'var(--space-lg)' }}>🤖 Agent Pipeline</h3>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)', gap: 'var(--space-sm)' }}>
                                    {['TrendAgent', 'SeoAgent', 'ContentAgent', 'ImageAgent', 'SocialAgent'].map((agent, i) => {
                                        const logs = activeTask?.agentLog?.filter(l => l.agent === agent) || [];
                                        const isDone = logs.some(l => l.status === 'success');
                                        const isFailed = logs.some(l => l.status === 'failed');
                                        const isRunning = logs.some(l => l.status === 'running') && !isDone;
                                        return (
                                            <React.Fragment key={agent}>
                                                {i > 0 && <div style={{ flex: 1, height: 2, background: isDone ? 'var(--accent-success)' : 'var(--border-color)', transition: 'background 0.3s' }}></div>}
                                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                                                    <div style={{
                                                        width: 44, height: 44, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px',
                                                        background: isDone ? 'rgba(85,239,196,0.15)' : isFailed ? 'rgba(225,112,85,0.15)' : isRunning ? 'rgba(108,92,231,0.2)' : 'var(--bg-glass)',
                                                        border: `2px solid ${isDone ? 'var(--accent-success)' : isFailed ? 'var(--accent-danger)' : isRunning ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                                                        transition: 'all 0.3s', animation: isRunning ? 'pulse 1.5s infinite' : 'none'
                                                    }}>{AGENT_ICONS[agent]}</div>
                                                    <span style={{ fontSize: '10px', color: isDone ? 'var(--accent-success)' : isRunning ? 'var(--accent-primary-light)' : 'var(--text-muted)', fontWeight: 600 }}>
                                                        {agent.replace('Agent', '')}
                                                    </span>
                                                </div>
                                            </React.Fragment>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Agent Activity Log */}
                        {activeTask?.agentLog?.length > 0 && (
                            <div className="card" style={{ marginBottom: 'var(--space-xl)' }}>
                                <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: 'var(--space-lg)' }}>📋 Agent Activity Log</h3>
                                <div ref={logRef} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                                    {activeTask.agentLog.map((log, i) => (
                                        <div key={i} className="agent-log-item" style={{
                                            display: 'flex', alignItems: 'flex-start', gap: 'var(--space-md)', padding: 'var(--space-md)',
                                            background: 'var(--bg-glass)', borderRadius: 'var(--radius-sm)',
                                            borderLeft: `3px solid ${log.status === 'success' ? 'var(--accent-success)' : log.status === 'failed' ? 'var(--accent-danger)' : AGENT_COLORS[log.agent] || 'var(--accent-primary)'}`
                                        }}>
                                            <span style={{ fontSize: '18px', flexShrink: 0 }}>{AGENT_ICONS[log.agent] || '🔧'}</span>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <span style={{ fontSize: '13px', fontWeight: 600, color: AGENT_COLORS[log.agent] || 'var(--text-primary)' }}>{log.agent}</span>
                                                    <div style={{ display: 'flex', gap: 'var(--space-sm)', alignItems: 'center' }}>
                                                        {log.duration > 0 && <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{formatDuration(log.duration)}</span>}
                                                        {log.status === 'success' && <HiOutlineCheckCircle style={{ color: 'var(--accent-success)', fontSize: 16 }} />}
                                                        {log.status === 'failed' && <HiOutlineXCircle style={{ color: 'var(--accent-danger)', fontSize: 16 }} />}
                                                        {log.status === 'running' && <span className="spinner" style={{ width: 14, height: 14 }}></span>}
                                                    </div>
                                                </div>
                                                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: 2 }}>{log.action}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Results Summary */}
                        {activeTask?.status === 'completed' && activeTask.results && (
                            <div className="card">
                                <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: 'var(--space-lg)' }}>✅ Pipeline Results</h3>
                                <div className="stats-grid">
                                    <div style={{ padding: 'var(--space-md)', background: 'var(--bg-glass)', borderRadius: 'var(--radius-md)' }}>
                                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Words Written</div>
                                        <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--accent-primary-light)' }}>{activeTask.results.content?.wordCount || 0}</div>
                                    </div>
                                    <div style={{ padding: 'var(--space-md)', background: 'var(--bg-glass)', borderRadius: 'var(--radius-md)' }}>
                                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>SEO Score</div>
                                        <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--accent-secondary)' }}>{activeTask.results.seo?.seoScore || 0}</div>
                                    </div>
                                    <div style={{ padding: 'var(--space-md)', background: 'var(--bg-glass)', borderRadius: 'var(--radius-md)' }}>
                                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Images</div>
                                        <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--accent-tertiary)' }}>{activeTask.results.images?.count || 0}</div>
                                    </div>
                                    <div style={{ padding: 'var(--space-md)', background: 'var(--bg-glass)', borderRadius: 'var(--radius-md)' }}>
                                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Social Posts</div>
                                        <div style={{ fontSize: '24px', fontWeight: 800, color: '#1da1f2' }}>{Object.keys(activeTask.results.social?.posts || {}).length}</div>
                                    </div>
                                </div>
                                {/* Show generated images */}
                                {activeTask.results.images?.images?.length > 0 && (
                                    <div style={{ marginTop: 'var(--space-lg)' }}>
                                        <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: 'var(--space-sm)' }}>🖼️ Generated Images</h4>
                                        <div style={{ display: 'flex', gap: 'var(--space-md)', overflowX: 'auto' }}>
                                            {activeTask.results.images.images.map((url, i) => (
                                                <img key={i} src={`${API}${url}`} alt={`Generated ${i + 1}`} style={{ height: 120, borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }} />
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {/* Show social post previews */}
                                {activeTask.results.social?.posts && (
                                    <div style={{ marginTop: 'var(--space-lg)' }}>
                                        <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: 'var(--space-sm)' }}>📱 Social Posts Preview</h4>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-md)' }}>
                                            {Object.entries(activeTask.results.social.posts).map(([platform, post]) => (
                                                <div key={platform} style={{ padding: 'var(--space-md)', background: 'var(--bg-glass)', borderRadius: 'var(--radius-sm)', borderLeft: `3px solid ${AGENT_COLORS.SocialAgent}` }}>
                                                    <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'capitalize', marginBottom: 4 }}>{platform}</div>
                                                    <p style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{post.main}</p>

                                                    {platform === 'instagram' && activeTask.results.images?.images?.length > 0 && (
                                                        <div style={{ marginTop: 'var(--space-md)', paddingTop: 'var(--space-sm)', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                                                            <input
                                                                type="datetime-local"
                                                                className="input-field"
                                                                style={{ padding: '6px 10px', fontSize: '11px', marginBottom: '8px', minHeight: 'unset' }}
                                                                value={exactScheduleDate}
                                                                onChange={(e) => setExactScheduleDate(e.target.value)}
                                                            />
                                                            <button
                                                                className="btn btn-primary btn-sm"
                                                                style={{ width: '100%', fontSize: '11px', padding: '6px' }}
                                                                onClick={() => scheduleExactPost(platform, post.main, activeTask.results.images.images[0])}
                                                            >
                                                                <HiOutlineClock /> Auto-Post Live at Exact Time
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Scheduled Jobs & Single Posts */}
                        {(schedules.length > 0 || singlePosts.length > 0) && (
                            <div className="card" style={{ marginTop: 'var(--space-xl)' }}>
                                <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: 'var(--space-md)' }}>⏰ Active Schedules & Posts</h3>

                                {schedules.length > 0 && <h4 style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: 'var(--space-sm)' }}>Recurring Pipelines</h4>}
                                {schedules.map(s => (
                                    <div key={s.taskId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-md)', background: 'var(--bg-glass)', borderRadius: 'var(--radius-sm)', marginBottom: 'var(--space-sm)' }}>
                                        <div>
                                            <div style={{ fontSize: '14px', fontWeight: 600 }}>{s.topic}</div>
                                            {editingPipelineId === s.taskId ? (
                                                <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                                                    <input
                                                        type="datetime-local"
                                                        className="input-field"
                                                        style={{ padding: '4px 8px', fontSize: '11px', minHeight: 'unset' }}
                                                        value={editPipelineDate}
                                                        onChange={(e) => setEditPipelineDate(e.target.value)}
                                                    />
                                                    <button className="btn btn-primary btn-sm" style={{ padding: '4px 8px' }} onClick={() => saveEditedPipelineSchedule(s.taskId)}>Save</button>
                                                    <button className="btn btn-secondary btn-sm" style={{ padding: '4px 8px' }} onClick={() => setEditingPipelineId(null)}>Cancel</button>
                                                </div>
                                            ) : (
                                                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{s.scheduleLabel} • Next: {formatDate(s.nextRun)}</div>
                                            )}
                                        </div>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button className="btn btn-secondary btn-sm" onClick={() => {
                                                const d = new Date(s.nextRun);
                                                d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
                                                setEditPipelineDate(d.toISOString().slice(0, 16));
                                                setEditingPipelineId(s.taskId);
                                            }} disabled={editingPipelineId === s.taskId}><HiOutlinePencilAlt /></button>
                                            <button className="btn btn-danger btn-sm" onClick={() => cancelSchedule(s.taskId)} disabled={editingPipelineId === s.taskId}><HiOutlineTrash /></button>
                                        </div>
                                    </div>
                                ))}

                                {singlePosts.length > 0 && <h4 style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: 'var(--space-sm)', marginTop: schedules.length > 0 ? 'var(--space-md)' : 0 }}>Scheduled Single Posts</h4>}
                                {singlePosts.map(p => (
                                    <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-md)', background: 'var(--bg-glass)', borderRadius: 'var(--radius-sm)', marginBottom: 'var(--space-sm)' }}>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: '14px', fontWeight: 600, display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{p.caption.substring(0, 100)}...</div>

                                            {editingPostId === p.id ? (
                                                <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                                                    <input
                                                        type="datetime-local"
                                                        className="input-field"
                                                        style={{ padding: '4px 8px', fontSize: '11px', minHeight: 'unset' }}
                                                        value={editPostDate}
                                                        onChange={(e) => setEditPostDate(e.target.value)}
                                                    />
                                                    <button className="btn btn-primary btn-sm" style={{ padding: '4px 8px' }} onClick={() => saveEditedSinglePost(p.id)}>Save</button>
                                                    <button className="btn btn-secondary btn-sm" style={{ padding: '4px 8px' }} onClick={() => setEditingPostId(null)}>Cancel</button>
                                                </div>
                                            ) : (
                                                <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', gap: 'var(--space-md)' }}>
                                                    <span>Posting on: {formatDate(p.targetDate)}</span>
                                                </div>
                                            )}
                                        </div>
                                        <div style={{ display: 'flex', gap: '8px', marginLeft: '16px' }}>
                                            <button className="btn btn-secondary btn-sm" onClick={() => {
                                                // Pre-fill the local timezone string for datetime-local
                                                const d = new Date(p.targetDate);
                                                d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
                                                setEditPostDate(d.toISOString().slice(0, 16));
                                                setEditingPostId(p.id);
                                            }} disabled={editingPostId === p.id}><HiOutlinePencilAlt /></button>
                                            <button className="btn btn-danger btn-sm" onClick={() => cancelSinglePost(p.id)} disabled={editingPostId === p.id}><HiOutlineTrash /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}

                {/* ═══════════ HISTORY TAB ═══════════ */}
                {tab === 'history' && (
                    <div className="card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
                            <h3 style={{ fontSize: '16px', fontWeight: 700 }}>📋 Agent Run History</h3>
                            <button className="btn btn-secondary btn-sm" onClick={loadHistory}><HiOutlineRefresh /> Refresh</button>
                        </div>
                        {history.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                                {history.map(task => (
                                    <div key={task._id} onClick={() => viewTask(task._id)} style={{
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-md)',
                                        background: 'var(--bg-glass)', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                                        border: '1px solid var(--border-color)', transition: 'all 0.2s'
                                    }}>
                                        <div>
                                            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{task.topic}</div>
                                            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: 2 }}>
                                                {task.type} • {formatDate(task.createdAt)} • {task.agentLog?.length || 0} steps
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                                            {task.completedAt && task.startedAt && (
                                                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{formatDuration(new Date(task.completedAt) - new Date(task.startedAt))}</span>
                                            )}
                                            <span className={`badge ${task.status === 'completed' ? 'badge-success' : task.status === 'failed' ? 'badge-danger' : 'badge-info'}`}>
                                                {task.status}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="empty-state"><div className="empty-icon">🤖</div><h3>No agent runs yet</h3><p>Run your first autonomous pipeline to see history here.</p></div>
                        )}
                    </div>
                )}

                {/* ═══════════ ANALYTICS TAB ═══════════ */}
                {tab === 'analytics' && (
                    <>
                        <div className="stats-grid" style={{ marginBottom: 'var(--space-xl)' }}>
                            {[
                                { label: 'Total Runs', value: analytics?.totalTasks || 0, icon: '🤖', color: 'var(--accent-primary-light)' },
                                { label: 'Success Rate', value: `${analytics?.successRate || 0}%`, icon: '✅', color: 'var(--accent-success)' },
                                { label: 'Words Generated', value: (analytics?.totalWordsGenerated || 0).toLocaleString(), icon: '✍️', color: 'var(--accent-secondary)' },
                                { label: 'Images Created', value: analytics?.totalImagesGenerated || 0, icon: '🖼️', color: 'var(--accent-tertiary)' },
                                { label: 'Social Posts', value: analytics?.totalPostsGenerated || 0, icon: '📱', color: '#1da1f2' },
                                { label: 'Avg Duration', value: `${analytics?.avgDuration || 0}s`, icon: '⏱️', color: 'var(--accent-warning)' },
                            ].map((stat, i) => (
                                <div key={i} className="card">
                                    <div className="card-header">
                                        <div>
                                            <div className="card-title">{stat.label}</div>
                                            <div className="card-value" style={{ color: stat.color }}>{stat.value}</div>
                                        </div>
                                        <div className="card-icon" style={{ fontSize: '24px' }}>{stat.icon}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        {/* Agent Activity Breakdown */}
                        {analytics?.agentActions && Object.keys(analytics.agentActions).length > 0 && (
                            <div className="card">
                                <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: 'var(--space-lg)' }}>🔧 Agent Activity Breakdown</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                                    {Object.entries(analytics.agentActions).sort(([, a], [, b]) => b - a).map(([agent, count]) => {
                                        const max = Math.max(...Object.values(analytics.agentActions));
                                        return (
                                            <div key={agent} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                                                <span style={{ fontSize: '18px', width: 30, textAlign: 'center' }}>{AGENT_ICONS[agent] || '🔧'}</span>
                                                <span style={{ fontSize: '13px', fontWeight: 600, width: 110, color: AGENT_COLORS[agent] || 'var(--text-primary)' }}>{agent}</span>
                                                <div style={{ flex: 1, height: 8, background: 'var(--bg-glass)', borderRadius: 4 }}>
                                                    <div style={{ width: `${(count / max) * 100}%`, height: '100%', borderRadius: 4, background: AGENT_COLORS[agent] || 'var(--accent-primary)', transition: 'width 0.5s' }}></div>
                                                </div>
                                                <span style={{ fontSize: '13px', fontWeight: 700, width: 40, textAlign: 'right' }}>{count}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </Layout>
    );
}

export default AgentDashboard;
