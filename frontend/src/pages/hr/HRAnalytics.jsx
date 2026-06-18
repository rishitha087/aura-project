import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getHRAnalytics } from '../../services/ai';

const HRAnalytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await getHRAnalytics();
        setData(res);
      } catch (err) {
        setError('Failed to load HR performance statistics.');
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <div className="h-10 w-10 border-4 border-t-transparent border-accent-violet rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16 text-center">
        <div className="glass p-8 rounded-3xl border border-red-500/20 max-w-md mx-auto">
          <h3 className="text-xl font-bold text-red-400">Analytics Empty</h3>
          <p className="text-slate-400 text-xs mt-2">{error || 'Complete active candidate mock interviews to start logging performance charts.'}</p>
          <Link to="/hr/dashboard" className="mt-6 inline-block bg-accent-violet hover:bg-accent-violet/90 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition">
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const earningsData = data.monthly_earnings || [];
  
  // Find max value for scaling bar height
  const maxEarn = earningsData.length > 0 ? Math.max(...earningsData.map(d => d.amount), 500) : 500;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16">
      
      {/* Back to Dashboard */}
      <div className="mb-6">
        <Link to="/hr/dashboard" className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-xs transition">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to HR Dashboard
        </Link>
      </div>

      <div className="mb-10 text-center md:text-left">
        <h1 className="text-4xl font-extrabold text-white tracking-tight">
          Performance & <span className="text-gradient">Earnings Analytics</span>
        </h1>
        <p className="text-slate-400 text-sm mt-2">
          Track mentoring stats, student review ratings, customer satisfaction rates, and monthly earnings breakdown.
        </p>
      </div>

      {/* Metrics widgets */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        
        {/* Interviews Conducted */}
        <div className="glass p-5 rounded-2xl border border-white/5">
          <span className="text-slate-500 text-[10px] font-semibold uppercase tracking-wider">Interviews Conducted</span>
          <div className="text-2xl font-extrabold text-white mt-1">{data.interviews_conducted} Mocks</div>
        </div>

        {/* Avg Rating */}
        <div className="glass p-5 rounded-2xl border border-white/5 border-l-4 border-l-accent-violet">
          <span className="text-slate-500 text-[10px] font-semibold uppercase tracking-wider">Average Rating</span>
          <div className="text-2xl font-extrabold text-white mt-1 inline-flex items-center gap-1.5">
            ★ {data.average_rating > 0 ? data.average_rating : 'N/A'}
          </div>
        </div>

        {/* Satisfaction */}
        <div className="glass p-5 rounded-2xl border border-white/5 border-l-4 border-l-accent-emerald">
          <span className="text-slate-500 text-[10px] font-semibold uppercase tracking-wider">Candidate Satisfaction</span>
          <div className="text-2xl font-extrabold text-white mt-1">{data.satisfaction_ratio}%</div>
        </div>

        {/* Earnings */}
        <div className="glass p-5 rounded-2xl border border-white/5 border-l-4 border-l-accent-amber">
          <span className="text-slate-500 text-[10px] font-semibold uppercase tracking-wider">Total Earnings</span>
          <div className="text-2xl font-extrabold text-white mt-1">₹{data.earnings}</div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Cols: Monthly Earnings Bars Chart */}
        <div className="lg:col-span-2">
          <div className="glass p-6 sm:p-8 rounded-3xl border border-white/5 space-y-6">
            <h3 className="text-lg font-bold text-white">Monthly Earnings Progression</h3>
            
            {earningsData.length === 0 ? (
              <p className="text-slate-500 text-xs py-12 text-center">Complete paid mock bookings to construct earnings progression charts.</p>
            ) : (
              <div className="relative">
                {/* SVG Bar Chart */}
                <svg viewBox="0 0 600 240" className="w-full h-auto overflow-visible">
                  
                  {/* Grid Lines */}
                  {[0, 25, 50, 75, 100].map((v) => {
                    const y = 200 - 20 - (v * 160) / 100;
                    return (
                      <g key={v}>
                        <line x1="20" y1={y} x2="580" y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                        <text x="5" y={y + 4} fill="rgba(255,255,255,0.3)" className="text-[9px] font-light">
                          {Math.round((v * maxEarn) / 100)}
                        </text>
                      </g>
                    );
                  })}

                  {/* Render Bars */}
                  {earningsData.map((d, idx) => {
                    const barWidth = 35;
                    const spacing = 540 / earningsData.length;
                    const x = 30 + idx * spacing;
                    const barHeight = (d.amount * 160) / maxEarn;
                    const y = 180 - barHeight;

                    return (
                      <g key={idx}>
                        {/* Bar Rect */}
                        <rect
                          x={x - barWidth / 2}
                          y={y}
                          width={barWidth}
                          height={barHeight}
                          rx="6"
                          fill="#A78BFA"
                          className="hover:fill-accent-violet transition duration-300"
                        />
                        
                        {/* Hover amount text */}
                        <text
                          x={x}
                          y={y - 8}
                          textAnchor="middle"
                          fill="#ffffff"
                          className="text-[9px] font-bold"
                        >
                          ₹{d.amount}
                        </text>

                        {/* Label Date */}
                        <text
                          x={x}
                          y="204"
                          textAnchor="middle"
                          fill="rgba(255,255,255,0.4)"
                          className="text-[9px] font-light"
                        >
                          {d.date}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Quick Tips Summary */}
        <div className="lg:col-span-1">
          <div className="glass p-6 sm:p-8 rounded-3xl border border-white/5 space-y-6">
            <h3 className="text-lg font-bold text-white">Mentoring Insights</h3>
            
            <div className="space-y-4 text-xs text-slate-400 font-light leading-relaxed">
              <div>
                <strong className="text-white font-semibold">Boost Student Satisfaction:</strong>
                <p className="mt-1">Provide comprehensive evaluation notes (STAR format critique). Candidates value actionable technical tips.</p>
              </div>
              
              <div className="border-t border-white/5 pt-4">
                <strong className="text-white font-semibold">Maximize Earnings:</strong>
                <p className="mt-1">Increase slot variety (e.g. basic mentoring vs complete advanced simulations) to target different student brackets.</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default HRAnalytics;
