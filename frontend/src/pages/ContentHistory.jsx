import React, { useEffect, useState, useRef } from 'react';
import Layout from '../components/Layout';
import { handleError, handleSuccess } from '../utils';
import ReactMarkdown from 'react-markdown';
import { HiOutlineTrash, HiOutlineEye, HiOutlineX } from 'react-icons/hi';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(useGSAP);

function ContentHistory() {
    const [contents, setContents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedContent, setSelectedContent] = useState(null);
    const [selectedItems, setSelectedItems] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
    const containerRef = useRef(null);

    useGSAP(() => {
        if (loading || !contents.length) return;
        const rows = containerRef.current?.querySelectorAll('tbody tr');
        if (rows?.length) gsap.fromTo(rows, { y: 12, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.3, stagger: 0.04, ease: 'power2.out' });
    }, { dependencies: [loading, contents], scope: containerRef });

    useEffect(() => { fetchHistory(); }, []);

    const fetchHistory = async (page = 1) => {
        setLoading(true);
        try {
            const url = `${import.meta.env.VITE_API_URL}/api/content/history?page=${page}&limit=10`;
            const response = await fetch(url, { headers: { 'Authorization': localStorage.getItem('token') } });
            const result = await response.json();
            if (result.success) { setContents(result.data); setPagination(result.pagination); }
        } catch (err) { handleError('Failed to fetch history'); }
        finally { setLoading(false); }
    };

    const viewContent = async (id) => {
        try {
            const url = `${import.meta.env.VITE_API_URL}/api/content/${id}`;
            const response = await fetch(url, { headers: { 'Authorization': localStorage.getItem('token') } });
            const result = await response.json();
            if (result.success) setSelectedContent(result.data);
        } catch (err) { handleError('Failed to fetch content'); }
    };

    const deleteContent = async (id, skipConfirm = false) => {
        if (!skipConfirm && !window.confirm('Delete this content?')) return false;
        try {
            const url = `${import.meta.env.VITE_API_URL}/api/content/${id}`;
            const response = await fetch(url, { method: 'DELETE', headers: { 'Authorization': localStorage.getItem('token') } });
            const result = await response.json();
            if (result.success && !skipConfirm) { handleSuccess('Deleted'); fetchHistory(pagination.page); }
            return result.success;
        } catch (err) {
            if (!skipConfirm) handleError('Failed to delete');
            return false;
        }
    };

    const deleteSelected = async () => {
        if (selectedItems.length === 0) return;
        if (!window.confirm(`Delete ${selectedItems.length} selected items?`)) return;
        setLoading(true);
        try {
            await Promise.all(selectedItems.map(id => deleteContent(id, true)));
            handleSuccess(`Deleted ${selectedItems.length} items`);
            setSelectedItems([]);
            fetchHistory(pagination.page);
        } catch (err) {
            handleError('Failed to delete some items');
        } finally {
            setLoading(false);
        }
    };

    const toggleSelect = (id) => {
        setSelectedItems(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const toggleSelectAll = (e) => {
        if (e.target.checked) setSelectedItems(contents.map(c => c._id));
        else setSelectedItems([]);
    };

    const formatDate = (d) => new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

    return (
        <Layout pageTitle="Content History">
            <div ref={containerRef}>
                {selectedContent && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-xl)', backdropFilter: 'blur(4px)' }} onClick={() => setSelectedContent(null)}>
                        <div className="card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px', width: '100%', maxHeight: '85vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
                                <div>
                                    <h2 style={{ fontSize: '18px', fontWeight: 700 }}>{selectedContent.title}</h2>
                                    <div style={{ display: 'flex', gap: 'var(--space-md)', marginTop: '4px', fontSize: '12px', color: 'var(--text-muted)' }}>
                                        <span>{selectedContent.wordCount} words</span><span>SEO: {selectedContent.seoScore}/100</span><span>{formatDate(selectedContent.createdAt)}</span>
                                    </div>
                                </div>
                                <button className="btn btn-secondary btn-sm" onClick={() => setSelectedContent(null)}><HiOutlineX /></button>
                            </div>
                            <div className="content-preview" style={{ flex: 1, overflow: 'auto' }}><ReactMarkdown>{selectedContent.body}</ReactMarkdown></div>
                        </div>
                    </div>
                )}

                <div className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
                        <h3 style={{ fontSize: '16px', fontWeight: 700 }}>📚 Your Content ({pagination.total})</h3>
                        {selectedItems.length > 0 && (
                            <button className="btn btn-danger btn-sm" onClick={deleteSelected}>
                                <HiOutlineTrash /> Delete Selected ({selectedItems.length})
                            </button>
                        )}
                    </div>
                    {loading ? (
                        <div className="loading-spinner"><div className="spinner spinner-lg"></div><span>Loading...</span></div>
                    ) : contents.length > 0 ? (
                        <>
                            <table className="history-table">
                                <thead><tr>
                                    <th style={{ width: '40px' }}><input type="checkbox" checked={selectedItems.length === contents.length && contents.length > 0} onChange={toggleSelectAll} style={{ accentColor: 'var(--accent-primary)' }} /></th>
                                    <th>Title</th><th>Topic</th><th>Words</th><th>SEO</th><th>Status</th><th>Date</th><th>Actions</th>
                                </tr></thead>
                                <tbody>
                                    {contents.map((item) => (
                                        <tr key={item._id}>
                                            <td><input type="checkbox" checked={selectedItems.includes(item._id)} onChange={() => toggleSelect(item._id)} style={{ accentColor: 'var(--accent-primary)' }} /></td>
                                            <td style={{ fontWeight: 600, color: 'var(--text-primary)', maxWidth: '250px' }}><div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.title}</div></td>
                                            <td style={{ textTransform: 'capitalize' }}>{item.topic}</td>
                                            <td>{item.wordCount}</td>
                                            <td><span className={`badge ${item.seoScore >= 70 ? 'badge-success' : item.seoScore >= 40 ? 'badge-warning' : 'badge-danger'}`}>{item.seoScore}</span></td>
                                            <td><span className="badge badge-info">{item.status}</span></td>
                                            <td style={{ fontSize: '12px', whiteSpace: 'nowrap' }}>{formatDate(item.createdAt)}</td>
                                            <td>
                                                <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                                                    <button className="btn btn-secondary btn-sm" onClick={() => viewContent(item._id)}><HiOutlineEye /></button>
                                                    <button className="btn btn-danger btn-sm" onClick={() => deleteContent(item._id)}><HiOutlineTrash /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {pagination.pages > 1 && (
                                <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--space-sm)', marginTop: 'var(--space-lg)' }}>
                                    {Array.from({ length: pagination.pages }, (_, i) => (
                                        <button key={i + 1} className={`btn ${pagination.page === i + 1 ? 'btn-primary' : 'btn-secondary'} btn-sm`} onClick={() => fetchHistory(i + 1)}>{i + 1}</button>
                                    ))}
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="empty-state"><div className="empty-icon">📝</div><h3>No content yet</h3><p>Generate your first AI-powered content to see it here.</p></div>
                    )}
                </div>
            </div>
        </Layout>
    );
}

export default ContentHistory;
