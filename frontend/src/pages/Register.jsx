import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Register = () => {
  const { registerAsStudent, registerAsHR } = useAuth();
  const navigate = useNavigate();

  const [role,     setRole]     = useState(null);
  const [step,     setStep]     = useState(1); // 1 = role select, 2 = form
  const [formData, setFormData] = useState({ full_name:'', email:'', phone_number:'', password:'' });
  const [showPass, setShowPass] = useState(false);
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  const handleChange = (e) => setFormData({...formData, [e.target.name]: e.target.value});

  const selectRole = (r) => { setRole(r); setStep(2); };

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      if (role === 'student') { await registerAsStudent(formData); navigate('/student/onboarding'); }
      else                    { await registerAsHR(formData);      navigate('/hr/onboarding');      }
    } catch (err) {
      setError(err.response?.data?.email?.[0] || err.response?.data?.detail || 'Registration failed. Please try again.');
    } finally { setLoading(false); }
  };

  const roleGrad = role === 'student'
    ? 'from-primary-500 to-accent-violet'
    : 'from-accent-violet to-accent-coral';

  return (
    <div className="min-h-screen bg-dark-950 flex overflow-hidden">

      {/* ── Left panel ───────────────────────────────────── */}
      <div className="hidden lg:flex flex-col justify-between w-[45%] relative overflow-hidden p-12"
           style={{background:'linear-gradient(135deg, #080C15 0%, #0E1525 40%, #14163A 100%)'}}>
        <div className="absolute top-1/3 right-0 w-[400px] h-[400px] rounded-full bg-accent-violet/15 blur-[100px] pointer-events-none" />
        <div className="absolute bottom-1/4 left-0 w-[300px] h-[300px] rounded-full bg-primary-600/15 blur-[80px] pointer-events-none" />
        <div className="absolute inset-0 dot-pattern opacity-40 pointer-events-none" />

        <Link to="/" className="flex items-center gap-3 relative z-10 group w-fit">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-violet flex items-center justify-center text-white text-sm font-black shadow-lg group-hover:scale-105 transition-transform duration-200">AI</div>
          <span className="text-2xl font-black text-white">MOCK <span className="text-gradient">AURA</span></span>
        </Link>

        <div className="relative z-10 space-y-10">
          <div>
            <h2 className="text-4xl font-black text-white leading-tight mb-4">
              Join thousands already<br /><span className="text-gradient">succeeding</span> with us.
            </h2>
            <p className="text-slate-400 text-base leading-relaxed">
              Choose your path and get started in under 2 minutes. No credit card required.
            </p>
          </div>

          {/* Path cards */}
          <div className="space-y-4">
            {[
              {
                role:  'Student',
                icon:  '🎓',
                color: 'from-primary-500/20 to-primary-600/10 border-primary-500/20',
                items: ['AI mock interviews', 'Resume analysis', 'Career roadmaps'],
              },
              {
                role:  'HR Professional',
                icon:  '💼',
                color: 'from-accent-violet/20 to-purple-600/10 border-accent-violet/20',
                items: ['Flexible scheduling', 'Wallet earnings', 'Verified badge'],
              },
            ].map(card => (
              <div key={card.role} className={`glass rounded-2xl p-4 border bg-gradient-to-r ${card.color}`}>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-xl">{card.icon}</span>
                  <span className="text-white font-bold text-sm">{card.role}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {card.items.map(item => (
                    <span key={item} className="text-[10px] text-slate-400 bg-white/5 border border-white/8 px-2 py-0.5 rounded-lg">{item}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-slate-600 text-xs relative z-10">© {new Date().getFullYear()} Mock Aura. All rights reserved.</p>
      </div>

      {/* ── Right panel ──────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 relative">
        <div className="absolute top-1/4 left-1/4 w-80 h-80 rounded-full bg-primary-600/5 blur-[80px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-accent-violet/5 blur-[80px] pointer-events-none" />

        <div className="w-full max-w-md relative z-10">
          {/* Mobile logo */}
          <Link to="/" className="flex lg:hidden items-center gap-2 mb-8 justify-center">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-accent-violet flex items-center justify-center text-white text-xs font-black">AI</div>
            <span className="text-xl font-black text-white">MOCK <span className="text-gradient">AURA</span></span>
          </Link>

          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-8">
            {[1,2].map(s => (
              <div key={s} className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${s <= step ? 'bg-primary-500' : 'bg-white/8'}`} />
            ))}
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 text-red-300 p-4 rounded-2xl text-sm mb-6">
              <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          )}

          {/* ── STEP 1: Role selection ──────────────────── */}
          {step === 1 ? (
            <div className="animate-fade-in-up">
              <div className="mb-8">
                <h1 className="text-3xl font-black text-white">Create your account</h1>
                <p className="text-slate-400 mt-2">First, tell us who you are.</p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {/* Student */}
                <button onClick={() => selectRole('student')}
                  className="group gradient-border p-6 text-left card-hover focus:outline-none focus:ring-2 focus:ring-primary-500/50 rounded-[20px]">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-600 to-primary-400 flex items-center justify-center text-2xl shadow-lg shadow-primary-500/30 flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                      🎓
                    </div>
                    <div className="flex-1">
                      <h3 className="text-white font-bold text-lg">Student</h3>
                      <p className="text-slate-400 text-sm mt-1 leading-relaxed">
                        Prepare for interviews, get AI resume analysis, and track your placement progress.
                      </p>
                      <div className="flex flex-wrap gap-2 mt-3">
                        {['Mock Interviews','Resume Review','AI Coach'].map(tag => (
                          <span key={tag} className="badge-primary">{tag}</span>
                        ))}
                      </div>
                    </div>
                    <svg className="w-5 h-5 text-slate-600 group-hover:text-primary-400 group-hover:translate-x-1 transition-all duration-300 flex-shrink-0 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>

                {/* HR */}
                <button onClick={() => selectRole('hr')}
                  className="group gradient-border p-6 text-left card-hover focus:outline-none focus:ring-2 focus:ring-accent-violet/50 rounded-[20px]"
                  style={{background:'rgba(20,14,40,0.7)'}}>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-accent-violet to-purple-700 flex items-center justify-center text-2xl shadow-lg shadow-accent-violet/30 flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                      💼
                    </div>
                    <div className="flex-1">
                      <h3 className="text-white font-bold text-lg">HR Professional</h3>
                      <p className="text-slate-400 text-sm mt-1 leading-relaxed">
                        Conduct interviews, earn side income, and build your professional brand.
                      </p>
                      <div className="flex flex-wrap gap-2 mt-3">
                        {['Earn Rewards','Flexible Hours','Verified Badge'].map(tag => (
                          <span key={tag} className="badge-violet">{tag}</span>
                        ))}
                      </div>
                    </div>
                    <svg className="w-5 h-5 text-slate-600 group-hover:text-accent-violet group-hover:translate-x-1 transition-all duration-300 flex-shrink-0 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>
              </div>

              <p className="text-center text-sm text-slate-500 mt-6">
                Already have an account?{' '}
                <Link to="/login" className="text-primary-400 hover:text-primary-300 font-semibold transition-colors">Sign In →</Link>
              </p>
            </div>

          ) : (
            /* ── STEP 2: Registration Form ──────────────── */
            <div className="animate-fade-in-up">
              <div className="flex items-center gap-4 mb-8">
                <button onClick={() => { setStep(1); setRole(null); setError(''); }}
                  className="w-9 h-9 rounded-xl border border-white/10 bg-white/4 flex items-center justify-center text-slate-400 hover:text-white hover:border-white/20 transition-all duration-200">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <div>
                  <h1 className="text-2xl font-black text-white">
                    Register as <span className={`bg-gradient-to-r ${roleGrad} bg-clip-text text-transparent capitalize`}>{role}</span>
                  </h1>
                  <p className="text-slate-400 text-sm">Fill in your details to get started.</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Full Name */}
                <div>
                  <label className="block text-slate-300 text-sm font-semibold mb-2">Full Name</label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <input type="text" name="full_name" required placeholder="John Doe"
                           value={formData.full_name} onChange={handleChange} className="input-premium pl-11" />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-slate-300 text-sm font-semibold mb-2">Email Address</label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                      </svg>
                    </div>
                    <input type="email" name="email" required placeholder="you@domain.com"
                           value={formData.email} onChange={handleChange} className="input-premium pl-11" />
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-slate-300 text-sm font-semibold mb-2">Phone Number</label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </div>
                    <input type="tel" name="phone_number" required placeholder="+91 9876543210"
                           value={formData.phone_number} onChange={handleChange} className="input-premium pl-11" />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-slate-300 text-sm font-semibold mb-2">Password</label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <input type={showPass ? 'text' : 'password'} name="password" required placeholder="Min. 8 characters"
                           value={formData.password} onChange={handleChange} className="input-premium pl-11 pr-11" />
                    <button type="button" onClick={() => setShowPass(!showPass)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                      {showPass
                        ? <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                        : <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                      }
                    </button>
                  </div>
                </div>

                <button type="submit" disabled={loading} className="btn-primary w-full py-4 text-base mt-2">
                  {loading
                    ? <div className="h-5 w-5 border-2 border-t-transparent border-white rounded-full animate-spin" />
                    : <>Create Account <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg></>
                  }
                </button>

                <p className="text-xs text-slate-500 text-center">
                  By registering you agree to our{' '}
                  <span className="text-primary-400">Terms of Service</span> &{' '}
                  <span className="text-primary-400">Privacy Policy</span>.
                </p>
              </form>

              <p className="text-center text-sm text-slate-500 mt-4">
                Already have an account?{' '}
                <Link to="/login" className="text-primary-400 hover:text-primary-300 font-semibold transition-colors">Sign In →</Link>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Register;
