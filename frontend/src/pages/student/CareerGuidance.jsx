import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getCareerGuidance } from '../../services/ai';

const CareerGuidancePage = () => {
  const [guidance, setGuidance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchGuidance = async () => {
      try {
        const data = await getCareerGuidance();
        setGuidance(data);
      } catch (err) {
        setError('Failed to retrieve AI career recommendations.');
      } finally {
        setLoading(false);
      }
    };
    fetchGuidance();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <div className="h-10 w-10 border-4 border-t-transparent border-primary-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !guidance) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16 text-center">
        <div className="glass p-8 rounded-3xl border border-red-500/20 max-w-md mx-auto">
          <h3 className="text-xl font-bold text-red-400">Guidance Unavailable</h3>
          <p className="text-slate-400 text-xs mt-2">{error || 'Could not compile career suggestions. Complete a mock session first.'}</p>
          <Link to="/student/dashboard" className="mt-6 inline-block bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition">
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16">
      
      {/* Header */}
      <div className="mb-10 text-center md:text-left">
        <h1 className="text-4xl font-extrabold text-white tracking-tight">
          AI Career <span className="text-gradient">Guidance</span>
        </h1>
        <p className="text-slate-400 text-sm mt-2">
          Inspect automatically generated job profile matches and readiness scores calculated from your portfolio and mock interview metrics.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Col: Readiness Summary Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glass p-6 sm:p-8 rounded-3xl border border-white/5 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-primary-500/5 rounded-full blur-3xl pointer-events-none"></div>
            
            <h3 className="text-lg font-bold text-white mb-6">Career Readiness</h3>

            {/* score circle */}
            <div className="relative w-36 h-36 mx-auto flex items-center justify-center mb-8">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="72" cy="72" r="62" className="stroke-dark-900" strokeWidth="6" fill="transparent" />
                <circle
                  cx="72"
                  cy="72"
                  r="62"
                  className="stroke-primary-500"
                  strokeWidth="6"
                  fill="transparent"
                  strokeDasharray={390}
                  strokeDashoffset={390 - (390 * guidance.readiness_score) / 100}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-3xl font-extrabold text-white">{guidance.readiness_score}%</span>
                <span className="text-slate-500 text-[9px] font-semibold uppercase tracking-wider mt-0.5">Readiness</span>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed text-left p-4 bg-dark-950/60 border border-white/5 rounded-2xl">
              This score aggregates framework expertise keywords on your resume alongside historical mock evaluations scores.
            </p>
          </div>
        </div>

        {/* Right Col: Matches and Improvement Areas */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Matches list */}
          <div className="glass p-6 sm:p-8 rounded-3xl border border-white/5">
            <h3 className="text-lg font-bold text-white mb-6">Recommended Job Profiles</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {guidance.recommended_roles.map((rec, idx) => (
                <div key={idx} className="bg-dark-950/60 border border-white/5 p-5 rounded-2xl flex justify-between items-center hover:border-primary-500/20 transition">
                  <div>
                    <h4 className="text-white font-bold text-sm truncate max-w-[180px]">{rec.role}</h4>
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Suggested Track</span>
                  </div>
                  
                  <div className="text-right">
                    <span className="text-primary-400 font-extrabold text-base">{rec.match_percentage}%</span>
                    <div className="text-[9px] text-slate-500 font-medium">Match</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Core Growth Targets */}
          <div className="glass p-6 sm:p-8 rounded-3xl border border-white/5">
            <h3 className="text-lg font-bold text-white mb-4">Core Growth Targets</h3>
            <ul className="space-y-3">
              {guidance.improvement_areas.map((area, idx) => (
                <li key={idx} className="bg-primary-500/5 border border-primary-500/10 p-3.5 rounded-xl text-slate-300 text-xs leading-relaxed flex items-center gap-3">
                  <span className="h-2 w-2 rounded-full bg-primary-400 flex-shrink-0" />
                  {area}
                </li>
              ))}
            </ul>
          </div>

        </div>

      </div>
    </div>
  );
};

export default CareerGuidancePage;
