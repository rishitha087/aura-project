import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getHRs, createBooking } from '../../services/student';
import { getFileUrl } from '../../services/api';

const BrowseHRs = () => {
  const navigate = useNavigate();
  const [hrs, setHrs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Expanded HR card state
  const [expandedHR, setExpandedHR] = useState(null);

  // Per-slot booking state: { slotId: { loading, error, success } }
  const [bookingState, setBookingState] = useState({});

  // Filters State
  const [search, setSearch] = useState('');
  const [expMin, setExpMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [sortBy, setSortBy] = useState('');

  const fetchHRsList = useCallback(async (params = {}) => {
    setLoading(true);
    setError('');
    try {
      const data = await getHRs(params);
      setHrs(data);
    } catch (err) {
      setError('Could not fetch HR professionals. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHRsList({});
  }, [fetchHRsList]);

  useEffect(() => {
    const params = {};
    if (search) params.search = search;
    if (expMin) params.exp_min = expMin;
    if (priceMax) params.price_max = priceMax;
    if (sortBy) params.sort_by = sortBy;
    fetchHRsList(params);
  }, [sortBy]);

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    const params = {};
    if (search) params.search = search;
    if (expMin) params.exp_min = expMin;
    if (priceMax) params.price_max = priceMax;
    if (sortBy) params.sort_by = sortBy;
    fetchHRsList(params);
  };

  const handleClearFilters = () => {
    setSearch('');
    setExpMin('');
    setPriceMax('');
    setSortBy('');
    fetchHRsList({});
  };

  const toggleExpand = (hrId) => {
    setExpandedHR(prev => (prev === hrId ? null : hrId));
  };

  const handleBookSlot = async (slotId) => {
    setBookingState(prev => ({
      ...prev,
      [slotId]: { loading: true, error: '', success: false }
    }));

    try {
      const booking = await createBooking(slotId);
      setBookingState(prev => ({
        ...prev,
        [slotId]: { loading: false, error: '', success: true, bookingId: booking.id }
      }));
      // Redirect to checkout/session after short delay
      setTimeout(() => {
        navigate(`/booking/${slotId}`);
      }, 800);
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to book this slot. Please try again.';
      setBookingState(prev => ({
        ...prev,
        [slotId]: { loading: false, error: msg, success: false }
      }));
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16">
      
      {/* Header */}
      <div className="mb-10 text-center md:text-left">
        <h1 className="text-4xl font-extrabold text-white tracking-tight">
          Browse <span className="text-gradient">HR Professionals</span>
        </h1>
        <p className="text-slate-400 text-sm mt-2 max-w-2xl">
          Connect with verified industry recruiters. Click any HR card to see their available slots and book directly.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Left Side: Filter Form */}
        <div className="lg:col-span-1">
          <form onSubmit={handleFilterSubmit} className="glass p-6 rounded-3xl border border-white/5 sticky top-28 space-y-6">
            <h3 className="text-lg font-bold text-white pb-3 border-b border-white/5">Filters</h3>
            
            <div>
              <label className="block text-slate-400 text-xs font-semibold mb-2">Search</label>
              <input
                type="text"
                placeholder="Name, company, keyword..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-dark-950 border border-white/10 rounded-xl px-4 py-2.5 text-slate-100 text-xs focus:outline-none focus:border-primary-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 text-xs font-semibold mb-2">Min Experience (Years)</label>
              <input
                type="number"
                min="0"
                placeholder="e.g. 3"
                value={expMin}
                onChange={(e) => setExpMin(e.target.value)}
                className="w-full bg-dark-950 border border-white/10 rounded-xl px-4 py-2.5 text-slate-100 text-xs focus:outline-none focus:border-primary-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 text-xs font-semibold mb-2">Max Slot Price (₹)</label>
              <input
                type="number"
                min="0"
                placeholder="e.g. 499"
                value={priceMax}
                onChange={(e) => setPriceMax(e.target.value)}
                className="w-full bg-dark-950 border border-white/10 rounded-xl px-4 py-2.5 text-slate-100 text-xs focus:outline-none focus:border-primary-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 text-xs font-semibold mb-2">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full bg-dark-950 border border-white/10 rounded-xl px-4 py-2.5 text-slate-100 text-xs focus:outline-none focus:border-primary-500"
              >
                <option value="">Default</option>
                <option value="price_low">Price: Low to High</option>
                <option value="price_high">Price: High to Low</option>
                <option value="experience">Experience: High to Low</option>
              </select>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={handleClearFilters}
                className="flex-1 bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 font-semibold py-2.5 rounded-xl text-xs transition"
              >
                Reset
              </button>
              <button
                type="submit"
                className="flex-1 bg-primary-600 hover:bg-primary-700 text-white font-semibold py-2.5 rounded-xl text-xs shadow-md transition"
              >
                Apply
              </button>
            </div>
          </form>
        </div>

        {/* Right Side: Grid list */}
        <div className="lg:col-span-3">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-2xl text-sm mb-6 text-center">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <div className="h-10 w-10 border-4 border-t-transparent border-primary-500 rounded-full animate-spin"></div>
              <p className="text-slate-500 text-xs">Finding verified interviewers...</p>
            </div>
          ) : hrs.length === 0 ? (
            <div className="glass p-12 rounded-3xl border border-white/5 text-center">
              <svg className="w-12 h-12 text-slate-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <h3 className="text-lg font-bold text-white">No interviewers found</h3>
              <p className="text-slate-500 text-xs mt-1">Try relaxing your search terms or filters.</p>
            </div>
          ) : (
            <div className="space-y-5">
              {hrs.map((hr) => {
                const name = hr.user_details?.full_name || 'Verified Recruiter';
                const company = hr.company_name || 'Independent Expert';
                const designation = hr.designation || 'HR Professional';
                const exp = hr.years_of_experience || 0;
                const bio = hr.bio || 'No bio summary shared yet.';
                const photo = hr.profile_photo;
                const rating = hr.average_rating || 0;
                const slots = hr.slots || [];
                const isExpanded = expandedHR === hr.id;

                return (
                  <div key={hr.id} className="glass rounded-3xl border border-white/5 glass-hover overflow-hidden">
                    {/* HR Card Header */}
                    <div className="p-6">
                      <div className="flex items-center gap-4">
                        {/* Photo */}
                        <div className="w-14 h-14 rounded-full bg-dark-950 border border-white/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                          {photo ? (
                            <img src={getFileUrl(photo)} alt={name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-white text-xl font-bold bg-gradient-to-br from-primary-600 to-accent-violet">
                              {name.charAt(0)}
                            </div>
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <h3 className="font-extrabold text-white text-base truncate">{name}</h3>
                            <span className="bg-accent-emerald/10 border border-accent-emerald/20 p-0.5 rounded-full text-accent-emerald flex-shrink-0" title="Verified Professional">
                              <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                              </svg>
                            </span>
                          </div>
                          <p className="text-slate-400 text-xs truncate">{designation} at <strong className="text-slate-300 font-medium">{company}</strong></p>
                          <p className="text-slate-500 text-xs mt-1 line-clamp-2">{bio}</p>
                        </div>

                        {/* Stats + Expand button */}
                        <div className="flex-shrink-0 text-right space-y-2">
                          <div className="flex items-center justify-end gap-4 text-xs">
                            <div className="text-center">
                              <div className="text-slate-500 text-[10px] font-semibold uppercase">Exp</div>
                              <div className="text-white font-bold">{exp} Yrs</div>
                            </div>
                            <div className="text-center">
                              <div className="text-slate-500 text-[10px] font-semibold uppercase">Rating</div>
                              <div className="text-white font-bold">★ {rating > 0 ? rating.toFixed(1) : 'N/A'}</div>
                            </div>
                          </div>
                          <button
                            onClick={() => toggleExpand(hr.id)}
                            className={`inline-flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl transition ${
                              isExpanded
                                ? 'bg-primary-600/20 border border-primary-500/30 text-primary-300'
                                : 'bg-primary-600 hover:bg-primary-700 text-white shadow-md'
                            }`}
                          >
                            {isExpanded ? (
                              <>
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                </svg>
                                Close
                              </>
                            ) : (
                              <>
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                View Slots ({slots.length})
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Expandable Slots Panel */}
                    {isExpanded && (
                      <div className="border-t border-white/5 bg-dark-950/30 p-6">
                        <h4 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                          <svg className="w-4 h-4 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          Available Interview Slots
                        </h4>

                        {slots.length === 0 ? (
                          <div className="text-center py-8 text-slate-500 text-xs">
                            <svg className="w-8 h-8 text-slate-700 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            No slots available right now. Check back later.
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {slots.map((slot) => {
                              const slotState = bookingState[slot.id] || {};
                              const dateStr = new Date(slot.date).toLocaleDateString('en-US', {
                                weekday: 'short', month: 'short', day: 'numeric'
                              });

                              return (
                                <div
                                  key={slot.id}
                                  className={`bg-dark-950/60 border rounded-2xl p-4 flex flex-col justify-between transition ${
                                    slotState.success
                                      ? 'border-accent-emerald/40'
                                      : slotState.error
                                      ? 'border-red-500/30'
                                      : 'border-white/5 hover:border-primary-500/30'
                                  }`}
                                >
                                  <div>
                                    <div className="flex justify-between items-start mb-2">
                                      <span className="text-white font-bold text-sm">{dateStr}</span>
                                      <span className="bg-accent-violet/10 border border-accent-violet/20 text-accent-violet text-[10px] px-2 py-0.5 rounded-md font-semibold">
                                        {slot.duration} Min
                                      </span>
                                    </div>
                                    <div className="text-slate-400 text-xs">
                                      {slot.start_time.substring(0, 5)} – {slot.end_time.substring(0, 5)}
                                    </div>
                                    {slot.meeting_link && (
                                      <div className="mt-1.5 flex items-center gap-1 text-[10px] text-accent-emerald">
                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                        </svg>
                                        Meeting link provided
                                      </div>
                                    )}
                                  </div>

                                  {/* Error */}
                                  {slotState.error && (
                                    <div className="mt-2 text-[10px] text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-2.5 py-1.5 leading-relaxed">
                                      {slotState.error}
                                    </div>
                                  )}

                                  <div className="border-t border-white/5 pt-3 mt-4 flex items-center justify-between">
                                    <span className="text-white font-extrabold text-sm">₹{Math.round(slot.price)}</span>
                                    {slotState.success ? (
                                      <span className="text-accent-emerald text-xs font-bold flex items-center gap-1">
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        Booked!
                                      </span>
                                    ) : (
                                      <button
                                        onClick={() => handleBookSlot(slot.id)}
                                        disabled={slotState.loading}
                                        className="bg-primary-600 hover:bg-primary-700 text-white text-[11px] font-bold px-4 py-1.5 rounded-lg shadow-sm transition disabled:opacity-50 flex items-center gap-1.5"
                                      >
                                        {slotState.loading ? (
                                          <div className="h-3 w-3 border border-t-transparent border-white rounded-full animate-spin" />
                                        ) : (
                                          <>
                                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                            Book Now
                                          </>
                                        )}
                                      </button>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* Link to full profile */}
                        <div className="mt-4 text-right">
                          <Link
                            to={`/hr/${hr.id}`}
                            className="text-xs text-slate-500 hover:text-primary-400 transition inline-flex items-center gap-1"
                          >
                            View full profile & reviews
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default BrowseHRs;
