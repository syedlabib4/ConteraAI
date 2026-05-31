import React, { useRef } from 'react';
import Sidebar from './Sidebar';
import { ToastContainer } from 'react-toastify';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(useGSAP);

function Layout({ children, pageTitle }) {
    const containerRef = useRef(null);

    useGSAP(() => {
        const ctx = containerRef.current;
        if (!ctx) return;
        gsap.fromTo(ctx.querySelector('.top-bar'),
            { y: -40, autoAlpha: 0 },
            { y: 0, autoAlpha: 1, duration: 0.5, delay: 0.2, ease: 'power3.out' });
        gsap.fromTo(ctx.querySelector('.page-content'),
            { autoAlpha: 0, y: 20 },
            { autoAlpha: 1, y: 0, duration: 0.5, delay: 0.35, ease: 'power2.out' });
    }, { scope: containerRef });

    return (
        <div className="dashboard-layout" ref={containerRef}>
            <Sidebar />
            <div className="main-content">
                <div className="top-bar" style={{ visibility: 'hidden' }}>
                    <h1 className="page-title">{pageTitle || 'Dashboard'}</h1>
                    <div className="top-actions">
                        <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                            {new Date().toLocaleDateString('en-US', {
                                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                            })}
                        </span>
                    </div>
                </div>
                <div className="page-content" style={{ visibility: 'hidden' }}>
                    {children}
                </div>
            </div>
            <ToastContainer />
        </div>
    );
}

export default Layout;
