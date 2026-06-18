import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getInterviewReport } from '../../services/ai';

const InterviewReportPage = () => {
  const { id } = useParams();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const data = await getInterviewReport(id);
        setReport(data);
      } catch (err) {
        setError(err.response?.data?.detail || 'Failed to retrieve AI interview evaluation report.');
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <div className="h-10 w-10 border-4 border-t-transparent border-primary-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16 text-center">
        <div className="glass p-8 rounded-3xl border border-red-500/20 max-w-md mx-auto">
          <h3 className="text-xl font-bold text-red-400">Report Unavailable</h3>
          <p className="text-slate-400 text-xs mt-2">{error || 'Could not find details for this interview session.'}</p>
          <Link to="/student/dashboard" className="mt-6 inline-block bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition">
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const overallScore = Math.round((report.technical_score + report.communication_score + report.behavioral_score) / 3);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16">
      
      {/* Back to Dashboard */}
      <div className="mb-6">
        <Link to="/student/dashboard" className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-xs transition">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Dashboard
        </Link>
      </div>

      <div className="mb-10 text-center md:text-left">
        <h1 className="text-4xl font-extrabold text-white tracking-tight">
          AI Interview <span className="text-gradient">Report</span>
        </h1>
        <p className="text-slate-400 text-sm mt-2">
          Review complete performance feedback calculated from recruiter marks and career alignment metrics.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Col: Scores Breakdown card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glass p-6 sm:p-8 rounded-3xl border border-white/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-primary-500/5 rounded-full blur-3xl pointer-events-none"></div>
            
            <h3 className="text-lg font-bold text-white text-center mb-6">Performance Scores</h3>

            {/* Overall Score Radial */}
            <div className="relative w-36 h-36 mx-auto flex items-center justify-center mb-8">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="72" cy="72" r="62" className="stroke-dark-900" strokeWidth="6" fill="transparent" />
                <circle
                  cx="72"
                  cy="72"
                  r="62"
                  className="stroke-accent-violet"
                  strokeWidth="6"
                  fill="transparent"
                  strokeDasharray={390}
                  strokeDashoffset={390 - (390 * overallScore) / 100}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-3xl font-extrabold text-white">{overallScore}%</span>
                <span className="text-slate-500 text-[9px] font-semibold uppercase tracking-wider">Overall</span>
              </div>
            </div>

            {/* Sub-scores list */}
            <div className="space-y-4 pt-4 border-t border-white/5">
              
              {/* Technical */}
              <div>
                <div className="flex justify-between text-xs text-slate-400 mb-1.5">
                  <span>Technical Skills</span>
                  <span className="text-white font-bold">{report.technical_score}%</span>
                </div>
                <div className="h-2 w-full bg-dark-900 rounded-full overflow-hidden">
                  <div className="h-full bg-primary-500 rounded-full" style={{ width: `${report.technical_score}%` }}></div>
                </div>
              </div>

              {/* Communication */}
              <div>
                <div className="flex justify-between text-xs text-slate-400 mb-1.5">
                  <span>Communication Skills</span>
                  <span className="text-white font-bold">{report.communication_score}%</span>
                </div>
                <div className="h-2 w-full bg-dark-900 rounded-full overflow-hidden">
                  <div className="h-full bg-accent-emerald rounded-full" style={{ width: `${report.communication_score}%` }}></div>
                </div>
              </div>

              {/* Behavioral */}
              <div>
                <div className="flex justify-between text-xs text-slate-400 mb-1.5">
                  <span>Behavioral & Confidence</span>
                  <span className="text-white font-bold">{report.behavioral_score}%</span>
                </div>
                <div className="h-2 w-full bg-dark-900 rounded-full overflow-hidden">
                  <div className="h-full bg-accent-coral rounded-full" style={{ width: `${report.behavioral_score}%` }}></div>
                </div>
              </div>

            </div>

          </div>
        </div>

        {/* Right Col: Strengths, Weaknesses, Recommendations lists */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Strengths */}
          <div className="glass p-6 sm:p-8 rounded-3xl border border-white/5">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-accent-emerald animate-pulse" />
              Key Strengths
            </h3>
            <ul className="space-y-3">
              {report.strengths.map((str, idx) => (
                <li key={idx} className="bg-accent-emerald/5 border border-accent-emerald/10 p-3 rounded-xl text-slate-300 text-xs leading-relaxed flex gap-2">
                  <span className="text-accent-emerald font-bold">•</span> {str}
                </li>
              ))}
            </ul>
          </div>

          {/* Weaknesses */}
          <div className="glass p-6 sm:p-8 rounded-3xl border border-white/5">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-accent-coral animate-pulse" />
              Key Weaknesses
            </h3>
            <ul className="space-y-3">
              {report.weaknesses.map((weak, idx) => (
                <li key={idx} className="bg-accent-coral/5 border border-accent-coral/10 p-3 rounded-xl text-slate-300 text-xs leading-relaxed flex gap-2">
                  <span className="text-accent-coral font-bold">•</span> {weak}
                </li>
              ))}
            </ul>
          </div>

          {/* Recommendations */}
          <div className="glass p-6 sm:p-8 rounded-3xl border border-white/5">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-primary-500 animate-pulse" />
              Actionable Recommendations
            </h3>
            <ul className="space-y-3">
              {report.recommendations.map((rec, idx) => (
                <li key={idx} className="bg-primary-500/5 border border-primary-500/10 p-3 rounded-xl text-slate-300 text-xs leading-relaxed flex gap-2">
                  <span className="text-primary-400 font-bold">•</span> {rec}
                </li>
              ))}
            </ul>
          </div>

        </div>

      </div>
    </div>
  );
};

export default InterviewReportPage;
