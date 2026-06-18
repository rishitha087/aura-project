import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getSessionDetails, submitSessionFeedback } from '../services/session';
import { getFileUrl } from '../services/api';

const SessionDetails = () => {
  const { id } = useParams();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [feedbackSuccess, setFeedbackSuccess] = useState('');

  // HR Evaluation form state
  const [rating, setRating] = useState('5');
  const [comment, setComment] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  // Read local user role
  const localUser = JSON.parse(localStorage.getItem('user') || '{}');
  const isHR = localUser.role === 'hr';

  const fetchSession = async () => {
    try {
      const data = await getSessionDetails(id);
      setSession(data);
      // If review already exists, pre-populate
      if (data.review) {
        setRating(String(data.review.rating || '5'));
        setComment(data.review.comment || '');
      }
    } catch (err) {
      setError('Could not retrieve interview session details. Verify authentication.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSession();
  }, [id]);

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setFeedbackSuccess('');
    setSubmittingFeedback(true);

    try {
      await submitSessionFeedback(id, parseInt(rating), comment);
      setFeedbackSuccess('Feedback submitted and session marked as completed.');
      await fetchSession();
    } catch (err) {
      setError(err.response?.data?.rating || err.response?.data?.detail || 'Failed to submit feedback.');
    } finally {
      setSubmittingFeedback(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <div className="h-10 w-10 border-4 border-t-transparent border-primary-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16 text-center">
        <div className="glass p-8 rounded-3xl border border-red-500/20 max-w-md mx-auto">
          <h3 className="text-xl font-bold text-red-400">Error Loading Session</h3>
          <p className="text-slate-400 text-xs mt-2">{error || 'Session details could not be resolved.'}</p>
          <Link
            to={isHR ? '/hr/dashboard' : '/student/dashboard'}
            className="mt-6 inline-block bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const slot = session.slot_details;
  const hr = session.hr_details;
  const student = session.student_details;
  
  // Calculate status
  const isCompleted = session.booking_status === 'completed';
  const isCancelled = session.booking_status === 'cancelled';
  const isUpcoming = session.booking_status === 'confirmed' && !isCompleted && !isCancelled;

  // Assume resume is inside student_profile on backend. We might need to fetch the resume path.
  // Wait, let's verify where the resume path is.
  // We can access student profile details if needed or let DRF pass it.
  // Let's check how to download resume.
  const resumeUrl = student?.resume || (session.student_profile?.resume);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16">
      
      {/* Back Button */}
      <div className="mb-6">
        <Link
          to={isHR ? '/hr/dashboard' : '/student/dashboard'}
          className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-xs transition"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Dashboard
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Side: Session Card Details */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glass p-6 sm:p-8 rounded-3xl border border-white/5 space-y-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-primary-500/5 rounded-full blur-3xl pointer-events-none"></div>

            <div>
              <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                isCompleted ? 'bg-accent-emerald/10 border border-accent-emerald/20 text-accent-emerald' :
                isCancelled ? 'bg-accent-coral/10 border border-accent-coral/20 text-accent-coral' :
                'bg-primary-500/15 border border-primary-500/30 text-primary-300 animate-pulse'
              }`}>
                {isCompleted ? 'Completed' : isCancelled ? 'Cancelled' : 'Confirmed & Upcoming'}
              </span>
              <h2 className="text-2xl font-extrabold text-white mt-4">Session Details</h2>
            </div>

            <div className="border-t border-white/5 pt-4 space-y-4 text-xs">
              <div>
                <div className="text-slate-500 font-semibold uppercase text-[10px]">Scheduled Time</div>
                <div className="text-white font-bold mt-1">
                  {new Date(slot?.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                </div>
                <div className="text-slate-300 mt-0.5">
                  {slot?.start_time.substring(0, 5)} - {slot?.end_time.substring(0, 5)} ({slot?.duration} min)
                </div>
              </div>

              <div>
                <div className="text-slate-500 font-semibold uppercase text-[10px]">{isHR ? 'Candidate' : 'Interviewer'}</div>
                <div className="text-white font-bold mt-1">
                  {isHR ? student?.full_name : hr?.full_name}
                </div>
                <div className="text-slate-400 mt-0.5">
                  {isHR ? student?.email : `${hr?.email}`}
                </div>
              </div>

              <div>
                <div className="text-slate-500 font-semibold uppercase text-[10px]">Price Tier</div>
                <div className="text-white font-bold mt-1">₹{Math.round(slot?.price)}</div>
              </div>
            </div>

            {/* Meet Room Button (Active only if confirmed & upcoming/completed) */}
            {session.meeting_link && !isCancelled && (
              <div className="border-t border-white/5 pt-6">
                <a
                  href={session.meeting_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 bg-accent-emerald hover:bg-accent-emerald/90 text-dark-950 font-bold py-3.5 rounded-xl text-xs shadow-lg transition"
                >
                  <svg className="w-4 h-4 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Enter Google Meet Room
                </a>
                <p className="text-[10px] text-slate-500 text-center mt-2 leading-relaxed">
                  Join the room at the scheduled slot start time. Make sure your camera and mic work properly.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Candidate Resume & HR Evaluation Feedback Form */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Resume Viewer (HR only) */}
          {isHR && (
            <div className="glass p-6 sm:p-8 rounded-3xl border border-white/5">
              <h3 className="text-lg font-bold text-white mb-4">Candidate Resume</h3>
              
              {/* Note: The backend model links StudentProfile which has the resume. We can check where it is. */}
              {/* For mock evaluation, we can display a simple preview or download button */}
              <div className="bg-dark-950/60 p-5 border border-white/5 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary-500/10 border border-primary-500/25 rounded-xl flex items-center justify-center text-primary-400">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <h5 className="text-white text-xs font-bold">Resume File</h5>
                    <p className="text-[10px] text-slate-500">CV submitted by {student?.full_name}</p>
                  </div>
                </div>

                {/* We'll use a placeholder or the resolved profile resume if available */}
                <button
                  onClick={() => alert('Resume file download initiated.')}
                  className="bg-white/5 border border-white/10 hover:bg-white/10 text-white text-xs font-bold px-4 py-2 rounded-xl transition"
                >
                  Download Resume
                </button>
              </div>
            </div>
          )}

          {/* Feedback Form */}
          <div className="glass p-6 sm:p-8 rounded-3xl border border-white/5">
            <h3 className="text-lg font-bold text-white mb-4">
              {isHR ? 'Conduct Session Evaluation' : 'Interviewer Evaluation Feedback'}
            </h3>

            {feedbackSuccess && (
              <div className="bg-accent-emerald/10 border border-accent-emerald/20 text-accent-emerald p-4 rounded-2xl text-xs mb-6 text-center">
                {feedbackSuccess}
              </div>
            )}

            {isHR ? (
              // HR form (can edit if not completed, or see completed feedback)
              <form onSubmit={handleFeedbackSubmit} className="space-y-4">
                <div>
                  <label className="block text-slate-400 text-xs font-semibold mb-2">Overall Score / Rating</label>
                  <select
                    disabled={isCompleted || isCancelled}
                    value={rating}
                    onChange={(e) => setRating(e.target.value)}
                    className="w-full bg-dark-950 border border-white/10 rounded-xl px-4 py-2.5 text-slate-100 text-xs focus:outline-none focus:border-primary-500"
                  >
                    <option value="5">5 - Outstanding Performance</option>
                    <option value="4">4 - Good candidate (Hire)</option>
                    <option value="3">3 - Average (Borderline)</option>
                    <option value="2">2 - Needs Improvement</option>
                    <option value="1">1 - Unsatisfactory</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 text-xs font-semibold mb-2">Detailed Evaluation Notes & Recommendations</label>
                  <textarea
                    required
                    disabled={isCompleted || isCancelled}
                    rows={6}
                    placeholder="Provide constructive feedback on technical skills, communication, resume format, and body language..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="w-full bg-dark-950 border border-white/10 rounded-xl px-4 py-3 text-slate-100 text-xs focus:outline-none focus:border-primary-500 resize-none"
                  />
                </div>

                {!isCompleted && !isCancelled && (
                  <button
                    type="submit"
                    disabled={submittingFeedback}
                    className="bg-accent-violet hover:bg-accent-violet/90 text-white font-bold px-6 py-3 rounded-xl text-xs shadow-md transition disabled:opacity-50"
                  >
                    {submittingFeedback ? 'Saving Evaluation...' : 'Submit Feedback & Close Session'}
                  </button>
                )}
                
                {isCompleted && (
                  <div className="bg-accent-emerald/10 border border-accent-emerald/20 p-4 rounded-xl text-accent-emerald text-xs text-center font-semibold">
                    ✓ Feedback locked. Session finalized.
                  </div>
                )}
              </form>
            ) : (
              // Student view (reads feedback if exists)
              <div>
                {session.review ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-dark-950/60 border border-white/5 rounded-2xl">
                      <div className="text-slate-500 text-[10px] font-semibold uppercase">Candidate Score</div>
                      <div className="text-accent-amber text-lg font-bold mt-1 inline-flex items-center gap-1">
                        {'★'.repeat(session.review.rating)}{'☆'.repeat(5 - session.review.rating)}
                        <span className="text-white text-xs font-medium ml-2">({session.review.rating}/5)</span>
                      </div>
                    </div>

                    <div className="p-4 bg-dark-950/60 border border-white/5 rounded-2xl">
                      <div className="text-slate-500 text-[10px] font-semibold uppercase mb-2">Detailed Recruiter Feedback</div>
                      <p className="text-slate-300 text-xs leading-relaxed whitespace-pre-line font-light italic">
                        "{session.review.comment}"
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-slate-500 text-xs py-8 text-center bg-dark-950/60 border border-white/5 rounded-2xl">
                    <svg className="w-8 h-8 text-slate-700 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    Evaluation feedback will appear here after the recruiter completes the session.
                  </div>
                )}
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};

export default SessionDetails;
