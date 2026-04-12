import React, { useState, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ToastContainer } from 'react-toastify';
import { handleError, handleSuccess } from '../utils';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(useGSAP);

function Signup() {
    const [signupInfo, setSignupInfo] = useState({ name: '', email: '', password: '' })
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const containerRef = useRef(null);

    useGSAP(() => {
        const ctx = containerRef.current;
        if (!ctx) return;
        const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
        tl.fromTo(ctx.querySelector('.auth-container'),
            { y: 60, autoAlpha: 0 },
            { y: 0, autoAlpha: 1, duration: 0.7 })
            .fromTo(ctx.querySelector('.brand h1'),
                { y: 20, autoAlpha: 0 },
                { y: 0, autoAlpha: 1, duration: 0.5 }, '-=0.3')
            .fromTo(ctx.querySelector('.brand p'),
                { y: 10, autoAlpha: 0 },
                { y: 0, autoAlpha: 1, duration: 0.4 }, '-=0.3')
            .fromTo(ctx.querySelector('h2'),
                { autoAlpha: 0 },
                { autoAlpha: 1, duration: 0.4 }, '-=0.2')
            .fromTo(ctx.querySelectorAll('.form-group'),
                { x: -20, autoAlpha: 0 },
                { x: 0, autoAlpha: 1, duration: 0.4, stagger: 0.12 }, '-=0.1')
            .fromTo(ctx.querySelector('.btn-primary'),
                { scale: 0.92, autoAlpha: 0 },
                { scale: 1, autoAlpha: 1, duration: 0.4, ease: 'back.out(1.7)' }, '-=0.1')
            .fromTo(ctx.querySelector('.auth-link'),
                { autoAlpha: 0 },
                { autoAlpha: 1, duration: 0.3 }, '-=0.1');
    }, { scope: containerRef });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setSignupInfo(prev => ({ ...prev, [name]: value }));
    }

    const handleSignup = async (e) => {
        e.preventDefault();
        const { name, email, password } = signupInfo;
        if (!name || !email || !password) return handleError('All fields are required');
        setLoading(true);
        try {
            const url = `${import.meta.env.VITE_API_URL}/auth/signup`;
            const response = await fetch(url, {
                method: "POST",
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(signupInfo)
            });
            const result = await response.json();
            const { success, message, error } = result;
            if (success) {
                handleSuccess(message);
                setTimeout(() => navigate('/login'), 1000)
            } else if (error) {
                handleError(error?.details[0].message);
            } else {
                handleError(message);
            }
        } catch (err) {
            handleError(err.message || 'Signup failed');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className='auth-page' ref={containerRef}>
            <div className='auth-container' style={{ visibility: 'hidden' }}>
                <div className="brand">
                    <h1>ContentAI</h1>
                    <p>Multi-Agent Content Platform</p>
                </div>
                <h2>Create Account</h2>
                <form onSubmit={handleSignup}>
                    <div className="form-group">
                        <label htmlFor='name'>Full Name</label>
                        <input onChange={handleChange} type='text' name='name' id='name' autoFocus
                            placeholder='Enter your full name...' value={signupInfo.name} />
                    </div>
                    <div className="form-group">
                        <label htmlFor='email'>Email</label>
                        <input onChange={handleChange} type='email' name='email' id='email'
                            placeholder='Enter your email...' value={signupInfo.email} />
                    </div>
                    <div className="form-group">
                        <label htmlFor='password'>Password</label>
                        <input onChange={handleChange} type='password' name='password' id='password'
                            placeholder='Enter your password...' value={signupInfo.password} />
                    </div>
                    <button className="btn btn-primary btn-lg" type='submit' disabled={loading} style={{ width: '100%', marginTop: '8px' }}>
                        {loading ? <span className="spinner" style={{ width: 18, height: 18 }}></span> : null}
                        {loading ? 'Creating account...' : 'Create Account'}
                    </button>
                    <div className="auth-link">
                        Already have an account? <Link to="/login">Sign In</Link>
                    </div>
                </form>
            </div>
            <ToastContainer />
        </div>
    )
}

export default Signup
