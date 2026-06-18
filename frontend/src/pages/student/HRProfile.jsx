import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getHRDetail } from '../../services/student';
import { getFileUrl } from '../../services/api';

const HRProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [hr, setHr] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchHRDetails = async () => {
      try {
        const data = await getHRDetail(id);
        setHr(data);
      } catch (err) {
        setError('Failed to load HR profile. It may not exist or is not verified.');
      } finally {
        setLoading(false);
      }
    };
    fetchHRDetails();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <div className="h-10 w-10 border-4 border-t-transparent border-primary-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !hr) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16 text-center">
        <div className="glass p-8 rounded-3xl border border-red-500/20 max-w-md mx-auto">
          <h3 className="text-xl font-bold text-red-400">Error Loading Profile</h3>
          <p className="text-slate-400 text-xs mt-2">{error || 'Profile details could not be resolved.'}</p>
          <Link to="/hrs" className="mt-6 inline-block bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition">
            Back to Browse HRs
          </Link>
        </div>
      </div>
    );
  }

  const name = hr.user_details?.full_name || 'Verified Recruiter';
  const company = hr.company_name || 'Independent Recruiter';
  const designation = hr.designation || 'HR Expert';
  const exp = hr.years_of_experience || 0;
  const bio = hr.bio || 'No detailed biography provided.';
  const linkedin = hr.linkedin_url;
  const photo = hr.profile_photo;
  const rating = hr.average_rating || 0.0;
  const slots = hr.slots || [];
  const reviews = hr.reviews || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16">
      
      {/* Back Button */}
      <div className="mb-6">
        <Link to="/hrs" className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-xs transition">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Browse HRs
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Col: Main Profile details */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glass p-6 sm:p-8 rounded-3xl border border-white/5 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/5 rounded-full blur-[80px] pointer-events-none"></div>
            
            {/* Photo */}
            <div className="w-24 h-24 rounded-full bg-dark-950 border border-white/10 mx-auto overflow-hidden mb-4 shadow-xl">
              {photo ? (
                <img src={getFileUrl(photo)} alt={name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white text-3xl font-extrabold bg-gradient-to-br from-primary-600 to-accent-violet">
                  {name.charAt(0)}
                </div>
              )}
            </div>

            {/* Name & Title */}
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <h2 className="text-xl font-extrabold text-white">{name}</h2>
              <span className="bg-accent-emerald/10 border border-accent-emerald/20 p-0.5 rounded-full text-accent-emerald" title="Verified Professional">
                <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                </svg>
              </span>
            </div>
            
            <p className="text-slate-400 text-xs font-medium">{designation}</p>
            <p className="text-slate-500 text-xs font-light mt-0.5">{company}</p>

            {/* Rating and Experience Summary */}
            <div className="grid grid-cols-2 gap-4 mt-6 p-4 bg-dark-950/60 border border-white/5 rounded-2xl">
              <div className="text-center border-r border-white/5">
                <div className="text-slate-500 text-[10px] font-semibold uppercase">Experience</div>
                <div className="text-white text-base font-bold mt-0.5">{exp} Years</div>
              </div>
              <div className="text-center">
                <div className="text-slate-500 text-[10px] font-semibold uppercase">Rating</div>
                <div className="text-white text-base font-bold mt-0.5 inline-flex items-center gap-1">
                  ★ {rating > 0 ? rating.toFixed(1) : 'N/A'}
                </div>
              </div>
            </div>

            {/* Social Connection */}
            {linkedin && (
              <a
                href={linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 w-full inline-flex items-center justify-center gap-2 bg-[#0077b5]/15 border border-[#0077b5]/30 hover:bg-[#0077b5]/25 text-white text-xs font-semibold py-2.5 rounded-xl transition"
              >
                LinkedIn Profile
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            )}
          </div>

          {/* Bio info */}
          <div className="glass p-6 rounded-3xl border border-white/5">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-3">Bio Summary</h3>
            <p className="text-slate-300 text-xs leading-relaxed whitespace-pre-line font-light">{bio}</p>
          </div>
        </div>

        {/* Right Col: Slots & Review Section */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Slots Availability Section */}
          <div className="glass p-6 sm:p-8 rounded-3xl border border-white/5">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center justify-between">
              Available Sessions
              <span className="bg-primary-500/10 border border-primary-500/20 text-primary-300 text-[10px] font-semibold px-2.5 py-0.5 rounded-full">
                {slots.length} Slots
              </span>
            </h3>

            {slots.length === 0 ? (
              <div className="bg-dark-950/60 border border-white/5 p-8 rounded-2xl text-center">
                <svg className="w-10 h-10 text-slate-600 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <h4 className="text-white text-xs font-bold">No slots currently available</h4>
                <p className="text-slate-500 text-[10px] mt-1">This expert is currently fully booked or has not posted calendar times yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {slots.map((slot) => (
                  <div key={slot.id} className="bg-dark-950/60 border border-white/5 p-4 rounded-2xl flex flex-col justify-between hover:border-primary-500/30 transition">
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-white font-bold text-sm">
                          {new Date(slot.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                        </span>
                        <span className="bg-accent-violet/10 border border-accent-violet/20 text-accent-violet text-[10px] px-2 py-0.5 rounded-md font-semibold">
                          {slot.duration} Mins
                        </span>
                      </div>
                      <div className="text-slate-400 text-xs mt-1">
                        {slot.start_time.substring(0, 5)} - {slot.end_time.substring(0, 5)}
                      </div>
                    </div>
                    
                    <div className="border-t border-white/5 pt-3 mt-4 flex items-center justify-between">
                      <span className="text-white font-extrabold text-sm">₹{Math.round(slot.price)}</span>
                      <button
                        onClick={() => navigate(`/booking/${slot.id}`)}
                        className="bg-primary-600 hover:bg-primary-700 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg shadow-sm transition"
                      >
                        Book Slot
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Feedback & Review section */}
          <div className="glass p-6 sm:p-8 rounded-3xl border border-white/5">
            <h3 className="text-lg font-bold text-white mb-4">Reviews & Testimonials</h3>
            
            {reviews.length === 0 ? (
              <div className="text-slate-500 text-xs py-4 text-center">
                No session evaluations have been submitted for this interviewer yet.
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.map((rev) => (
                  <div key={rev.id} className="bg-dark-950/40 border border-white/5 p-4 rounded-2xl">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="text-white font-semibold text-xs">{rev.student_name}</div>
                        <div className="text-slate-500 text-[10px] mt-0.5">
                          {new Date(rev.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                        </div>
                      </div>
                      <div className="text-accent-amber font-semibold text-xs">
                        {'★'.repeat(rev.rating)}{'☆'.repeat(5 - rev.rating)}
                      </div>
                    </div>
                    {rev.comment && (
                      <p className="text-slate-400 text-xs italic font-light">"{rev.comment}"</p>
                    )}
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

export default HRProfile;
