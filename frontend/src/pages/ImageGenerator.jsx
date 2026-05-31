import React, { useState, useRef, useEffect } from 'react';
import Layout from '../components/Layout';
import { handleError, handleSuccess } from '../utils';
import { HiOutlineDownload, HiOutlineTrash, HiOutlinePhotograph } from 'react-icons/hi';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(useGSAP);

const API = import.meta.env.VITE_API_URL;

function ImageGenerator() {
    const [prompt, setPrompt] = useState('');
    const [style, setStyle] = useState('photorealistic');
    const [loading, setLoading] = useState(false);
    const [images, setImages] = useState([]); // accumulated generated images
    const [gallery, setGallery] = useState([]);
    const [selectedGallery, setSelectedGallery] = useState([]);
    const [viewFull, setViewFull] = useState(null);
    const containerRef = useRef(null);
    const latestRef = useRef(null);

    useGSAP(() => {
        if (!latestRef.current) return;
        gsap.fromTo(latestRef.current,
            { y: 30, autoAlpha: 0, scale: 0.95 },
            { y: 0, autoAlpha: 1, scale: 1, duration: 0.5, ease: 'back.out(1.4)' });
    }, { dependencies: [images.length] });

    useEffect(() => { loadGallery(); }, []);

    const loadGallery = async () => {
        try {
            const res = await fetch(`${API}/api/images/list`, {
                headers: { 'Authorization': localStorage.getItem('token') }
            });
            const data = await res.json();
            if (data.success) setGallery(data.data);
        } catch (err) { console.error('Gallery load error:', err); }
    };

    const generateImage = async (e) => {
        e.preventDefault();
        if (!prompt.trim()) return handleError('Please enter a prompt');
        setLoading(true);
        try {
            const res = await fetch(`${API}/api/images/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': localStorage.getItem('token') },
                body: JSON.stringify({ prompt: prompt.trim(), style })
            });
            const data = await res.json();
            if (data.success) {
                setImages(prev => [data.data, ...prev]);
                loadGallery();
                handleSuccess('Image generated successfully!');
            } else {
                handleError(data.message || 'Generation failed');
            }
        } catch (err) { handleError('Image generation failed'); }
        finally { setLoading(false); }
    };

    const downloadImage = (filename) => {
        const a = document.createElement('a');
        a.href = `${API}/generated-images/${filename}`;
        a.download = filename;
        a.target = '_blank';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        handleSuccess('Download started!');
    };

    const deleteImage = async (filename) => {
        if (!window.confirm('Delete this image?')) return;
        try {
            const res = await fetch(`${API}/api/images/${filename}`, {
                method: 'DELETE',
                headers: { 'Authorization': localStorage.getItem('token') }
            });
            const data = await res.json();
            if (data.success) {
                setImages(prev => prev.filter(img => img.filename !== filename));
                loadGallery();
                handleSuccess('Image deleted');
            }
        } catch (err) { handleError('Delete failed'); }
    };

    const deleteSelectedGallery = async () => {
        if (selectedGallery.length === 0) return;
        if (!window.confirm(`Delete ${selectedGallery.length} selected images?`)) return;
        try {
            await Promise.all(selectedGallery.map(async (filename) => {
                await fetch(`${API}/api/images/${filename}`, { method: 'DELETE', headers: { 'Authorization': localStorage.getItem('token') } });
            }));
            setImages(prev => prev.filter(img => !selectedGallery.includes(img.filename)));
            setSelectedGallery([]);
            loadGallery();
            handleSuccess(`Deleted ${selectedGallery.length} images`);
        } catch (err) {
            handleError('Failed to delete some images');
        }
    };

    const toggleSelectAllGallery = () => {
        if (selectedGallery.length === gallery.length) setSelectedGallery([]);
        else setSelectedGallery(gallery.map(g => g.filename));
    };

    const toggleGallerySelect = (filename) => {
        setSelectedGallery(prev => prev.includes(filename) ? prev.filter(f => f !== filename) : [...prev, filename]);
    };

    const formatSize = (bytes) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / 1048576).toFixed(1) + ' MB';
    };

    return (
        <Layout pageTitle="Image Generator">
            <div ref={containerRef}>
                {/* Full Image Modal */}
                {viewFull && (
                    <div onClick={() => setViewFull(null)} style={{
                        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-xl)',
                        backdropFilter: 'blur(6px)', cursor: 'zoom-out'
                    }}>
                        <div onClick={e => e.stopPropagation()} style={{ maxWidth: '90vw', maxHeight: '85vh', position: 'relative' }}>
                            <img src={`${API}${viewFull.imageUrl}`} alt={viewFull.prompt}
                                style={{ maxWidth: '100%', maxHeight: '80vh', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)' }} />
                            <div style={{ display: 'flex', gap: 'var(--space-sm)', marginTop: 'var(--space-md)', justifyContent: 'center' }}>
                                <button className="btn btn-primary" onClick={() => downloadImage(viewFull.filename)}>
                                    <HiOutlineDownload /> Download
                                </button>
                                <button className="btn btn-secondary" onClick={() => setViewFull(null)}>Close</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Input Section */}
                <div className="card" style={{ marginBottom: 'var(--space-xl)' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: 'var(--space-md)' }}>
                        🎨 AI Image Generator
                    </h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: 'var(--space-lg)' }}>
                        Describe the image you want and our AI will generate it for you. Download instantly.
                    </p>
                    <form onSubmit={generateImage}>
                        <div className="input-group" style={{ marginBottom: 'var(--space-md)' }}>
                            <label>What image do you want? *</label>
                            <textarea className="input-field" value={prompt} onChange={e => setPrompt(e.target.value)}
                                placeholder="e.g., A futuristic city at sunset with flying cars and neon lights"
                                disabled={loading} style={{ minHeight: '100px' }} />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 'var(--space-md)', marginBottom: 'var(--space-md)' }}>
                            <div className="input-group">
                                <label>Style</label>
                                <select className="input-field select-field" value={style} onChange={e => setStyle(e.target.value)}>
                                    <option value="photorealistic">📷 Photorealistic</option>
                                    <option value="illustration">🖌️ Illustration</option>
                                    <option value="3d-render">🧊 3D Render</option>
                                    <option value="digital-art">🎨 Digital Art</option>
                                    <option value="watercolor">🌊 Watercolor</option>
                                    <option value="pixel-art">👾 Pixel Art</option>
                                    <option value="anime">🌸 Anime</option>
                                    <option value="minimalist">⬜ Minimalist</option>
                                    <option value="oil-painting">🖼️ Oil Painting</option>
                                    <option value="concept-art">🎭 Concept Art</option>
                                </select>
                            </div>
                        </div>
                        <button className="btn btn-primary btn-lg" type="submit" disabled={loading || !prompt.trim()} style={{ width: '100%' }}>
                            {loading ? (
                                <>
                                    <span className="spinner" style={{ width: 18, height: 18 }}></span>
                                    Generating image... This may take a moment
                                </>
                            ) : (
                                <>🖼️ Generate Image</>
                            )}
                        </button>
                    </form>
                </div>

                {/* Generated Images (current session) */}
                {images.length > 0 && (
                    <div style={{ marginBottom: 'var(--space-xl)' }}>
                        <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: 'var(--space-lg)' }}>
                            ✨ Generated Images
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 'var(--space-lg)' }}>
                            {images.map((img, i) => (
                                <div key={img.filename} className="card" ref={i === 0 ? latestRef : null} style={{
                                    padding: 0, overflow: 'hidden',
                                    ...(i === 0 ? { visibility: 'hidden' } : {})
                                }}>
                                    {/* Image */}
                                    <div style={{ position: 'relative', cursor: 'pointer' }} onClick={() => setViewFull(img)}>
                                        <img src={`${API}${img.imageUrl}`} alt={img.prompt}
                                            style={{ width: '100%', display: 'block', aspectRatio: '16/10', objectFit: 'cover' }} />
                                        <div style={{
                                            position: 'absolute', inset: 0,
                                            background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 50%)',
                                            opacity: 0, transition: '0.25s',
                                            display: 'flex', alignItems: 'flex-end', padding: 'var(--space-md)',
                                        }}
                                            onMouseEnter={e => e.currentTarget.style.opacity = 1}
                                            onMouseLeave={e => e.currentTarget.style.opacity = 0}
                                        >
                                            <span style={{ color: 'white', fontSize: '13px', fontWeight: 500 }}>🔍 Click to view full size</span>
                                        </div>
                                    </div>
                                    {/* Info + Actions */}
                                    <div style={{ padding: 'var(--space-md)' }}>
                                        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: 'var(--space-sm)', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                            {img.prompt}
                                        </p>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div style={{ display: 'flex', gap: 'var(--space-sm)', fontSize: '11px', color: 'var(--text-muted)' }}>
                                                <span className="badge badge-info">{style}</span>
                                                <span>{formatSize(img.fileSize)}</span>
                                            </div>
                                            <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                                                <button className="btn btn-primary btn-sm" onClick={() => downloadImage(img.filename)} title="Download">
                                                    <HiOutlineDownload />
                                                </button>
                                                <button className="btn btn-danger btn-sm" onClick={() => deleteImage(img.filename)} title="Delete">
                                                    <HiOutlineTrash />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Previous Images Gallery */}
                {gallery.length > 0 && (
                    <div className="card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
                            <h3 style={{ fontSize: '16px', fontWeight: 700 }}>
                                📁 Image Gallery ({gallery.length})
                            </h3>
                            <div style={{ display: 'flex', gap: 'var(--space-md)', alignItems: 'center' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '12px' }}>
                                    <input type="checkbox" onChange={toggleSelectAllGallery} checked={selectedGallery.length === gallery.length && gallery.length > 0} style={{ accentColor: 'var(--accent-primary)', width: 14, height: 14 }} />
                                    Select All
                                </label>
                                {selectedGallery.length > 0 && (
                                    <button className="btn btn-danger btn-sm" onClick={deleteSelectedGallery}>
                                        <HiOutlineTrash /> Delete Selected ({selectedGallery.length})
                                    </button>
                                )}
                            </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 'var(--space-md)' }}>
                            {gallery.map(img => (
                                <div key={img.filename} style={{
                                    borderRadius: 'var(--radius-md)', overflow: 'hidden',
                                    border: `2px solid ${selectedGallery.includes(img.filename) ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                                    cursor: 'pointer', transition: 'var(--transition-normal)', position: 'relative'
                                }}
                                    onClick={() => toggleGallerySelect(img.filename)}
                                >
                                    <div style={{ position: 'absolute', top: 8, left: 8, zIndex: 10 }}>
                                        <input type="checkbox" checked={selectedGallery.includes(img.filename)} readOnly style={{ accentColor: 'var(--accent-primary)', width: 16, height: 16, cursor: 'pointer' }} />
                                    </div>
                                    <img src={`${API}${img.imageUrl}`} alt="Generated"
                                        style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', display: 'block' }} />
                                    <div style={{ padding: '6px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-glass)' }}>
                                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{formatSize(img.fileSize)}</span>
                                        <div style={{ display: 'flex', gap: '6px' }}>
                                            <button className="btn btn-secondary btn-sm" style={{ padding: '4px 8px' }} onClick={(e) => { e.stopPropagation(); setViewFull(img); }} title="View Full">
                                                🔍 View
                                            </button>
                                            <button className="btn btn-secondary btn-sm" style={{ padding: '4px 8px' }} onClick={(e) => { e.stopPropagation(); downloadImage(img.filename); }} title="Download">
                                                <HiOutlineDownload style={{ fontSize: 14 }} />
                                            </button>
                                            <button className="btn btn-danger btn-sm" style={{ padding: '4px 8px' }} onClick={(e) => { e.stopPropagation(); deleteImage(img.filename); }} title="Delete">
                                                <HiOutlineTrash style={{ fontSize: 14 }} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Empty state */}
                {images.length === 0 && gallery.length === 0 && (
                    <div className="card">
                        <div className="empty-state">
                            <div className="empty-icon"><HiOutlinePhotograph /></div>
                            <h3>No images generated yet</h3>
                            <p>Enter a prompt above to generate your first AI image!</p>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
}

export default ImageGenerator;
