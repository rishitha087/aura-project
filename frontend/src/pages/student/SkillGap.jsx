import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getSkillGapReports, triggerSkillGapAnalysis } from '../../services/ai';

const SkillGapPage = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [targetRole, setTargetRole] = useState('java backend developer');

  const fetchReports = async () => {
    try {
      const data = await getSkillGapReports();
      setReports(data);
    } catch (err) {
      setError('Failed to fetch previous skill gap reports.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);
    try {
      const report = await triggerSkillGapAnalysis(targetRole);
      setSuccess(`Skill gap analysis for '${targetRole}' generated!`);
      // Re-fetch reports
      const data = await getSkillGapReports();
      setReports(data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Analysis generation failed.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <div className="h-10 w-10 border-4 border-t-transparent border-primary-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  const latestReport = reports[0];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16">
      
      {/* Header */}
      <div className="mb-10 text-center md:text-left">
        <h1 className="text-4xl font-extrabold text-white tracking-tight">
          Skill Gap <span className="text-gradient">Analysis</span>
        </h1>
        <p className="text-slate-400 text-sm mt-2">
          Compare your current core skills against required parameters for target industry profiles.
        </p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-2xl text-xs mb-6 text-center">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-accent-emerald/10 border border-accent-emerald/20 text-accent-emerald p-4 rounded-2xl text-xs mb-6 text-center">
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Side: Create / Trigger Analysis */}
        <div className="lg:col-span-1">
          <div className="glass p-6 sm:p-8 rounded-3xl border border-white/5 space-y-6">
            <h3 className="text-lg font-bold text-white pb-3 border-b border-white/5">Analyze New Role</h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-slate-400 text-xs font-semibold mb-2">Select Target Job Title</label>
                <select
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  className="w-full bg-dark-950 border border-white/10 rounded-xl px-4 py-3 text-slate-100 text-xs focus:outline-none focus:border-primary-500"
                >
                  <option value="java backend developer">Java Backend Developer</option>
                  <option value="frontend developer">Frontend Developer</option>
                  <option value="fullstack developer">Fullstack Developer</option>
                  <option value="data analyst">Data Analyst</option>
                  <option value="software engineer">Software Engineer</option>
                  <option value="qa engineer">QA automation Engineer</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3.5 rounded-xl text-xs shadow-md transition disabled:opacity-50 mt-4 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <div className="h-4 w-4 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
                ) : (
                  'Generate Skill Report'
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Right Side: Latest report analysis details */}
        <div className="lg:col-span-2 space-y-8">
          {!latestReport ? (
            <div className="glass p-12 rounded-3xl border border-white/5 text-center">
              <svg className="w-12 h-12 text-slate-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <h4 className="text-white font-bold">No gap analyses compiled</h4>
              <p className="text-slate-500 text-xs mt-1">Select a target role on the left sidebar and trigger a report.</p>
            </div>
          ) : (
            <>
              {/* Overall Match gauge */}
              <div className="glass p-6 sm:p-8 rounded-3xl border border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">Active target role</span>
                  <h3 className="text-2xl font-extrabold text-white mt-1 capitalize">{latestReport.target_role}</h3>
                  <p className="text-slate-400 text-xs mt-1">
                    Based on your profile skills tags compared with essential frameworks.
                  </p>
                </div>
                
                <div className="flex items-center gap-4 bg-dark-950/60 border border-white/5 px-6 py-4 rounded-2xl flex-shrink-0">
                  <div className="text-left">
                    <div className="text-slate-500 text-[10px] font-semibold uppercase tracking-wider">Readiness Match</div>
                    <div className="text-2xl font-extrabold text-white mt-0.5">{latestReport.readiness_score}%</div>
                  </div>
                  <div className="h-10 w-px bg-white/10" />
                  <div className="w-16 bg-dark-900 rounded-full h-2.5 overflow-hidden">
                    <div className="bg-primary-500 h-full rounded-full" style={{ width: `${latestReport.readiness_score}%` }}></div>
                  </div>
                </div>
              </div>

              {/* Missing Skills list */}
              <div className="glass p-6 sm:p-8 rounded-3xl border border-white/5">
                <h3 className="text-lg font-bold text-white mb-4">Detected Skill Gaps</h3>
                
                {latestReport.missing_skills.length === 0 ? (
                  <p className="text-accent-emerald text-xs font-semibold py-2">✓ Outstanding! You possess all core required skills for this target role!</p>
                ) : (
                  <div className="space-y-4">
                    <p className="text-slate-400 text-xs">
                      Learning the following frameworks will bridge your skill gap and increase your mock readiness score:
                    </p>
                    <div className="flex flex-wrap gap-2.5">
                      {latestReport.missing_skills.map((skill, idx) => (
                        <span key={idx} className="bg-accent-coral/10 border border-accent-coral/20 text-accent-coral text-xs font-semibold px-3 py-1.5 rounded-xl">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Navigation helpers */}
              <div className="flex gap-4">
                <Link
                  to="/student/roadmap"
                  className="flex-1 bg-primary-600 hover:bg-primary-700 text-white font-bold py-4 rounded-2xl text-xs transition shadow text-center"
                >
                  Generate Roadmap Study Guide
                </Link>
                <Link
                  to="/student/recommended-hrs"
                  className="flex-1 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold py-4 rounded-2xl text-xs transition shadow-lg text-center"
                >
                  Find Recommended Recruiters
                </Link>
              </div>
            </>
          )}
        </div>

      </div>
    </div>
  );
};

export default SkillGapPage;
