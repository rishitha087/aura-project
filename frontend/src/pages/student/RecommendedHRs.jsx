import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getRecommendedHRs } from '../../services/ai';
import { getFileUrl } from '../../services/api';

const RecommendedHRsPage = () => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchRecs = async () => {
      try {
        const data = await getRecommendedHRs();
        setRecommendations(data);
      } catch (err) {
        setError('Failed to fetch matched HR recommendations.');
      } finally {
        setLoading(false);
      }
    };
    fetchRecs();
  }, []);

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
      <div className="mb-10 text-center md:text-left">
        <h1 className="text-4xl font-extrabold text-white tracking-tight">
          Matched <span className="text-gradient">HR Recommendations</span>
        </h1>
        <p className="text-slate-400 text-sm mt-2">
          Discover vetted recruiting experts matching your career aspirations. Match score evaluates designation, company, and industry ratings.
        </p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-2xl text-xs mb-6 text-center">
          {error}
        </div>
      )}

      {recommendations.length === 0 ? (
        <div className="glass p-12 rounded-3xl border border-white/5 text-center max-w-2xl mx-auto">
          <svg className="w-12 h-12 text-slate-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          <h3 className="text-lg font-bold text-white">No Recommendations compiled</h3>
          <p className="text-slate-400 text-xs mt-2">
            Make sure we have verified HR professionals registered and onboarded on the admin panel first!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recommendations.map((rec, idx) => {
            const hr = rec.hr_profile;
            const name = hr.user_details?.full_name || 'Verified Expert';
            const company = hr.company_name || 'Recruiter';
            const designation = hr.designation || 'HR Professional';
            const match = rec.match_percentage || 50;
            const photo = hr.profile_photo;
            
            return (
              <div key={idx} className="glass p-6 rounded-3xl border border-white/5 flex flex-col justify-between glass-hover">
                <div>
                  
                  {/* Match Banner tag */}
                  <div className="flex justify-between items-start mb-4">
                    <span className="bg-primary-500/15 border border-primary-500/35 text-primary-300 text-[10px] font-semibold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      {match}% Match
                    </span>
                    <span className="bg-accent-emerald/10 border border-accent-emerald/20 p-0.5 rounded-full text-accent-emerald" title="Verified Recruiter">
                      <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                      </svg>
                    </span>
                  </div>

                  {/* Header info */}
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full bg-dark-950 border border-white/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {photo ? (
                        <img src={getFileUrl(photo)} alt={name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white text-base font-extrabold bg-gradient-to-br from-primary-600 to-accent-violet">
                          {name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-extrabold text-white text-sm truncate">{name}</h3>
                      <p className="text-slate-400 text-[10px] truncate">{designation} at <strong className="text-slate-300 font-medium">{company}</strong></p>
                    </div>
                  </div>

                  {/* Bio summary snippet */}
                  <p className="text-slate-400 text-xs leading-relaxed line-clamp-3 mb-4 font-light">
                    {hr.bio || 'No professional overview has been written.'}
                  </p>
                </div>

                {/* Footer action */}
                <div className="border-t border-white/5 pt-4 mt-2 flex items-center justify-between text-xs">
                  <span className="text-[10px] text-slate-500">{hr.years_of_experience || 0} Yrs Experience</span>
                  <Link
                    to={`/hr/${hr.id}`}
                    className="bg-primary-600 hover:bg-primary-700 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-md transition"
                  >
                    View slots
                  </Link>
                </div>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default RecommendedHRsPage;
