import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData]   = useState({ email: '', password: '' });
  const [error,    setError]      = useState('');
  const [loading,  setLoading]    = useState(false);
  const [showPass, setShowPass]   = useState(false);
  const [otpMode,  setOtpMode]    = useState(false);
  const [otpSent,  setOtpSent]    = useState(false);
  const [otpCode,  setOtpCode]    = useState('');
  const [otpLoading, setOtpLoading] = useState(false);

  const isExpired = new URLSearchParams(location.search).get('expired');

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSendOTP = async () => {
    if (!formData.email) { setError('Please enter your email address first.'); return; }
    setError(''); setOtpLoading(true);
    try {
      const { sendOTP } = await import('../services/extensions');
      const res = await sendOTP(formData.email);
      setOtpSent(true);
      setError(`🔐 Your mock OTP is: ${res.mock_otp}`);
    } catch { setError('Failed to send OTP. Please try again.'); }
    finally { setOtpLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      let user;
      if (otpMode) {
        if (otpCode !== '123456') { setError('Invalid OTP. Please enter: 123456'); setLoading(false); return; }
        const pw = formData.email.includes('admin') ? 'admin123' : 'password123';
        user = await login(formData.email, pw);
      } else {
        user = await login(formData.email, formData.password);
      }
      if (user.role === 'student') navigate('/student/dashboard');
      else if (user.role === 'hr')  navigate('/hr/dashboard');
      else if (user.role === 'admin') navigate('/admin/dashboard');
      else navigate('/');
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid credentials. Please try again.');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-dark-950 flex overflow-hidden">

      {/* ── Left Panel: Brand Visual ──────────────────────── */}
      <div className="hidden lg:flex flex-col justify-between w-[45%] relative overflow-hidden p-12"
           style={{background:'linear-gradient(135deg, #080C15 0%, #0E1525 40%, #14163A 100%)'}}>

        {/* Orbs */}
        <div className="absolute top-1/4 right-0 w-[400px] h-[400px] rounded-full bg-primary-600/20 blur-[100px] pointer-events-none" />
        <div className="absolute bottom-1/4 left-0 w-[300px] h-[300px] rounded-full bg-accent-violet/15 blur-[80px] pointer-events-none" />
        <div className="absolute inset-0 dot-pattern opacity-40 pointer-events-none" />

        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 relative z-10 group w-fit">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-violet flex items-center justify-center text-white text-sm font-black shadow-lg shadow-primary-600/40 group-hover:scale-105 transition-transform duration-200">
            AI
          </div>
          <span className="text-2xl font-black text-white">MOCK <span className="text-gradient">AURA</span></span>
        </Link>

        {/* Hero content */}
        <div className="relative z-10 space-y-10">
          <div>
            <h2 className="text-4xl font-black text-white leading-tight mb-4">
              Your career acceleration<br />
              <span className="text-gradient">starts here.</span>
            </h2>
            <p className="text-slate-400 text-base leading-relaxed">
              Connect with verified HR professionals, practice AI-powered mock interviews, and unlock your full potential.
            </p>
          </div>

          {/* Feature chips */}
          <div className="space-y-3">
            {[
              { icon:'🤖', text:'AI-powered interview coaching' },
              { icon:'📄', text:'Smart resume analysis & ATS scoring' },
              { icon:'👥', text:'180+ verified industry mentors' },
              { icon:'🏆', text:'96% student placement rate' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 glass px-4 py-3 rounded-xl w-fit">
                <span className="text-lg">{item.icon}</span>
                <span className="text-slate-200 text-sm font-medium">{item.text}</span>
              </div>
            ))}
          </div>

          {/* Testimonial */}
          <div className="glass rounded-2xl p-5 border border-primary-500/15">
            <p className="text-slate-300 text-sm italic leading-relaxed">
              "Mock Aura's AI analysis helped me identify exactly what was missing. I got placed within 2 weeks."
            </p>
            <div className="flex items-center gap-2.5 mt-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-accent-violet flex items-center justify-center text-white text-xs font-bold">R</div>
              <div>
                <p className="text-white text-xs font-bold">Rohan K.</p>
                <p className="text-slate-500 text-[10px]">Placed at TCS Digital</p>
              </div>
              <div className="ml-auto flex gap-0.5">
                {[1,2,3,4,5].map(s => <span key={s} className="text-accent-amber text-xs">★</span>)}
              </div>
            </div>
          </div>
        </div>

        <p className="text-slate-600 text-xs relative z-10">© {new Date().getFullYear()} Mock Aura. All rights reserved.</p>
      </div>

      {/* ── Right Panel: Login Form ───────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 relative">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-primary-600/5 blur-[80px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-accent-violet/5 blur-[80px] pointer-events-none" />

        <div className="w-full max-w-md relative z-10">
          {/* Mobile logo */}
          <Link to="/" className="flex lg:hidden items-center gap-2 mb-8 justify-center">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-accent-violet flex items-center justify-center text-white text-xs font-black">AI</div>
            <span className="text-xl font-black text-white">MOCK <span className="text-gradient">AURA</span></span>
          </Link>

          <div className="mb-8">
            <h1 className="text-3xl font-black text-white">Welcome back</h1>
            <p className="text-slate-400 mt-2">Sign in to continue your journey with Mock Aura.</p>
          </div>

          {/* Expired session alert */}
          {isExpired && (
            <div className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/20 text-amber-300 p-4 rounded-2xl text-sm mb-6">
              <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Your session has expired. Please sign in again.
            </div>
          )}

          {/* Error / Info alert */}
          {error && (
            <div className={`flex items-center gap-3 p-4 rounded-2xl text-sm mb-6 border ${
              error.startsWith('🔐')
                ? 'bg-accent-emerald/10 border-accent-emerald/20 text-accent-emerald'
                : 'bg-red-500/10 border-red-500/20 text-red-300'
            }`}>
              <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-slate-300 text-sm font-semibold mb-2">Email Address</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                </div>
                <input
                  type="email" name="email" required
                  placeholder="you@domain.com"
                  value={formData.email} onChange={handleChange}
                  className="input-premium pl-11"
                />
              </div>
            </div>

            {/* Password / OTP */}
            {!otpMode ? (
              <div>
                <label className="block text-slate-300 text-sm font-semibold mb-2">Password</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input
                    type={showPass ? 'text' : 'password'} name="password" required
                    placeholder="••••••••"
                    value={formData.password} onChange={handleChange}
                    className="input-premium pl-11 pr-11"
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                    {showPass
                      ? <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                      : <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    }
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-slate-300 text-sm font-semibold">OTP Code</label>
                  <button type="button" onClick={handleSendOTP} disabled={otpLoading}
                    className="text-xs text-primary-400 hover:text-primary-300 font-bold transition-colors disabled:opacity-50">
                    {otpLoading ? 'Sending...' : otpSent ? 'Resend OTP' : 'Send OTP Code'}
                  </button>
                </div>
                <input
                  type="text" maxLength={6} required
                  placeholder="Enter 6-digit OTP"
                  value={otpCode} onChange={(e) => setOtpCode(e.target.value)}
                  disabled={!otpSent}
                  className="input-premium text-center tracking-[0.5em] text-lg disabled:opacity-40"
                />
              </div>
            )}

            {/* OTP toggle */}
            <div className="flex items-center justify-between">
              <button type="button" onClick={() => { setError(''); setOtpMode(!otpMode); }}
                className="text-xs text-primary-400 hover:text-primary-300 font-semibold transition-colors">
                {otpMode ? '← Use Password Instead' : 'Sign in with OTP →'}
              </button>
            </div>

            {/* Submit */}
            <button type="submit" disabled={loading} className="btn-primary w-full py-4 text-base">
              {loading ? (
                <div className="h-5 w-5 border-2 border-t-transparent border-white rounded-full animate-spin" />
              ) : (
                <>{otpMode ? 'Verify & Sign In' : 'Sign In'}
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary-400 hover:text-primary-300 font-semibold transition-colors">
              Create one free →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
