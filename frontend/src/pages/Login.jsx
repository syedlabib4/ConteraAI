import React, { useState, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ToastContainer } from 'react-toastify';
import { handleError, handleSuccess } from '../utils';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(useGSAP);

function Login() {
    const [loginInfo, setLoginInfo] = useState({ email: '', password: '' })
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
                { y: 20, autoAlpha: 0 },
                { y: 0, autoAlpha: 1, duration: 0.4, stagger: 0.12 }, '-=0.1')
            .fromTo(ctx.querySelector('.btn-primary'),
                { scale: 0.92, autoAlpha: 0 },
                { scale: 1, autoAlpha: 1, duration: 0.4, ease: 'back.out(1.7)' }, '-=0.1')
            .fromTo(ctx.querySelector('.auth-link'),
                { autoAlpha: 0 },
                { autoAlpha: 1, duration: 0.3 }, '-=0.1');
    }, { scope: containerRef });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setLoginInfo(prev => ({ ...prev, [name]: value }));
    }

    const handleLogin = async (e) => {
        e.preventDefault();
        const { email, password } = loginInfo;
        if (!email || !password) return handleError('Email and password are required');
        setLoading(true);
        try {
            const url = `${import.meta.env.VITE_API_URL}/auth/login`;
            const response = await fetch(url, {
                method: "POST",
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(loginInfo)
            });
            const result = await response.json();
            const { success, message, jwtToken, name, error } = result;
            if (success) {
                handleSuccess(message);
                localStorage.setItem('token', jwtToken);
                localStorage.setItem('loggedInUser', name);
                setTimeout(() => navigate('/dashboard'), 1000)
            } else if (error) {
                handleError(error?.details[0].message);
            } else {
                handleError(message);
            }
        } catch (err) {
            handleError(err.message || 'Login failed');
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
                <h2>Welcome Back</h2>
                <form onSubmit={handleLogin}>
                    <div className="form-group">
                        <label htmlFor='email'>Email</label>
                        <input onChange={handleChange} type='email' name='email' id='email'
                            placeholder='Enter your email...' value={loginInfo.email} />
                    </div>
                    <div className="form-group">
                        <label htmlFor='password'>Password</label>
                        <input onChange={handleChange} type='password' name='password' id='password'
                            placeholder='Enter your password...' value={loginInfo.password} />
                    </div>
                    <button className="btn btn-primary btn-lg" type='submit' disabled={loading} style={{ width: '100%', marginTop: '8px' }}>
                        {loading ? <span className="spinner" style={{ width: 18, height: 18 }}></span> : null}
                        {loading ? 'Signing in...' : 'Sign In'}
                    </button>
                    <div className="auth-link">
                        Don't have an account? <Link to="/signup">Sign Up</Link>
                    </div>
                </form>
            </div>
            <ToastContainer />
        </div>
    )
}

export default Login
