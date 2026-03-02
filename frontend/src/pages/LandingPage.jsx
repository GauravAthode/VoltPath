import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Route, MapPin, Activity, Eye, EyeOff, ArrowRight, Loader } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { login, register, googleSession } from '../services/authService';
import toast from 'react-hot-toast';
import { API_BASE } from '../config/constants';

const features = [
  { icon: Route, label: 'Smart Route Planning', desc: 'Optimal routes with charging stop optimization' },
  { icon: MapPin, label: 'Real Charging Stations', desc: 'Live data from Open Charge Map network' },
  { icon: Activity, label: 'Energy Simulations', desc: 'Weather, traffic & battery degradation analysis' },
];

const LandingPage = () => {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const { loginWithToken } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      let res;
      if (mode === 'login') {
        res = await login({ email: form.email, password: form.password });
      } else {
        res = await register({ name: form.name, email: form.email, password: form.password });
      }
      const { token, user } = res.data.data;
      loginWithToken(token, user);
      toast.success(mode === 'login' ? 'Welcome back!' : 'Account created!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    // Use proper Google OAuth through our backend
    window.location.href = `${API_BASE}/auth/google`;
  };

  return (
    <div className="min-h-screen dark:bg-dark-bg bg-light-bg flex overflow-hidden">
      {/* Left - Hero */}
      <div className="hidden lg:flex flex-1 flex-col justify-between p-12 relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 pointer-events-none" />
        <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-secondary/10 rounded-full blur-3xl pointer-events-none" />

        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-volt flex items-center justify-center">
            <Zap className="w-5 h-5 text-dark-bg" />
          </div>
          <span className="font-display text-2xl font-bold dark:text-dark-text text-light-text">VoltPath</span>
        </motion.div>

        {/* Main content */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-8"
        >
          <div>
            <p className="text-xs font-bold tracking-[0.2em] uppercase text-primary mb-3">The OS for the Electric Era</p>
            <h1 className="text-5xl xl:text-6xl font-black dark:text-dark-text text-light-text leading-tight tracking-tight">
              Intelligent EV<br />
              <span className="text-gradient-volt">Route Planning</span>
            </h1>
            <p className="text-lg dark:text-dark-muted text-light-muted mt-4 max-w-md">
              Eliminate range anxiety. Optimize charging stops. Simulate real-world energy conditions for your perfect journey.
            </p>
          </div>

          <div className="space-y-4">
            {features.map((f, i) => (
              <motion.div
                key={f.label}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.1 }}
                className="flex items-start gap-4 p-4 dark:bg-dark-surface/50 bg-white/70 rounded-xl border dark:border-dark-border/50 border-light-border/50 backdrop-blur-sm"
              >
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <f.icon className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="font-semibold dark:text-dark-text text-light-text text-sm">{f.label}</p>
                  <p className="text-xs dark:text-dark-muted text-light-muted mt-0.5">{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-xs dark:text-dark-muted text-light-muted"
        >
          © 2024 VoltPath. Powered by Open Charge Map, OpenWeatherMap & TomTom.
        </motion.p>
      </div>

      {/* Right - Auth Form */}
      <motion.div
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full lg:w-[480px] flex-shrink-0 flex items-center justify-center p-8 dark:bg-dark-surface bg-white border-l dark:border-dark-border border-light-border"
      >
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-lg bg-gradient-volt flex items-center justify-center">
              <Zap className="w-4 h-4 text-dark-bg" />
            </div>
            <span className="font-display text-xl font-bold dark:text-dark-text text-light-text">VoltPath</span>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold dark:text-dark-text text-light-text">
              {mode === 'login' ? 'Welcome back' : 'Create account'}
            </h2>
            <p className="text-sm dark:text-dark-muted text-light-muted mt-1">
              {mode === 'login' ? 'Sign in to your VoltPath account' : 'Start planning smarter EV journeys'}
            </p>
          </div>

          {/* Google Login */}
          <button
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border dark:border-dark-border border-light-border dark:hover:bg-dark-highlight hover:bg-light-highlight transition-all duration-200 mb-4"
            data-testid="google-login-btn"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span className="text-sm font-medium dark:text-dark-text text-light-text">Continue with Google</span>
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px dark:bg-dark-border bg-light-border"></div>
            <span className="text-xs dark:text-dark-muted text-light-muted">or</span>
            <div className="flex-1 h-px dark:bg-dark-border bg-light-border"></div>
          </div>

          {/* Email/Password Form */}
          <form onSubmit={handleSubmit} className="space-y-4" data-testid="auth-form">
            <AnimatePresence>
              {mode === 'register' && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                  <label className="block text-sm font-medium dark:text-dark-muted text-light-muted mb-1.5">Full Name</label>
                  <input
                    type="text" name="name" value={form.name} onChange={handleChange} required={mode === 'register'}
                    placeholder="John Doe"
                    className="w-full px-4 py-3 rounded-xl border dark:border-dark-border border-light-border dark:bg-dark-highlight bg-light-highlight dark:text-dark-text text-light-text text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all"
                    data-testid="register-name-input"
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <div>
              <label className="block text-sm font-medium dark:text-dark-muted text-light-muted mb-1.5">Email</label>
              <input
                type="email" name="email" value={form.email} onChange={handleChange} required
                placeholder="you@example.com"
                className="w-full px-4 py-3 rounded-xl border dark:border-dark-border border-light-border dark:bg-dark-highlight bg-light-highlight dark:text-dark-text text-light-text text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all"
                data-testid="email-input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium dark:text-dark-muted text-light-muted mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'} name="password" value={form.password} onChange={handleChange} required
                  placeholder="••••••••"
                  className="w-full px-4 py-3 pr-11 rounded-xl border dark:border-dark-border border-light-border dark:bg-dark-highlight bg-light-highlight dark:text-dark-text text-light-text text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all"
                  data-testid="password-input"
                />
                <button
                  type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 dark:text-dark-muted text-light-muted hover:text-primary transition-colors"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <motion.button
              type="submit" disabled={loading}
              whileHover={{ scale: loading ? 1 : 1.01 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
              className="w-full py-3 rounded-xl volt-btn flex items-center justify-center gap-2 font-semibold text-sm disabled:opacity-60 disabled:cursor-not-allowed"
              data-testid="auth-submit-btn"
            >
              {loading ? (
                <motion.div className="w-5 h-5 border-2 border-dark-bg/30 border-t-dark-bg rounded-full animate-spin" />
              ) : (
                <>
                  {mode === 'login' ? 'Sign In' : 'Create Account'}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </motion.button>
          </form>

          <p className="text-center text-sm dark:text-dark-muted text-light-muted mt-5">
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button
              onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
              className="text-primary hover:underline font-medium"
              data-testid="auth-mode-toggle"
            >
              {mode === 'login' ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default LandingPage;
