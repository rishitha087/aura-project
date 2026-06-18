import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Navbar = () => {
  const { user, isAuthenticated, logout, isStudent, isHR, isAdmin } = useAuth();
  const [isOpen, setIsOpen]         = useState(false);
  const [scrolled, setScrolled]     = useState(false);
  const [dropdownOpen, setDropdown] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const dropRef = useRef(null);

  /* Scroll-aware glass blur intensification */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /* Close dropdown on outside click */
  useEffect(() => {
    const handler = (e) => { if (dropRef.current && !dropRef.current.contains(e.target)) setDropdown(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  /* Close mobile menu on route change */
  useEffect(() => { setIsOpen(false); setDropdown(false); }, [location.pathname]);

  const handleLogout = () => { logout(); navigate('/'); };

  const getDashboardPath = () => {
    if (!user) return '/';
    if (user.role === 'student') return '/student/dashboard';
    if (user.role === 'hr')      return '/hr/dashboard';
    if (user.role === 'admin')   return '/admin/dashboard';
    return '/';
  };

  const publicLinks = [
    { name: 'Features',    id: 'features'    },
    { name: 'How It Works',id: 'how-it-works'},
    { name: 'Mentors',     id: 'mentors'     },
    { name: 'FAQ',         id: 'faq'         },
  ];

  const studentLinks = [
    { name: 'Browse HRs',       path: '/hrs'                     },
    { name: 'My Dashboard',     path: '/student/dashboard'       },
    { name: 'Resume Analysis',  path: '/student/resume-analysis' },
    { name: 'Skill Gap',        path: '/student/skill-gap'       },
    { name: 'AI Coach',         path: '/student/ai-coach'        },
    { name: 'Leaderboard',      path: '/leaderboard'             },
  ];

  const hrLinks = [
    { name: 'Dashboard',    path: '/hr/dashboard'        },
    { name: 'Slots',        path: '/hr/dashboard/slots'  },
    { name: 'Assessment',   path: '/hr/assessment'       },
    { name: 'Analytics',    path: '/hr/analytics'        },
    { name: 'Leaderboard',  path: '/leaderboard'         },
  ];

  const adminLinks = [
    { name: '⚙ Dashboard',   path: '/admin/dashboard' },
  ];

  const activeLinks = isAdmin ? adminLinks : (isStudent ? studentLinks : (isHR ? hrLinks : []));

  const handleScrollTo = (id) => {
    setIsOpen(false);
    if (location.pathname !== '/') { navigate('/#' + id); return; }
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const isActive = (path) => location.pathname === path;

  const initials = user?.full_name
    ? user.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : '??';

  const roleColor = user?.role === 'student' ? 'from-primary-500 to-accent-violet'
                  : user?.role === 'hr'      ? 'from-accent-violet to-accent-coral'
                  : user?.role === 'admin'   ? 'from-amber-500 to-red-500'
                  : 'from-accent-emerald to-accent-cyan';

  return (
    <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
      scrolled
        ? 'bg-dark-900/80 backdrop-blur-2xl border-b border-white/8 shadow-2xl shadow-black/30'
        : 'bg-transparent backdrop-blur-md border-b border-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* ── Logo ─────────────────────────────────────── */}
          <Link to="/" className="flex items-center gap-2.5 flex-shrink-0 group">
            <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-accent-violet
                            flex items-center justify-center text-white text-sm font-black
                            shadow-lg shadow-primary-600/40 group-hover:shadow-primary-500/50
                            transition-all duration-300 group-hover:scale-105">
              AI
              <span className="absolute inset-0 rounded-xl bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
            <span className="text-xl font-black text-white tracking-tight">
              MOCK <span className="text-gradient">AURA</span>
            </span>
          </Link>

          {/* ── Desktop Nav Links ─────────────────────────── */}
          <div className="hidden lg:flex items-center gap-1">
            {isAuthenticated ? (
              activeLinks.map(link => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`nav-link ${isActive(link.path) ? 'active text-white' : ''}`}
                >
                  {link.name}
                </Link>
              ))
            ) : (
              publicLinks.map(link => (
                <button
                  key={link.id}
                  onClick={() => handleScrollTo(link.id)}
                  className="nav-link"
                >
                  {link.name}
                </button>
              ))
            )}
          </div>

          {/* ── Desktop Right CTA / User ──────────────────── */}
          <div className="hidden lg:flex items-center gap-3">
            {isAuthenticated ? (
              <div className="relative" ref={dropRef}>
                <button
                  onClick={() => setDropdown(!dropdownOpen)}
                  className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-2xl
                             bg-white/5 hover:bg-white/8 border border-white/8 hover:border-white/15
                             transition-all duration-200 group"
                >
                  <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${roleColor}
                                  flex items-center justify-center text-white text-xs font-bold
                                  shadow-md transition-transform duration-200 group-hover:scale-105`}>
                    {initials}
                  </div>
                  <div className="text-left">
                    <p className="text-white text-xs font-semibold leading-none mb-0.5">{user?.full_name?.split(' ')[0]}</p>
                    <p className="text-slate-500 text-[10px] capitalize leading-none">{user?.role}</p>
                  </div>
                  <svg className={`w-3.5 h-3.5 text-slate-400 ml-1 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`}
                       fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Dropdown */}
                {dropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 glass-dark rounded-2xl border border-white/10 shadow-2xl overflow-hidden animate-fade-in-down">
                    <div className="px-4 py-3 border-b border-white/5">
                      <p className="text-white text-sm font-bold">{user?.full_name}</p>
                      <p className="text-slate-500 text-xs truncate">{user?.email}</p>
                    </div>
                    <div className="py-1.5">
                      <Link to={getDashboardPath()} className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-white/5 transition-colors">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                        Dashboard
                      </Link>
                      <Link to="/leaderboard" className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-white/5 transition-colors">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        Leaderboard
                      </Link>
                    </div>
                    <div className="border-t border-white/5 py-1.5">
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-accent-coral hover:bg-accent-coral/5 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login" className="btn-ghost text-sm py-2 px-4">
                  Sign In
                </Link>
                <Link to="/register" className="btn-primary text-sm py-2.5 px-5">
                  Get Started
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
              </div>
            )}
          </div>

          {/* ── Hamburger ─────────────────────────────────── */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="lg:hidden p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all duration-200 border border-transparent hover:border-white/10"
          >
            <svg className="h-5 w-5 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {isOpen
                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              }
            </svg>
          </button>
        </div>
      </div>

      {/* ── Mobile Drawer ────────────────────────────────── */}
      {isOpen && (
        <div className="lg:hidden animate-fade-in-down border-t border-white/5 bg-dark-900/95 backdrop-blur-2xl shadow-2xl">
          <div className="px-4 pt-4 pb-6 space-y-1">
            {isAuthenticated ? (
              <>
                {/* User banner */}
                <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/4 border border-white/6 mb-3">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${roleColor} flex items-center justify-center text-white text-sm font-bold shadow-md`}>
                    {initials}
                  </div>
                  <div>
                    <p className="text-white text-sm font-bold">{user?.full_name}</p>
                    <p className="text-slate-500 text-xs capitalize">{user?.role}</p>
                  </div>
                </div>

                {activeLinks.map(link => (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`flex items-center gap-2 w-full px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-200
                      ${isActive(link.path) ? 'bg-primary-600/20 text-white border border-primary-500/25' : 'text-slate-300 hover:text-white hover:bg-white/5'}`}
                  >
                    {link.name}
                  </Link>
                ))}

                <div className="pt-2 mt-2 border-t border-white/5">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-4 py-3 rounded-2xl text-sm font-semibold text-accent-coral hover:bg-accent-coral/5 transition-all duration-200"
                  >
                    Sign Out
                  </button>
                </div>
              </>
            ) : (
              <>
                {publicLinks.map(link => (
                  <button
                    key={link.id}
                    onClick={() => handleScrollTo(link.id)}
                    className="block w-full text-left px-4 py-3 rounded-2xl text-sm font-semibold text-slate-300 hover:text-white hover:bg-white/5 transition-all duration-200"
                  >
                    {link.name}
                  </button>
                ))}
                <div className="pt-2 mt-2 border-t border-white/5 flex flex-col gap-2">
                  <Link to="/login" className="block text-center py-3 rounded-2xl text-sm font-bold border border-white/10 text-slate-300 hover:bg-white/5 transition-all duration-200">
                    Sign In
                  </Link>
                  <Link to="/register" className="btn-primary py-3 text-sm">
                    Get Started →
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
