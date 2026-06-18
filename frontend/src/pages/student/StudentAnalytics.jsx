import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getStudentAnalytics } from '../../services/ai';

const StudentAnalytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await getStudentAnalytics();
        setData(res);
      } catch (err) {
        setError('Failed to fetch analytics statistics data.');
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <div className="h-10 w-10 border-4 border-t-transparent border-primary-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16 text-center">
        <div className="glass p-8 rounded-3xl border border-red-500/20 max-w-md mx-auto">
          <h3 className="text-xl font-bold text-red-400">Analytics Empty</h3>
          <p className="text-slate-400 text-xs mt-2">{error || 'To calculate growth statistics, please complete mock interview sessions.'}</p>
          <Link to="/student/dashboard" className="mt-6 inline-block bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition">
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // Calculate overall performance
  const overallAvg = Math.round((data.technical_average + data.communication_average + data.behavioral_average) / 3);

  // SVG Chart Coordinates Helper
  const buildSvgPath = (points, width = 600, height = 200) => {
    if (points.length < 2) return '';
    const maxVal = 100;
    const padding = 20;
    const chartHeight = height - padding * 2;
    const chartWidth = width - padding * 2;
    
    return points.map((p, idx) => {
      const x = padding + (idx * chartWidth) / (points.length - 1);
      const y = height - padding - (p * chartHeight) / maxVal;
      return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');
  };

  const trendData = data.monthly_trend || [];
  const overallPoints = trendData.map(t => t.overall);
  const techPoints = trendData.map(t => t.technical);
  const commPoints = trendData.map(t => t.communication);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16">
      
      {/* Header */}
      <div className="mb-10 text-center md:text-left">
        <h1 className="text-4xl font-extrabold text-white tracking-tight">
          Student Performance <span className="text-gradient">Analytics</span>
        </h1>
        <p className="text-slate-400 text-sm mt-2">
          Track interview readiness, technical expertise metrics, and monthly improvement statistics.
        </p>
      </div>

      {/* Metrics widgets */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        
        {/* Total Interviews */}
        <div className="glass p-5 rounded-2xl border border-white/5">
          <span className="text-slate-500 text-[10px] font-semibold uppercase tracking-wider">Mocks Conducted</span>
          <div className="text-2xl font-extrabold text-white mt-1">{data.interviews_completed} Sessions</div>
        </div>

        {/* Technical Score */}
        <div className="glass p-5 rounded-2xl border border-white/5 border-l-4 border-l-primary-500">
          <span className="text-slate-500 text-[10px] font-semibold uppercase tracking-wider">Technical Avg</span>
          <div className="text-2xl font-extrabold text-white mt-1">{data.technical_average}%</div>
        </div>

        {/* Communication Score */}
        <div className="glass p-5 rounded-2xl border border-white/5 border-l-4 border-l-accent-emerald">
          <span className="text-slate-500 text-[10px] font-semibold uppercase tracking-wider">Communication Avg</span>
          <div className="text-2xl font-extrabold text-white mt-1">{data.communication_average}%</div>
        </div>

        {/* Behavioral Score */}
        <div className="glass p-5 rounded-2xl border border-white/5 border-l-4 border-l-accent-coral">
          <span className="text-slate-500 text-[10px] font-semibold uppercase tracking-wider">Behavioral Avg</span>
          <div className="text-2xl font-extrabold text-white mt-1">{data.behavioral_average}%</div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Cols: Trend Chart */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass p-6 sm:p-8 rounded-3xl border border-white/5 space-y-6">
            <h3 className="text-lg font-bold text-white">Interview Performance Trend</h3>
            
            {trendData.length < 2 ? (
              <p className="text-slate-500 text-xs py-12 text-center">Complete at least 2 mock sessions to render trend charts.</p>
            ) : (
              <div className="relative">
                {/* SVG Chart */}
                <svg viewBox="0 0 600 220" className="w-full h-auto overflow-visible">
                  {/* Grid Lines */}
                  {[0, 25, 50, 75, 100].map((v) => {
                    const y = 200 - 20 - (v * 160) / 100;
                    return (
                      <g key={v}>
                        <line x1="20" y1={y} x2="580" y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                        <text x="5" y={y + 4} fill="rgba(255,255,255,0.3)" className="text-[10px] font-light">{v}</text>
                      </g>
                    );
                  })}

                  {/* Gradient definition */}
                  <defs>
                    <linearGradient id="primary-grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366F1" stopOpacity="0.2"/>
                      <stop offset="100%" stopColor="#6366F1" stopOpacity="0"/>
                    </linearGradient>
                  </defs>

                  {/* Shaded Area for Technical */}
                  {techPoints.length > 1 && (
                    <path
                      d={`${buildSvgPath(techPoints)} L 580 180 L 20 180 Z`}
                      fill="url(#primary-grad)"
                    />
                  )}

                  {/* Paths */}
                  {techPoints.length > 1 && (
                    <path
                      d={buildSvgPath(techPoints)}
                      fill="none"
                      stroke="#6366F1"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                    />
                  )}

                  {commPoints.length > 1 && (
                    <path
                      d={buildSvgPath(commPoints)}
                      fill="none"
                      stroke="#34D399"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                  )}

                  {/* X Axis Labels */}
                  {trendData.map((t, idx) => {
                    const x = 20 + (idx * 560) / (trendData.length - 1);
                    return (
                      <text key={idx} x={x} y="212" textAnchor="middle" fill="rgba(255,255,255,0.4)" className="text-[9px] font-light">
                        {t.date}
                      </text>
                    );
                  })}
                </svg>

                {/* Legend */}
                <div className="flex gap-4 justify-center text-[10px] mt-4">
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <span className="h-2 w-2 rounded-full bg-primary-500" />
                    Technical Skills
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <span className="h-2 w-2 rounded-full bg-accent-emerald" />
                    Communication Skills
                  </div>
                </div>

              </div>
            )}
          </div>
        </div>

        {/* Right Col: Readiness scores */}
        <div className="lg:col-span-1">
          <div className="glass p-6 sm:p-8 rounded-3xl border border-white/5 space-y-6">
            <h3 className="text-lg font-bold text-white">Target Roles Readiness</h3>
            
            {data.readiness_trend.length === 0 ? (
              <p className="text-slate-500 text-xs py-12 text-center">No target role readiness logs calculated yet.</p>
            ) : (
              <div className="space-y-4">
                {data.readiness_trend.map((g, idx) => (
                  <div key={idx} className="bg-dark-950/60 p-4 border border-white/5 rounded-2xl">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-white font-bold text-xs capitalize">{g.target_role}</span>
                      <span className="text-primary-400 font-extrabold text-xs">{g.score}%</span>
                    </div>
                    <div className="h-2 w-full bg-dark-900 rounded-full overflow-hidden">
                      <div className="h-full bg-primary-600 rounded-full" style={{ width: `${g.score}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default StudentAnalytics;
