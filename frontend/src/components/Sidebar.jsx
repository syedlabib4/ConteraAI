import React, { useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { handleSuccess } from '../utils';
import {
    HiOutlineHome,
    HiOutlineTrendingUp,
    HiOutlineSearch,
    HiOutlinePencilAlt,
    HiOutlineClock,
    HiOutlineLogout,
    HiOutlinePhotograph,
    HiOutlineShare,
    HiOutlineLightningBolt
} from 'react-icons/hi';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(useGSAP);

function Sidebar() {
    const navigate = useNavigate();
    const loggedInUser = localStorage.getItem('loggedInUser') || 'User';
    const containerRef = useRef(null);

    useGSAP(() => {
        const ctx = containerRef.current;
        if (!ctx) return;
        const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
        tl.fromTo(ctx, { x: -260 }, { x: 0, duration: 0.6 })
            .fromTo(ctx.querySelector('.logo'),
                { scale: 0, rotation: -180 },
                { scale: 1, rotation: 0, duration: 0.5, ease: 'back.out(1.5)' }, '-=0.2')
            .fromTo(ctx.querySelectorAll('.logo-text h2, .logo-text span'),
                { x: -15, autoAlpha: 0 },
                { x: 0, autoAlpha: 1, duration: 0.4, stagger: 0.08 }, '-=0.3')
            .fromTo(ctx.querySelectorAll('.nav-item'),
                { x: -15, autoAlpha: 0 },
                { x: 0, autoAlpha: 1, duration: 0.35, stagger: 0.06 }, '-=0.2')
            .fromTo(ctx.querySelector('.user-profile'),
                { y: 15, autoAlpha: 0 },
                { y: 0, autoAlpha: 1, duration: 0.4 }, '-=0.2');
    }, { scope: containerRef });

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('loggedInUser');
        handleSuccess('Logged out successfully');
        setTimeout(() => navigate('/login'), 500);
    };

    const navItems = [
        { path: '/agent', icon: <HiOutlineLightningBolt />, label: 'Agent Dashboard' },
        { path: '/dashboard', icon: <HiOutlineHome />, label: 'Dashboard' },
        { path: '/trends', icon: <HiOutlineTrendingUp />, label: 'Trend Research' },
        { path: '/seo', icon: <HiOutlineSearch />, label: 'SEO Optimizer' },
        { path: '/generate', icon: <HiOutlinePencilAlt />, label: 'Content Generator' },
        { path: '/images', icon: <HiOutlinePhotograph />, label: 'Image Generator' },
        { path: '/social', icon: <HiOutlineShare />, label: 'Social Media' },
        { path: '/history', icon: <HiOutlineClock />, label: 'Content History' },
    ];

    return (
        <aside className="sidebar" ref={containerRef}>
            <div className="sidebar-header">
                <div className="logo">AI</div>
                <div className="logo-text">
                    <h2>ContentAI</h2>
                    <span>Multi-Agent Platform</span>
                </div>
            </div>

            <nav className="sidebar-nav">
                <div className="nav-section-title">Main Menu</div>
                {navItems.map(item => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                    >
                        <span className="nav-icon">{item.icon}</span>
                        <span>{item.label}</span>
                    </NavLink>
                ))}
            </nav>

            <div className="sidebar-footer">
                <div className="user-profile" onClick={handleLogout} title="Click to logout">
                    <div className="user-avatar">
                        {loggedInUser.charAt(0).toUpperCase()}
                    </div>
                    <div className="user-info">
                        <div className="name">{loggedInUser}</div>
                        <div className="role">Click to logout</div>
                    </div>
                    <HiOutlineLogout style={{ color: 'var(--text-muted)', fontSize: '18px' }} />
                </div>
            </div>
        </aside>
    );
}

export default Sidebar;
