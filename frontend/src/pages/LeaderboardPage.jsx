import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getLeaderboard } from '../services/extensions';

const LeaderboardPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('rating'); // 'rating' or 'bookings'

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const board = await getLeaderboard();
        setData(board);
      } catch (err) {
        setError('Failed to load leaderboard statistics.');
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <div className="h-10 w-10 border-4 border-t-transparent border-primary-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  const listToRender = activeTab === 'rating' ? data?.top_rated : data?.most_booked;

  return (
    <div className="min-h-screen bg-dark-950 pt-28 pb-16 px-4 flex flex-col items-center relative overflow-hidden text-slate-200">
      {/* Glow effect */}
      <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] bg-accent-violet/5 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="max-w-4xl w-full relative z-10 space-y-8">
        
        {/* Header */}
        <div className="text-center sm:text-left mb-6">
          <h1 className="text-4xl font-extrabold text-white tracking-tight">
            Mentor <span className="text-gradient">Leaderboard</span>
          </h1>
          <p className="text-slate-400 text-xs mt-1.5 font-medium">Meet the highest-rated and most active HR mentors on the platform.</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm text-center">
            {error}
          </div>
        )}

        {/* Tabs switcher */}
        <div className="flex items-center gap-2 p-1.5 bg-dark-900/60 border border-white/5 rounded-2xl max-w-sm mx-auto sm:mx-0">
          <button
            onClick={() => setActiveTab('rating')}
            className={`flex-1 text-xs font-bold py-2.5 rounded-xl transition ${
              activeTab === 'rating'
                ? 'bg-accent-violet text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            ⭐ Top Rated HRs
          </button>
          <button
            onClick={() => setActiveTab('bookings')}
            className={`flex-1 text-xs font-bold py-2.5 rounded-xl transition ${
              activeTab === 'bookings'
                ? 'bg-accent-violet text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            🔥 Most Booked HRs
          </button>
        </div>

        {/* Leaderboard Table Card */}
        <div className="glass rounded-3xl border border-white/5 shadow-2xl p-6 overflow-hidden">
          <div className="space-y-4">
            {listToRender?.length === 0 ? (
              <p className="text-slate-600 text-sm text-center py-8">No leaderboard data available.</p>
            ) : (
              listToRender?.map((hr, index) => (
                <div 
                  key={hr.hr_id} 
                  className="flex flex-col sm:flex-row items-center justify-between p-4 bg-dark-900/40 hover:bg-dark-900/60 border border-white/5 hover:border-white/10 rounded-2xl transition duration-300 gap-4"
                >
                  {/* Left: Rank, Avatar, details */}
                  <div className="flex items-center gap-4 w-full sm:w-auto">
                    {/* Rank Badge */}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                      index === 0 
                        ? 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/30'
                        : index === 1 
                        ? 'bg-slate-300/20 text-slate-300 border border-slate-300/30'
                        : index === 2 
                        ? 'bg-amber-700/20 text-amber-600 border border-amber-700/30'
                        : 'bg-dark-950 text-slate-500 border border-white/5'
                    }`}>
                      {index + 1}
                    </div>

                    {/* Avatar */}
                    <div className="w-12 h-12 rounded-xl bg-dark-950 border border-white/5 overflow-hidden flex-shrink-0 flex items-center justify-center">
                      {hr.profile_photo ? (
                        <img src={`http://localhost:8000${hr.profile_photo}`} alt={hr.full_name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-slate-600 text-sm font-bold">{hr.full_name.charAt(0)}</span>
                      )}
                    </div>

                    {/* Details */}
                    <div>
                      <h4 className="text-sm font-bold text-white leading-snug">{hr.full_name}</h4>
                      <p className="text-[10px] text-slate-500 mt-0.5">{hr.designation} &middot; <span className="text-slate-400">{hr.company_name}</span></p>
                    </div>
                  </div>

                  {/* Right: Metrics & CTA */}
                  <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto border-t sm:border-t-0 border-white/5 pt-3 sm:pt-0">
                    {activeTab === 'rating' ? (
                      <div className="text-left sm:text-right">
                        <span className="text-[10px] text-slate-500 block uppercase font-medium">Avg Rating</span>
                        <span className="text-sm font-black text-white flex items-center gap-1 mt-0.5">
                          ⭐ {hr.avg_rating}
                        </span>
                      </div>
                    ) : (
                      <div className="text-left sm:text-right">
                        <span className="text-[10px] text-slate-500 block uppercase font-medium">Completed Sessions</span>
                        <span className="text-sm font-black text-white mt-0.5 block">
                          🔥 {hr.booking_count}
                        </span>
                      </div>
                    )}

                    <Link 
                      to={`/student/hrs`} 
                      className="text-xs font-bold text-accent-violet hover:text-white border border-accent-violet/20 hover:border-accent-violet/40 bg-accent-violet/5 hover:bg-accent-violet/10 px-4 py-2 rounded-xl transition duration-300"
                    >
                      Book Slot
                    </Link>
                  </div>

                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default LeaderboardPage;
