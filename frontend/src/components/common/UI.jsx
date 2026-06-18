/**
 * Shared premium UI primitives used across all pages.
 * Import what you need: import { PageHeader, StatCard, ... } from '../common/UI'
 */
import React from 'react';

/* ─── Spinner ─────────────────────────────────────────────────── */
export const Spinner = ({ size = 'md', className = '' }) => {
  const sizes = { sm: 'h-4 w-4 border-2', md: 'h-7 w-7 border-2', lg: 'h-12 w-12 border-[3px]' };
  return (
    <div className={`${sizes[size]} border-t-transparent border-primary-400 rounded-full animate-spin ${className}`} />
  );
};

/* ─── Full-page loader ────────────────────────────────────────── */
export const PageLoader = ({ text = 'Loading...' }) => (
  <div className="min-h-screen flex flex-col items-center justify-center gap-4">
    <Spinner size="lg" />
    <p className="text-slate-400 text-sm font-medium animate-pulse">{text}</p>
  </div>
);

/* ─── Section / Page header ──────────────────────────────────── */
export const PageHeader = ({ label, title, subtitle, action }) => (
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
    <div>
      {label && <span className="section-label mb-3">{label}</span>}
      <h1 className={`text-2xl sm:text-3xl font-black text-white ${label ? 'mt-3' : ''}`}>{title}</h1>
      {subtitle && <p className="text-slate-400 text-sm mt-1">{subtitle}</p>}
    </div>
    {action && <div className="flex-shrink-0">{action}</div>}
  </div>
);

/* ─── Stat card ──────────────────────────────────────────────── */
export const StatCard = ({ label, value, icon, trend, color = 'primary', className = '' }) => {
  const colors = {
    primary: { icon: 'bg-primary-500/15 border-primary-500/20 text-primary-400', text: 'text-white' },
    emerald: { icon: 'bg-accent-emerald/15 border-accent-emerald/20 text-accent-emerald', text: 'text-accent-emerald' },
    violet:  { icon: 'bg-accent-violet/15 border-accent-violet/20 text-accent-violet',   text: 'text-accent-violet'  },
    amber:   { icon: 'bg-accent-amber/15 border-accent-amber/20 text-accent-amber',       text: 'text-accent-amber'  },
    coral:   { icon: 'bg-accent-coral/15 border-accent-coral/20 text-accent-coral',       text: 'text-accent-coral'  },
  };
  const c = colors[color] || colors.primary;
  return (
    <div className={`stat-card card-hover ${className}`}>
      <div className="flex items-start justify-between">
        {icon && (
          <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${c.icon}`}>
            {icon}
          </div>
        )}
        {trend !== undefined && (
          <span className={`text-xs font-bold ${trend >= 0 ? 'text-accent-emerald' : 'text-accent-coral'}`}>
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div className={`text-2xl font-black ${c.text} mt-3`}>{value}</div>
      <div className="text-slate-500 text-xs font-medium">{label}</div>
    </div>
  );
};

/* ─── Alert / Banner ─────────────────────────────────────────── */
export const Alert = ({ type = 'info', title, message, onClose }) => {
  const styles = {
    success: 'bg-accent-emerald/10 border-accent-emerald/25 text-accent-emerald',
    error:   'bg-red-500/10 border-red-500/20 text-red-300',
    warning: 'bg-accent-amber/10 border-accent-amber/20 text-accent-amber',
    info:    'bg-primary-500/10 border-primary-500/20 text-primary-300',
  };
  const icons = {
    success: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />,
    error:   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />,
    warning: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />,
    info:    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />,
  };
  return (
    <div className={`flex items-start gap-3 p-4 rounded-2xl border text-sm ${styles[type]}`}>
      <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        {icons[type]}
      </svg>
      <div className="flex-1">
        {title && <p className="font-bold mb-0.5">{title}</p>}
        {message && <p className="opacity-80">{message}</p>}
      </div>
      {onClose && (
        <button onClick={onClose} className="opacity-60 hover:opacity-100 transition-opacity">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
};

/* ─── Empty state ─────────────────────────────────────────────── */
export const EmptyState = ({ icon, title, message, action }) => (
  <div className="flex flex-col items-center justify-center py-20 text-center">
    {icon && (
      <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 mb-5 text-2xl">
        {icon}
      </div>
    )}
    <h3 className="text-white font-bold text-lg mb-2">{title}</h3>
    {message && <p className="text-slate-400 text-sm max-w-xs">{message}</p>}
    {action && <div className="mt-6">{action}</div>}
  </div>
);

/* ─── Skeleton loaders ────────────────────────────────────────── */
export const SkeletonCard = ({ lines = 3 }) => (
  <div className="glass rounded-2xl p-6 space-y-3 border border-white/5">
    <div className="skeleton h-5 w-3/4 rounded-lg" />
    {[...Array(lines)].map((_, i) => (
      <div key={i} className={`skeleton h-3 rounded-lg ${i === lines - 1 ? 'w-1/2' : 'w-full'}`} />
    ))}
  </div>
);

/* ─── Tab bar ─────────────────────────────────────────────────── */
export const TabBar = ({ tabs, active, onChange }) => (
  <div className="tab-bar">
    {tabs.map(tab => (
      <button
        key={tab.value}
        onClick={() => onChange(tab.value)}
        className={`tab-item ${active === tab.value ? 'active' : ''}`}
      >
        {tab.icon && <span className="mr-1.5">{tab.icon}</span>}
        {tab.label}
        {tab.count !== undefined && (
          <span className={`ml-1.5 px-1.5 py-0.5 rounded-md text-xs font-bold ${
            active === tab.value ? 'bg-white/20 text-white' : 'bg-white/5 text-slate-500'
          }`}>
            {tab.count}
          </span>
        )}
      </button>
    ))}
  </div>
);

/* ─── Badge ───────────────────────────────────────────────────── */
export const Badge = ({ label, variant = 'primary' }) => (
  <span className={`badge-${variant}`}>{label}</span>
);

/* ─── Progress bar ───────────────────────────────────────────── */
export const ProgressBar = ({ value, max = 100, color = 'bg-primary-500', label, showValue = true }) => {
  const pct = Math.min(Math.round((value / max) * 100), 100);
  return (
    <div>
      {(label || showValue) && (
        <div className="flex items-center justify-between mb-1.5">
          {label && <span className="text-slate-400 text-xs">{label}</span>}
          {showValue && <span className="text-white text-xs font-bold">{pct}%</span>}
        </div>
      )}
      <div className="progress-bar">
        <div className={`progress-fill ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
};

/* ─── Rating stars ───────────────────────────────────────────── */
export const Stars = ({ value = 0, max = 5, size = 'sm' }) => {
  const sz = size === 'sm' ? 'w-3.5 h-3.5' : 'w-5 h-5';
  return (
    <div className="flex gap-0.5">
      {[...Array(max)].map((_, i) => (
        <svg key={i} className={`${sz} ${i < value ? 'text-accent-amber' : 'text-slate-700'}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
};

/* ─── Card wrapper ───────────────────────────────────────────── */
export const Card = ({ children, className = '', hover = false, gradient = false }) => (
  <div className={`${gradient ? 'gradient-border' : 'glass rounded-2xl border border-white/5'} ${hover ? 'card-hover' : ''} ${className}`}>
    {children}
  </div>
);

/* ─── Avatar ─────────────────────────────────────────────────── */
export const Avatar = ({ name, size = 'md', gradient = 'from-primary-500 to-accent-violet' }) => {
  const sizes  = { sm: 'w-8 h-8 text-xs rounded-xl', md: 'w-12 h-12 text-sm rounded-2xl', lg: 'w-16 h-16 text-lg rounded-2xl' };
  const initials = name ? name.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase() : '?';
  return (
    <div className={`${sizes[size]} avatar bg-gradient-to-br ${gradient} font-black`}>
      {initials}
    </div>
  );
};
