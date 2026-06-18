import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getResumeAnalysis, triggerResumeAnalysis } from '../../services/ai';

const ResumeAnalysisPage = () => {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('strengths');

  const fetchAnalysis = async () => {
    try {
      const data = await getResumeAnalysis();
      setAnalysis(data);
    } catch (err) {
      if (err.response?.status !== 404) {
        setError('Failed to fetch resume analysis report.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalysis();
  }, []);

  const handleStartAnalysis = async () => {
    setError('');
    setAnalyzing(true);
    try {
      const data = await triggerResumeAnalysis();
      setAnalysis(data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Resume analysis failed. Please verify that your resume is uploaded in your profile.');
    } finally {
      setAnalyzing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <div className="h-10 w-10 border-4 border-t-transparent border-primary-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16">
      
      {/* Header */}
      <div className="mb-10 text-center md:text-left flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight">
            AI Resume <span className="text-gradient">Analysis</span>
          </h1>
          <p className="text-slate-400 text-sm mt-2">
            Get instant, constructive feedback and optimize your resume keywords for applicant tracking systems.
          </p>
        </div>
        
        {analysis && (
          <button
            onClick={handleStartAnalysis}
            disabled={analyzing}
            className="bg-white/5 border border-white/10 hover:bg-white/10 text-white text-xs font-bold px-5 py-3 rounded-xl transition shadow-md disabled:opacity-50"
          >
            {analyzing ? 'Re-analyzing...' : 'Re-analyze Resume'}
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-2xl text-xs mb-6 text-center max-w-2xl mx-auto">
          {error}
        </div>
      )}

      {!analysis ? (
        // Initial Empty State
        <div className="glass p-12 rounded-3xl border border-white/5 text-center max-w-2xl mx-auto relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/5 rounded-full blur-[80px] pointer-events-none"></div>
          
          <svg className="w-16 h-16 text-slate-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="text-xl font-bold text-white">No Resume Analysis Report</h3>
          <p className="text-slate-400 text-xs mt-2 max-w-md mx-auto leading-relaxed">
            Run our Gemini-powered analyzer to review your uploaded CV structure, identify keyword matches, and inspect structural recommendations.
          </p>
          
          <div className="mt-8 flex justify-center gap-4">
            <Link
              to="/student/dashboard"
              className="bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 text-xs font-bold px-6 py-3 rounded-xl transition"
            >
              Verify Resume Upload
            </Link>
            <button
              onClick={handleStartAnalysis}
              disabled={analyzing}
              className="bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold px-6 py-3 rounded-xl transition shadow-lg flex items-center gap-2 disabled:opacity-50"
            >
              {analyzing ? (
                <>
                  <div className="h-4 w-4 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
                  Analyzing...
                </>
              ) : (
                'Start AI Analysis'
              )}
            </button>
          </div>
        </div>
      ) : (
        // Analysis report details
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Col: Radial Gauge Card */}
          <div className="lg:col-span-1">
            <div className="glass p-6 sm:p-8 rounded-3xl border border-white/5 text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-primary-500/5 rounded-full blur-3xl pointer-events-none"></div>
              
              <h3 className="text-lg font-bold text-white mb-6">Overall Score</h3>

              {/* Radial Meter */}
              <div className="relative w-40 h-40 mx-auto flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="80"
                    cy="80"
                    r="70"
                    className="stroke-dark-900"
                    strokeWidth="8"
                    fill="transparent"
                  />
                  <circle
                    cx="80"
                    cy="80"
                    r="70"
                    className="stroke-primary-500"
                    strokeWidth="8"
                    fill="transparent"
                    strokeDasharray={440}
                    strokeDashoffset={440 - (440 * analysis.resume_score) / 100}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-4xl font-extrabold text-white">{analysis.resume_score}</span>
                  <span className="text-slate-500 text-[10px] font-semibold uppercase tracking-wider mt-0.5">Rating</span>
                </div>
              </div>

              <div className="mt-8 p-4 bg-dark-950/60 border border-white/5 rounded-2xl text-xs text-slate-400 leading-relaxed text-left">
                <div className="font-bold text-white mb-1">Score Breakdown:</div>
                Scores above 80 indicate high alignment with standard IT recruitment templates. Complete other dashboard objectives to increase your visibility.
              </div>
            </div>
          </div>

          {/* Right Col: Tabs and list details */}
          <div className="lg:col-span-2 space-y-6">
            <div className="glass p-6 sm:p-8 rounded-3xl border border-white/5">
              
              {/* Tab Selector */}
              <div className="flex gap-2 mb-6 bg-dark-950/40 p-1 rounded-xl w-fit border border-white/5">
                {['strengths', 'weaknesses', 'recommendations'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition ${
                      activeTab === tab
                        ? 'bg-primary-600 text-white shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Lists */}
              <div className="min-h-[250px]">
                {activeTab === 'strengths' && (
                  <ul className="space-y-4">
                    {analysis.strengths.map((str, idx) => (
                      <li key={idx} className="bg-accent-emerald/5 border border-accent-emerald/10 p-4 rounded-xl flex items-start gap-3">
                        <svg className="w-5 h-5 text-accent-emerald flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-slate-300 text-xs leading-relaxed">{str}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {activeTab === 'weaknesses' && (
                  <ul className="space-y-4">
                    {analysis.weaknesses.map((weak, idx) => (
                      <li key={idx} className="bg-accent-coral/5 border border-accent-coral/10 p-4 rounded-xl flex items-start gap-3">
                        <svg className="w-5 h-5 text-accent-coral flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <span className="text-slate-300 text-xs leading-relaxed">{weak}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {activeTab === 'recommendations' && (
                  <ul className="space-y-4">
                    {analysis.recommendations.map((rec, idx) => (
                      <li key={idx} className="bg-primary-500/5 border border-primary-500/10 p-4 rounded-xl flex items-start gap-3">
                        <svg className="w-5 h-5 text-primary-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-slate-300 text-xs leading-relaxed">{rec}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div className="flex gap-4">
              <Link
                to="/student/skill-gap"
                className="flex-1 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold py-4 rounded-2xl text-xs transition shadow text-center"
              >
                Analyze Skill Gaps
              </Link>
              <Link
                to="/student/roadmap"
                className="flex-1 bg-primary-600 hover:bg-primary-700 text-white font-bold py-4 rounded-2xl text-xs transition shadow-lg text-center"
              >
                View Learning Roadmap
              </Link>
            </div>
          </div>

        </div>
      )}
    </div>
  );
};

export default ResumeAnalysisPage;
