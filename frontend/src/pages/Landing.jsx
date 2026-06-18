import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { submitContact } from '../services/admin';

/* ─── Animated counter hook ─────────────────────────────── */
function useCountUp(target, duration = 1800, start = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime = null;
    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      setCount(Math.floor(ease * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration, start]);
  return count;
}

/* ─── Intersection Observer hook ─────────────────────────── */
function useInView(threshold = 0.2) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setInView(true); obs.disconnect(); } }, { threshold });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, inView];
}

/* ─── Stats counter component ─────────────────────────────── */
const StatCounter = ({ value, suffix, label, color = 'text-white' }) => {
  const [ref, inView] = useInView(0.4);
  const count = useCountUp(value, 1800, inView);
  return (
    <div ref={ref} className="text-center">
      <div className={`text-4xl sm:text-5xl font-black ${color} tabular-nums`}>
        {count.toLocaleString()}{suffix}
      </div>
      <div className="text-slate-400 text-sm mt-1 font-medium">{label}</div>
    </div>
  );
};

/* ─── Feature icon ─────────────────────────────────────────── */
const FeatureIcon = ({ children, gradient }) => (
  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg mb-4 flex-shrink-0`}>
    {children}
  </div>
);

const Landing = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [activeFaq, setActiveFaq]       = useState(null);
  const [contactForm, setContactForm]   = useState({ name: '', email: '', subject: '', message: '' });
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [formError, setFormError]       = useState('');
  const [formLoading, setFormLoading]   = useState(false);

  const handleBookInterview = () => {
    if (!isAuthenticated) { navigate('/login'); return; }
    if (user?.role === 'student') { navigate('/hrs'); return; }
    navigate('/register');
  };

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormLoading(true);
    try {
      await submitContact(contactForm);
      setFormSubmitted(true);
      setContactForm({ name: '', email: '', subject: '', message: '' });
      setTimeout(() => setFormSubmitted(false), 6000);
    } catch (err) {
      setFormError(err?.response?.data?.detail || 'Failed to send message. Please try again.');
    } finally {
      setFormLoading(false);
    }
  };

  const faqs = [
    { q: "What is Mock Aura?",               a: "Mock Aura is a premium AI-powered mock interview platform where students connect 1-on-1 with verified HR professionals and industry experts to practice interviews, get resume reviews, and receive personalized career guidance." },
    { q: "Is this a job portal?",            a: "No — Mock Aura focuses entirely on interview preparation and career development. We help you master the skills needed to land your dream job but do not list vacancies directly." },
    { q: "How does HR verification work?",   a: "Every HR professional must submit official credentials (Resume, Employee ID, Experience Letter). Our admin team reviews and validates each profile manually before granting a verified badge." },
    { q: "How does AI assessment work?",     a: "Mock Aura uses Google Gemini AI to analyze your resume, generate interview questions matched to your skill profile, evaluate your answers, and produce a detailed performance report with a gap analysis." },
    { q: "How does payment work?",           a: "Payments are processed securely via Razorpay. Once payment is confirmed, your booking is instantly confirmed and a meeting link is generated automatically." },
  ];

  const features = [
    {
      icon: (
        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2h-2" />
        </svg>
      ),
      title:  "AI-Powered Mock Interviews",
      desc:   "Gemini AI generates domain-specific interview questions matched to your skills and experience level.",
      gradient: "from-primary-600 to-primary-400",
      glow:     "shadow-primary-500/30",
    },
    {
      icon: (
        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      title:  "Smart Resume Analysis",
      desc:   "Deep AI analysis of your resume with ATS compatibility scoring, strengths, gaps and targeted improvements.",
      gradient: "from-accent-violet to-purple-600",
      glow:     "shadow-accent-violet/30",
    },
    {
      icon: (
        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      ),
      title:  "Skill Gap Analysis",
      desc:   "AI maps your current skills against target roles and creates a personalized upskilling roadmap.",
      gradient: "from-accent-emerald to-teal-600",
      glow:     "shadow-accent-emerald/30",
    },
    {
      icon: (
        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
        </svg>
      ),
      title:  "Verified HR Network",
      desc:   "Every mentor is manually verified with ID and credentials — guaranteed quality across every session.",
      gradient: "from-accent-amber to-orange-500",
      glow:     "shadow-accent-amber/30",
    },
    {
      icon: (
        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
      title:  "AI Career Coach",
      desc:   "Chat with your personalized AI coach for career strategy, interview prep tips, and growth planning.",
      gradient: "from-accent-coral to-pink-600",
      glow:     "shadow-accent-coral/30",
    },
    {
      icon: (
        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      ),
      title:  "Integrated Wallet",
      desc:   "Deposit funds and book sessions instantly. HRs receive earnings directly — fast and transparent.",
      gradient: "from-accent-cyan to-blue-500",
      glow:     "shadow-accent-cyan/30",
    },
  ];

  const mentors = [
    { name: "Sneha Reddy",    role: "Sr. HR Business Partner",   company: "Google",    yoe: "8+", tag: "Tech Interviews",     grad: "from-primary-500 to-accent-violet" },
    { name: "Amit Sharma",    role: "Talent Acquisition Lead",   company: "Microsoft", yoe: "10+",tag: "Resume Strategy",     grad: "from-accent-violet to-accent-coral" },
    { name: "Sophia Miller",  role: "Technical Recruiter",       company: "Amazon",    yoe: "6+", tag: "Behavioral Prep",     grad: "from-accent-emerald to-accent-cyan" },
    { name: "Ravi Kapoor",    role: "Engineering Manager",       company: "Meta",      yoe: "12+",tag: "System Design",       grad: "from-accent-amber to-orange-500" },
    { name: "Priya Menon",    role: "Senior Technical Recruiter",company: "Netflix",   yoe: "7+", tag: "Frontend Interviews",  grad: "from-accent-coral to-pink-500" },
    { name: "David Chen",     role: "Staff Engineer",            company: "Apple",     yoe: "15+",tag: "Architecture Review", grad: "from-accent-cyan to-primary-500" },
  ];

  return (
    <div className="pt-16 overflow-x-hidden">

      {/* ══════════════════════════════════════════════════════
          1. HERO SECTION
      ══════════════════════════════════════════════════════ */}
      <section className="relative hero-gradient min-h-[95vh] flex items-center justify-center py-24 px-4 overflow-hidden">
        {/* Grid pattern */}
        <div className="absolute inset-0 grid-pattern opacity-60 pointer-events-none" />

        {/* Floating orbs */}
        <div className="absolute top-1/4 left-1/6 w-[500px] h-[500px] orb-primary animate-float-slow opacity-20" />
        <div className="absolute bottom-1/4 right-1/6 w-[400px] h-[400px] orb-violet animate-float opacity-15" style={{animationDelay:'2s'}} />
        <div className="absolute top-3/4 left-1/2 w-[300px] h-[300px] orb-emerald animate-float-slow opacity-10" style={{animationDelay:'1s'}} />

        <div className="relative z-10 max-w-5xl mx-auto text-center space-y-8">
          {/* Live badge */}
          <div className="animate-fade-in-up" style={{animationDelay:'0ms'}}>
            <span className="inline-flex items-center gap-2.5 bg-primary-500/10 border border-primary-500/25 backdrop-blur-sm
                             px-5 py-2 rounded-full text-sm font-semibold text-primary-300">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-emerald opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-accent-emerald" />
              </span>
              AI-Powered Platform — Now Live
            </span>
          </div>

          {/* Hero heading */}
          <div className="animate-fade-in-up" style={{animationDelay:'100ms'}}>
            <h1 className="text-5xl sm:text-7xl font-black tracking-tight leading-[1.05] text-white text-balance">
              Bridge the Gap Between<br />
              <span className="text-gradient">Academics</span> &{' '}
              <span className="text-gradient">Industry</span>
            </h1>
          </div>

          {/* Subheading */}
          <div className="animate-fade-in-up" style={{animationDelay:'200ms'}}>
            <p className="text-xl sm:text-2xl text-slate-400 max-w-3xl mx-auto font-light leading-relaxed text-balance">
              Connect 1-on-1 with verified HR professionals. Practice mock interviews, get
              AI-powered resume analysis, and unlock your career potential.
            </p>
          </div>

          {/* CTAs */}
          <div className="animate-fade-in-up flex flex-col sm:flex-row items-center justify-center gap-4 pt-2" style={{animationDelay:'300ms'}}>
            <button onClick={handleBookInterview} className="w-full sm:w-auto btn-gradient px-9 py-4 rounded-2xl text-base font-black
                                            shadow-2xl shadow-primary-600/40 transition-all duration-300
                                            hover:-translate-y-1 hover:shadow-primary-500/50 text-center">
              Book a Mock Interview
              <svg className="inline ml-2 w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </button>
            <Link to="/login" className="w-full sm:w-auto btn-ghost px-9 py-4 rounded-2xl text-base font-bold text-center">
              Sign In
            </Link>
          </div>

          {/* Social proof */}
          <div className="animate-fade-in-up flex flex-wrap items-center justify-center gap-6 pt-2" style={{animationDelay:'400ms'}}>
            {[
              { text: "Free to join",      icon: '✓' },
              { text: "Verified mentors",  icon: '✓' },
              { text: "AI-powered tools",  icon: '✓' },
            ].map(item => (
              <span key={item.text} className="flex items-center gap-1.5 text-slate-400 text-sm">
                <span className="text-accent-emerald font-bold">{item.icon}</span>
                {item.text}
              </span>
            ))}
          </div>

          {/* Floating device card mockup */}
          <div className="animate-fade-in-up pt-8" style={{animationDelay:'500ms'}}>
            <div className="relative mx-auto max-w-2xl">
              <div className="gradient-border p-px rounded-3xl shadow-2xl shadow-black/50">
                <div className="glass rounded-3xl p-6 text-left">
                  {/* Mock UI */}
                  <div className="flex items-center gap-3 mb-4 pb-4 border-b border-white/5">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-violet flex items-center justify-center text-white text-xs font-bold">AI</div>
                    <div>
                      <div className="text-white text-sm font-bold">AI Interview Coach</div>
                      <div className="text-accent-emerald text-xs flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-accent-emerald inline-block" /> Online
                      </div>
                    </div>
                    <div className="ml-auto badge-emerald">Live Session</div>
                  </div>
                  <div className="space-y-3">
                    <div className="bg-primary-500/10 border border-primary-500/15 rounded-2xl rounded-tl-sm p-4 text-sm text-slate-300 max-w-xs">
                      "Tell me about your experience with REST APIs and how you've handled rate limiting in production."
                    </div>
                    <div className="bg-dark-700/60 rounded-2xl rounded-tr-sm p-4 text-sm text-slate-300 max-w-xs ml-auto text-right">
                      Typing a response...
                      <span className="inline-flex gap-0.5 ml-2">
                        <span className="w-1 h-1 rounded-full bg-slate-400 animate-bounce" style={{animationDelay:'0ms'}} />
                        <span className="w-1 h-1 rounded-full bg-slate-400 animate-bounce" style={{animationDelay:'150ms'}} />
                        <span className="w-1 h-1 rounded-full bg-slate-400 animate-bounce" style={{animationDelay:'300ms'}} />
                      </span>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-3">
                    {[
                      { label: 'Confidence', val: 84, color: 'bg-primary-500' },
                      { label: 'Clarity',    val: 91, color: 'bg-accent-emerald' },
                      { label: 'Depth',      val: 76, color: 'bg-accent-violet' },
                    ].map(m => (
                      <div key={m.label} className="glass-dark rounded-xl p-3">
                        <div className="text-xs text-slate-500 mb-1">{m.label}</div>
                        <div className="text-white font-bold text-sm">{m.val}%</div>
                        <div className="progress-bar mt-1.5">
                          <div className={`progress-fill ${m.color}`} style={{width:`${m.val}%`}} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          2. STATS SECTION
      ══════════════════════════════════════════════════════ */}
      <section className="relative py-20 border-y border-white/5 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary-600/5 via-transparent to-accent-violet/5" />
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12">
            <StatCounter value={2400}  suffix="+"  label="Students Trained"    color="text-white" />
            <StatCounter value={180}   suffix="+"  label="Verified HR Mentors" color="text-gradient" />
            <StatCounter value={96}    suffix="%"  label="Placement Rate"      color="text-accent-emerald" />
            <StatCounter value={12000} suffix="+"  label="Sessions Completed"  color="text-white" />
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          3. ABOUT / VALUE PROPS
      ══════════════════════════════════════════════════════ */}
      <section id="about" className="py-28 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <span className="section-label mb-6">Why Mock Aura</span>
            <h2 className="text-4xl sm:text-5xl font-black text-white mt-4 text-balance">Two sides of the same mission</h2>
            <p className="text-slate-400 mt-4 text-lg max-w-2xl mx-auto">
              Whether you're building your career or mentoring the next generation — Mock Aura is your platform.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Student card */}
            <div className="gradient-border p-8 card-hover group">
              <div className="flex items-start gap-5 mb-8">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-600 to-primary-400 flex items-center justify-center shadow-xl shadow-primary-500/30 flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-2xl font-black text-white">For Students</h3>
                  <p className="text-slate-400 text-sm mt-1">Turn academic knowledge into interview-ready skills</p>
                </div>
              </div>
              <ul className="space-y-4">
                {[
                  { t: "AI Mock Interviews",       d: "Practice with Gemini AI that simulates real recruiter questions." },
                  { t: "Resume Optimization",      d: "ATS-scored feedback with line-by-line recommendations." },
                  { t: "Skill Gap Roadmaps",       d: "Know exactly what to learn next for your target role." },
                  { t: "Placement Analytics",      d: "Track growth over time with rich performance dashboards." },
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-lg bg-accent-emerald/15 border border-accent-emerald/25 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-3 h-3 text-accent-emerald" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <span className="text-white text-sm font-semibold">{item.t}</span>
                      <span className="text-slate-400 text-sm"> — {item.d}</span>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="mt-8">
                <Link to="/register" className="btn-primary w-full justify-center py-3.5">
                  Join as Student →
                </Link>
              </div>
            </div>

            {/* HR card */}
            <div className="gradient-border p-8 card-hover group" style={{background:'rgba(20,14,40,0.7)'}}>
              <div className="flex items-start gap-5 mb-8">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent-violet to-purple-700 flex items-center justify-center shadow-xl shadow-accent-violet/30 flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-2xl font-black text-white">For HR Professionals</h3>
                  <p className="text-slate-400 text-sm mt-1">Monetize your expertise and shape careers</p>
                </div>
              </div>
              <ul className="space-y-4">
                {[
                  { t: "Flexible Scheduling",      d: "Set your own availability with an intuitive slot manager." },
                  { t: "Earn Side Income",          d: "Get paid directly to your wallet per completed session." },
                  { t: "Verified Interviewer Badge",d: "Pass AI assessment to earn a verifiable credential." },
                  { t: "Performance Analytics",    d: "Track ratings, earnings, and mentoring impact over time." },
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-lg bg-accent-violet/15 border border-accent-violet/25 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-3 h-3 text-accent-violet" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <span className="text-white text-sm font-semibold">{item.t}</span>
                      <span className="text-slate-400 text-sm"> — {item.d}</span>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="mt-8">
                <Link to="/register" className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm border border-accent-violet/30 bg-accent-violet/10 text-accent-violet hover:bg-accent-violet/20 hover:-translate-y-0.5 transition-all duration-200 shadow-lg shadow-accent-violet/10">
                  Join as HR Professional →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          4. FEATURES GRID
      ══════════════════════════════════════════════════════ */}
      <section id="features" className="py-28 bg-dark-900/30 border-y border-white/5 relative overflow-hidden">
        <div className="absolute inset-0 dot-pattern opacity-40 pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-20">
            <span className="section-label mb-6">Platform Features</span>
            <h2 className="text-4xl sm:text-5xl font-black text-white mt-4">Everything you need to succeed</h2>
            <p className="text-slate-400 mt-4 text-lg max-w-2xl mx-auto">
              A complete AI-powered career acceleration toolkit — from resume analysis to live interview coaching.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feat, idx) => (
              <div key={idx} className={`gradient-border p-7 card-hover group cursor-default`}
                   style={{animationDelay:`${idx * 80}ms`}}>
                <FeatureIcon gradient={feat.gradient}>
                  {feat.icon}
                </FeatureIcon>
                <h4 className="text-lg font-bold text-white mb-2 group-hover:text-gradient transition-all duration-300">
                  {feat.title}
                </h4>
                <p className="text-slate-400 text-sm leading-relaxed">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          5. HOW IT WORKS
      ══════════════════════════════════════════════════════ */}
      <section id="how-it-works" className="py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <span className="section-label mb-6">How It Works</span>
            <h2 className="text-4xl sm:text-5xl font-black text-white mt-4">Simple. Structured. Effective.</h2>
            <p className="text-slate-400 mt-4 text-lg">Get started in minutes with a clear onboarding path.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">
            {/* Student Flow */}
            <div>
              <div className="flex items-center gap-3 mb-10">
                <div className="badge-primary px-3 py-1.5 text-sm">Student Path</div>
                <div className="h-px flex-1 bg-primary-500/20" />
              </div>
              <div className="space-y-0">
                {[
                  { step:"01", title:"Create Your Profile",    desc:"Sign up as a student, fill in academic details and career goals.",       color:"bg-primary-600" },
                  { step:"02", title:"Upload Your Resume",      desc:"Add your CV — our AI instantly scans and scores it for ATS readiness.",  color:"bg-primary-500" },
                  { step:"03", title:"Select Target Skills",    desc:"Tag your technologies and the roles you're targeting.",                  color:"bg-primary-400" },
                  { step:"04", title:"Book & Prepare",          desc:"Schedule 1-on-1 sessions with verified mentors and receive AI reports.", color:"bg-accent-violet" },
                ].map((item, i) => (
                  <div key={i} className={`relative flex gap-6 pb-10 last:pb-0`}>
                    {i < 3 && <div className="absolute left-5 top-10 bottom-0 w-px bg-gradient-to-b from-primary-500/30 to-transparent" />}
                    <div className={`w-10 h-10 rounded-2xl ${item.color} flex items-center justify-center text-white text-xs font-black flex-shrink-0 shadow-lg z-10`}>
                      {item.step}
                    </div>
                    <div className="pt-1">
                      <h4 className="text-white font-bold text-base">{item.title}</h4>
                      <p className="text-slate-400 text-sm mt-1 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* HR Flow */}
            <div>
              <div className="flex items-center gap-3 mb-10">
                <div className="badge-violet px-3 py-1.5 text-sm">HR Path</div>
                <div className="h-px flex-1 bg-accent-violet/20" />
              </div>
              <div className="space-y-0">
                {[
                  { step:"01", title:"Register as Professional",  desc:"Create your account with company credentials and expertise areas.",      color:"bg-accent-violet" },
                  { step:"02", title:"Submit Verification Docs",   desc:"Upload your Employee ID, resume, and experience letter for review.",     color:"bg-purple-600" },
                  { step:"03", title:"Pass AI Assessment",         desc:"Complete a skill assessment — earn your verified interviewer badge.",    color:"bg-primary-600" },
                  { step:"04", title:"Open Slots & Earn",          desc:"Manage your calendar, conduct sessions and receive wallet earnings.",    color:"bg-accent-emerald" },
                ].map((item, i) => (
                  <div key={i} className={`relative flex gap-6 pb-10 last:pb-0`}>
                    {i < 3 && <div className="absolute left-5 top-10 bottom-0 w-px bg-gradient-to-b from-accent-violet/30 to-transparent" />}
                    <div className={`w-10 h-10 rounded-2xl ${item.color} flex items-center justify-center text-white text-xs font-black flex-shrink-0 shadow-lg z-10`}>
                      {item.step}
                    </div>
                    <div className="pt-1">
                      <h4 className="text-white font-bold text-base">{item.title}</h4>
                      <p className="text-slate-400 text-sm mt-1 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          6. MENTORS / FEATURED HRs
      ══════════════════════════════════════════════════════ */}
      <section id="mentors" className="py-28 bg-dark-900/40 border-y border-white/5 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <span className="section-label mb-6">Top Mentors</span>
            <h2 className="text-4xl sm:text-5xl font-black text-white mt-4">Learn from the best in the industry</h2>
            <p className="text-slate-400 mt-4 text-lg max-w-2xl mx-auto">
              Every mentor is manually verified with real credentials from top tech companies.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {mentors.map((hr, idx) => (
              <div key={idx} className="gradient-border p-6 card-hover group cursor-default relative overflow-hidden">
                {/* Verified badge */}
                <div className="absolute top-4 right-4 flex items-center gap-1 bg-accent-emerald/10 border border-accent-emerald/20 px-2 py-1 rounded-lg">
                  <svg className="w-3 h-3 text-accent-emerald" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-5.5z" clipRule="evenodd" />
                  </svg>
                  <span className="text-accent-emerald text-[10px] font-bold">Verified</span>
                </div>

                {/* Avatar */}
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${hr.grad} flex items-center justify-center text-white text-2xl font-black mb-4 shadow-xl transition-transform duration-300 group-hover:scale-105`}>
                  {hr.name.charAt(0)}
                </div>

                <h4 className="text-white font-bold text-lg leading-tight">{hr.name}</h4>
                <p className="text-slate-400 text-xs mt-0.5">
                  {hr.role} at <span className="text-white font-semibold">{hr.company}</span>
                </p>

                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center gap-1 text-xs text-slate-500">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 14a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                    </svg>
                    {hr.yoe} yrs exp
                  </div>
                  <div className="flex">
                    {[1,2,3,4,5].map(s => (
                      <svg key={s} className="w-3.5 h-3.5 text-accent-amber" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-white/5">
                  <span className="badge-primary text-[10px]">{hr.tag}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          7. TESTIMONIALS
      ══════════════════════════════════════════════════════ */}
      <section className="py-28 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] orb-primary opacity-10 blur-[80px] pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-20">
            <span className="section-label mb-6">Testimonials</span>
            <h2 className="text-4xl sm:text-5xl font-black text-white mt-4">Trusted by thousands</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { text: "Mock Aura completely transformed how I approached interviews. The AI analysis of my answers gave me insights I'd never get from a textbook.", author:"Rohan K.", role:"CS Student → Placed at TCS", stars:5 },
              { text: "The AI coach is genuinely useful. It caught weak points in my system design answers that 3 of my friends who'd passed the same round missed.", author:"Anjali S.", role:"Backend Dev → Placed at Infosys", stars:5 },
              { text: "The mentors are real, verified professionals. I had a session with a Google HR manager and got feedback that changed my entire interview strategy.", author:"Vikram P.", role:"Full-Stack Student → Placed at Wipro", stars:5 },
            ].map((t, i) => (
              <div key={i} className="gradient-border p-8 card-hover flex flex-col">
                <div className="flex gap-0.5 mb-4">
                  {[...Array(t.stars)].map((_, s) => (
                    <svg key={s} className="w-4 h-4 text-accent-amber" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-slate-300 text-sm leading-relaxed flex-1">"{t.text}"</p>
                <div className="mt-6 pt-4 border-t border-white/5 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-accent-violet flex items-center justify-center text-white text-xs font-bold">
                    {t.author.charAt(0)}
                  </div>
                  <div>
                    <p className="text-white text-sm font-bold">{t.author}</p>
                    <p className="text-slate-500 text-xs">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          8. FAQ
      ══════════════════════════════════════════════════════ */}
      <section id="faq" className="py-28 bg-dark-900/40 border-t border-white/5">
        <div className="max-w-3xl mx-auto px-4">
          <div className="text-center mb-16">
            <span className="section-label mb-6">FAQ</span>
            <h2 className="text-4xl sm:text-5xl font-black text-white mt-4">Common questions</h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => (
              <div key={idx} className={`gradient-border overflow-hidden transition-all duration-300 ${activeFaq === idx ? 'pricing-selected' : ''}`}>
                <button
                  onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                  className="w-full text-left px-6 py-5 flex items-center justify-between gap-4 hover:bg-white/3 transition-colors duration-200"
                >
                  <span className="text-white font-semibold text-sm pr-4">{faq.q}</span>
                  <div className={`w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center border transition-all duration-300
                    ${activeFaq === idx ? 'bg-primary-500 border-primary-500 rotate-45' : 'border-white/10 bg-white/4'}`}>
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                </button>
                {activeFaq === idx && (
                  <div className="px-6 pb-6 text-slate-400 text-sm leading-relaxed border-t border-white/5 pt-4 animate-fade-in">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          9. CTA BANNER
      ══════════════════════════════════════════════════════ */}
      <section className="py-28 relative overflow-hidden">
        <div className="absolute inset-0 hero-gradient opacity-70" />
        <div className="absolute inset-0 grid-pattern opacity-30" />
        <div className="relative max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl sm:text-6xl font-black text-white text-balance mb-6">
            Ready to land your<br /><span className="text-gradient">dream job?</span>
          </h2>
          <p className="text-xl text-slate-400 mb-10 max-w-xl mx-auto">
            Join 2,400+ students already using Mock Aura to ace their interviews.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/register" className="btn-gradient px-10 py-4 rounded-2xl text-lg font-black shadow-2xl shadow-primary-600/40 transition-all duration-300 hover:-translate-y-1">
              Get Started Free →
            </Link>
            <Link to="/login" className="btn-ghost px-10 py-4 rounded-2xl text-lg font-bold">
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          10. CONTACT
      ══════════════════════════════════════════════════════ */}
      <section id="contact" className="py-28 bg-dark-900/50 border-t border-white/5">
        <div className="max-w-xl mx-auto px-4">
          <div className="text-center mb-12">
            <span className="section-label mb-6">Contact Us</span>
            <h2 className="text-4xl font-black text-white mt-4">Get in touch</h2>
            <p className="text-slate-400 mt-3">
              Questions? Email us at{' '}
              <a href="mailto:mockauraaa@gmail.com" className="text-primary-400 hover:text-primary-300 font-semibold transition-colors">
                mockauraaa@gmail.com
              </a>
            </p>
          </div>

          {formSubmitted ? (
            <div className="gradient-border p-8 text-center">
              <div className="w-14 h-14 rounded-2xl bg-accent-emerald/15 border border-accent-emerald/25 flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-accent-emerald" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h4 className="font-bold text-lg text-white mb-1">Message Sent!</h4>
              <p className="text-slate-400 text-sm">Our team will get back to you shortly.</p>
            </div>
          ) : (
            <form onSubmit={handleContactSubmit} className="gradient-border p-8 space-y-5">
              {[
                { label:'Your Name',      type:'text',  name:'name',    placeholder:'John Doe' },
                { label:'Email Address',  type:'email', name:'email',   placeholder:'you@email.com' },
                { label:'Subject',        type:'text',  name:'subject', placeholder:'How can we help?' },
              ].map(field => (
                <div key={field.name}>
                  <label className="block text-slate-300 text-sm font-semibold mb-2">{field.label}</label>
                  <input
                    type={field.type}
                    required={field.name !== 'subject'}
                    placeholder={field.placeholder}
                    value={contactForm[field.name]}
                    onChange={(e) => setContactForm({...contactForm, [field.name]: e.target.value})}
                    className="input-premium"
                  />
                </div>
              ))}
              <div>
                <label className="block text-slate-300 text-sm font-semibold mb-2">Message</label>
                <textarea
                  required rows={4}
                  placeholder="Tell us more about your question or feedback..."
                  value={contactForm.message}
                  onChange={(e) => setContactForm({...contactForm, message: e.target.value})}
                  className="input-premium resize-none"
                />
              </div>
              {formError && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs px-4 py-3 rounded-xl">{formError}</div>
              )}
              <button type="submit" disabled={formLoading} className="btn-primary w-full py-4 text-base disabled:opacity-60">
                {formLoading ? (
                  <div className="h-5 w-5 border-2 border-t-transparent border-white rounded-full animate-spin" />
                ) : (
                  <>
                    Send Message
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </section>

    </div>
  );
};

export default Landing;
