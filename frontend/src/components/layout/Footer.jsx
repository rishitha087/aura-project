import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  const year = new Date().getFullYear();

  const links = {
    'For Students': [
      { label: 'Browse HR Mentors',   href: '/hrs'                     },
      { label: 'Mock Interviews',     href: '/student/dashboard'       },
      { label: 'Resume Analysis',     href: '/student/resume-analysis' },
      { label: 'Skill Gap Report',    href: '/student/skill-gap'       },
      { label: 'AI Career Coach',     href: '/student/ai-coach'        },
      { label: 'Leaderboard',         href: '/leaderboard'             },
    ],
    'For Professionals': [
      { label: 'Join as Interviewer', href: '/register'                },
      { label: 'HR Dashboard',        href: '/hr/dashboard'            },
      { label: 'Earn Side Income',    href: '/hr/dashboard'            },
      { label: 'HR Assessment',       href: '/hr/assessment'           },
      { label: 'My Analytics',        href: '/hr/analytics'            },
    ],
    'Support': [
      { label: 'FAQ',                 href: '/#faq'                    },
      { label: 'Contact Support',     href: '/#contact'                },
      { label: 'API Documentation',   href: '/api/docs/'               },
      { label: 'Privacy Policy',      href: '/#'                       },
      { label: 'Terms of Service',    href: '/#'                       },
    ],
  };

  const socials = [
    {
      name: 'Twitter',
      href: '#',
      icon: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      ),
    },
    {
      name: 'LinkedIn',
      href: '#',
      icon: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
        </svg>
      ),
    },
    {
      name: 'GitHub',
      href: '#',
      icon: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
        </svg>
      ),
    },
  ];

  return (
    <footer className="relative border-t border-white/5 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-dark-900/0 via-dark-900/60 to-dark-950" />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[200px] orb-primary opacity-5 blur-[80px] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-10">
        {/* Top: Brand + Links */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-12 mb-16">
          {/* Brand column */}
          <div className="md:col-span-2 space-y-6">
            <Link to="/" className="flex items-center gap-3 group w-fit">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-violet
                              flex items-center justify-center text-white text-sm font-black
                              shadow-lg shadow-primary-600/30 group-hover:scale-105 transition-transform duration-200">
                AI
              </div>
              <span className="text-2xl font-black text-white">MOCK <span className="text-gradient">AURA</span></span>
            </Link>

            <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
              The AI-powered career acceleration platform connecting students with verified HR professionals for mock interviews, resume reviews, and personalized mentoring.
            </p>

            {/* Social links */}
            <div className="flex items-center gap-3">
              {socials.map(social => (
                <a key={social.name} href={social.href}
                  className="w-9 h-9 rounded-xl border border-white/8 bg-white/4 text-slate-400
                             hover:text-white hover:border-white/20 hover:bg-white/8
                             flex items-center justify-center transition-all duration-200 hover:-translate-y-0.5"
                  aria-label={social.name}>
                  {social.icon}
                </a>
              ))}
              <a href="mailto:mockauraaa@gmail.com"
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-primary-500/25
                           bg-primary-500/8 text-primary-400 hover:bg-primary-500/15
                           text-xs font-semibold transition-all duration-200 hover:-translate-y-0.5">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Contact Us
              </a>
            </div>

            {/* Status badge */}
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-emerald opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-accent-emerald" />
              </span>
              All systems operational
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(links).map(([heading, items]) => (
            <div key={heading}>
              <h3 className="text-white font-bold text-sm tracking-wide mb-5">{heading}</h3>
              <ul className="space-y-3">
                {items.map(item => (
                  <li key={item.label}>
                    <Link to={item.href}
                      className="text-slate-400 hover:text-white text-sm transition-colors duration-200 hover:pl-1 block transition-all">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-8 border-y border-white/5 mb-8">
          {[
            { val: '2,400+', label: 'Students Trained'    },
            { val: '180+',   label: 'Verified Mentors'    },
            { val: '96%',    label: 'Placement Rate'      },
            { val: '12,000+',label: 'Sessions Completed'  },
          ].map(s => (
            <div key={s.label} className="text-center">
              <div className="text-2xl font-black text-white">{s.val}</div>
              <div className="text-slate-500 text-xs mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-slate-500 text-xs">
            © {year} Mock Aura Technologies Pvt. Ltd. All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-xs text-slate-500">
            <span className="hover:text-slate-300 cursor-pointer transition-colors">Privacy Policy</span>
            <span className="hover:text-slate-300 cursor-pointer transition-colors">Terms of Service</span>
            <span className="hover:text-slate-300 cursor-pointer transition-colors">Cookie Policy</span>
          </div>
          <p className="text-slate-600 text-xs flex items-center gap-1">
            Made with <span className="text-accent-coral">♥</span> for developers
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
