import React, { useEffect, useState } from 'react';
import { getStudentProfile, updateStudentProfile, uploadStudentResume, getStudentInterviews } from '../../services/student';
import { getFileUrl } from '../../services/api';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form states
  const [formFields, setFormFields] = useState({
    college_name: '',
    degree: '',
    branch: '',
    graduation_year: '',
    career_goal: '',
  });
  const [skills, setSkills] = useState([]);
  const [newSkill, setNewSkill] = useState('');
  const [fileLoading, setFileLoading] = useState(false);

  // Interviews lists state
  const [interviews, setInterviews] = useState([]);
  const [interviewsTab, setInterviewsTab] = useState('upcoming');
  const [interviewsLoading, setInterviewsLoading] = useState(false);

  const fetchProfile = async () => {
    try {
      const data = await getStudentProfile();
      setProfile(data);
      setFormFields({
        college_name: data.college_name || '',
        degree: data.degree || '',
        branch: data.branch || '',
        graduation_year: data.graduation_year || '',
        career_goal: data.career_goal || '',
      });
      setSkills(data.skills || []);
    } catch (err) {
      setError('Failed to retrieve profile data.');
    } finally {
      setLoading(false);
    }
  };

  const fetchInterviews = async (tab) => {
    setInterviewsLoading(true);
    try {
      const data = await getStudentInterviews(tab);
      setInterviews(data);
    } catch (err) {
      // Silently catch
    } finally {
      setInterviewsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    fetchInterviews(interviewsTab);
  }, [interviewsTab]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    try {
      const updated = await updateStudentProfile({
        ...formFields,
        graduation_year: formFields.graduation_year ? parseInt(formFields.graduation_year) : null,
        skills,
      });
      setProfile(updated);
      setSuccess('Profile updated successfully.');
      setEditMode(false);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save updates.');
    }
  };

  const handleResumeUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Client validators
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['pdf', 'docx'].includes(ext)) {
      setError('Only PDF and DOCX file structures are supported.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be under 5MB.');
      return;
    }

    setError('');
    setSuccess('');
    setFileLoading(true);

    try {
      await uploadStudentResume(file);
      setSuccess('Resume uploaded successfully.');
      await fetchProfile();
    } catch (err) {
      setError(err.response?.data?.resume?.[0] || 'Resume upload failed.');
    } finally {
      setFileLoading(false);
    }
  };

  const handleAddSkill = (e) => {
    e.preventDefault();
    const tag = newSkill.trim();
    if (tag && !skills.includes(tag)) {
      const updatedSkills = [...skills, tag];
      setSkills(updatedSkills);
      // Auto-update backend if not in general edit mode
      if (!editMode) {
        updateStudentProfile({ skills: updatedSkills })
          .then((res) => {
            setProfile(res);
            setSuccess('Added skill.');
          })
          .catch(() => setError('Failed to update skills.'));
      }
    }
    setNewSkill('');
  };

  const handleRemoveSkill = (tag) => {
    const updatedSkills = skills.filter((s) => s !== tag);
    setSkills(updatedSkills);
    if (!editMode) {
      updateStudentProfile({ skills: updatedSkills })
        .then((res) => {
          setProfile(res);
          setSuccess('Removed skill.');
        })
        .catch(() => setError('Failed to update skills.'));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <div className="h-10 w-10 border-4 border-t-transparent border-primary-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  const completion = profile?.profile_completion || 0;
  const isEligible = completion >= 70;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16">
      
      {/* 1. Header Banner */}
      <div className="glass p-6 sm:p-8 rounded-3xl mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden border border-white/5">
        <div className="absolute top-0 right-0 w-80 h-80 bg-primary-500/10 rounded-full blur-[100px] pointer-events-none"></div>
        <div>
          <span className="bg-primary-500/15 border border-primary-500/30 text-primary-300 text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider">
            Student Account
          </span>
          <h1 className="text-3xl font-extrabold text-white mt-3">{profile?.user?.full_name}</h1>
          <p className="text-slate-400 text-sm mt-1">{profile?.user?.email} • {profile?.user?.phone_number || 'No phone number'}</p>
        </div>

        <div className="flex items-center gap-6 bg-dark-950/60 border border-white/5 p-4 rounded-2xl flex-shrink-0">
          <div className="text-left">
            <div className="text-slate-500 text-xs font-semibold uppercase">Profile Status</div>
            <div className="flex items-center gap-2 mt-1">
              <span className={`h-2.5 w-2.5 rounded-full ${isEligible ? 'bg-accent-emerald animate-pulse' : 'bg-accent-amber animate-pulse'}`} />
              <span className="text-white text-sm font-bold">{isEligible ? 'Placement Ready' : 'Incomplete Profile'}</span>
            </div>
          </div>
          <div className="h-8 w-px bg-white/10" />
          <div className="text-left">
            <div className="text-slate-500 text-xs font-semibold uppercase">Completeness</div>
            <div className="text-white text-sm font-bold mt-0.5">{completion}%</div>
          </div>
        </div>
      </div>

      {/* AI Career Modules Navigation Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 mb-8">
        <Link
          to="/student/resume-analysis"
          className="glass p-4 rounded-2xl border border-white/5 hover:border-primary-500/20 text-center glass-hover flex flex-col items-center gap-2"
        >
          <span className="text-xl">📄</span>
          <span className="text-white text-xs font-bold">Resume Analysis</span>
        </Link>
        <Link
          to="/student/skill-gap"
          className="glass p-4 rounded-2xl border border-white/5 hover:border-primary-500/20 text-center glass-hover flex flex-col items-center gap-2"
        >
          <span className="text-xl">📊</span>
          <span className="text-white text-xs font-bold">Skill Gap Report</span>
        </Link>
        <Link
          to="/student/ai-coach"
          className="glass p-4 rounded-2xl border border-white/5 hover:border-primary-500/20 text-center glass-hover flex flex-col items-center gap-2"
        >
          <span className="text-xl">🤖</span>
          <span className="text-white text-xs font-bold">AI Career Coach</span>
        </Link>
        <Link
          to="/student/analytics"
          className="glass p-4 rounded-2xl border border-white/5 hover:border-primary-500/20 text-center glass-hover flex flex-col items-center gap-2"
        >
          <span className="text-xl">📈</span>
          <span className="text-white text-xs font-bold">Growth Analytics</span>
        </Link>
        <Link
          to="/wallet"
          className="glass p-4 rounded-2xl border border-white/5 hover:border-primary-500/20 text-center glass-hover flex flex-col items-center gap-2"
        >
          <span className="text-xl">💳</span>
          <span className="text-white text-xs font-bold">My Wallet</span>
        </Link>
        <Link
          to="/leaderboard"
          className="glass p-4 rounded-2xl border border-white/5 hover:border-primary-500/20 text-center glass-hover flex flex-col items-center gap-2"
        >
          <span className="text-xl">🏆</span>
          <span className="text-white text-xs font-bold">Leaderboard</span>
        </Link>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm mb-6 text-center">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-accent-emerald/10 border border-accent-emerald/20 text-accent-emerald p-4 rounded-xl text-sm mb-6 text-center">
          {success}
        </div>
      )}

      {/* Eligibility Warning Banner */}
      {!isEligible && (
        <div className="bg-amber-500/15 border border-amber-500/25 p-5 rounded-2xl mb-8 flex items-start gap-4 shadow-md">
          <svg className="w-6 h-6 text-amber-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <h4 className="font-bold text-white text-sm">Action Required: Profile below threshold</h4>
            <p className="text-slate-400 text-xs mt-1 leading-relaxed">
              Your profile is currently at <strong>{completion}%</strong>. You must complete academic fields and upload your resume to reach the <strong>70% threshold</strong> to unlock interview bookings in the next phase.
            </p>
          </div>
        </div>
      )}

      {/* Grid Layouts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Cols: Profile Form & Details */}
        <div className="lg:col-span-2 space-y-8">
          <div className="glass p-6 sm:p-8 rounded-3xl border border-white/5 relative">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5">
              <h3 className="text-xl font-bold text-white">Academic & Career Details</h3>
              {!editMode && (
                <button
                  onClick={() => setEditMode(true)}
                  className="bg-white/5 border border-white/10 hover:bg-white/10 text-white text-xs font-semibold px-4 py-2 rounded-xl transition"
                >
                  Edit Profile
                </button>
              )}
            </div>

            {editMode ? (
              <form onSubmit={handleUpdate} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-400 text-xs font-semibold mb-2">College Name</label>
                    <input
                      type="text"
                      required
                      value={formFields.college_name}
                      onChange={(e) => setFormFields({ ...formFields, college_name: e.target.value })}
                      className="w-full bg-dark-950 border border-white/10 rounded-xl px-4 py-2.5 text-slate-100 text-sm focus:outline-none focus:border-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 text-xs font-semibold mb-2">Degree</label>
                    <input
                      type="text"
                      required
                      value={formFields.degree}
                      onChange={(e) => setFormFields({ ...formFields, degree: e.target.value })}
                      className="w-full bg-dark-950 border border-white/10 rounded-xl px-4 py-2.5 text-slate-100 text-sm focus:outline-none focus:border-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 text-xs font-semibold mb-2">Branch</label>
                    <input
                      type="text"
                      required
                      value={formFields.branch}
                      onChange={(e) => setFormFields({ ...formFields, branch: e.target.value })}
                      className="w-full bg-dark-950 border border-white/10 rounded-xl px-4 py-2.5 text-slate-100 text-sm focus:outline-none focus:border-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 text-xs font-semibold mb-2">Graduation Year</label>
                    <input
                      type="number"
                      required
                      value={formFields.graduation_year}
                      onChange={(e) => setFormFields({ ...formFields, graduation_year: e.target.value })}
                      className="w-full bg-dark-950 border border-white/10 rounded-xl px-4 py-2.5 text-slate-100 text-sm focus:outline-none focus:border-primary-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 text-xs font-semibold mb-2">Career Target Role</label>
                  <input
                    type="text"
                    required
                    value={formFields.career_goal}
                    onChange={(e) => setFormFields({ ...formFields, career_goal: e.target.value })}
                    className="w-full bg-dark-950 border border-white/10 rounded-xl px-4 py-3 text-slate-100 text-sm focus:outline-none focus:border-primary-500"
                  />
                </div>

                <div className="flex items-center gap-3 justify-end pt-4 border-t border-white/5">
                  <button
                    type="button"
                    onClick={() => {
                      setEditMode(false);
                      setError('');
                    }}
                    className="border border-white/10 hover:bg-white/5 text-slate-300 font-semibold px-4 py-2 rounded-xl text-xs transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-primary-600 hover:bg-primary-700 text-white font-semibold px-5 py-2.5 rounded-xl text-xs transition shadow-md"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 text-sm">
                <div>
                  <div className="text-slate-500 font-semibold uppercase text-xs">College Name</div>
                  <div className="text-white font-medium mt-1">{profile?.college_name || 'Not specified'}</div>
                </div>
                <div>
                  <div className="text-slate-500 font-semibold uppercase text-xs">Degree & Specialization</div>
                  <div className="text-white font-medium mt-1">{profile?.degree} ({profile?.branch || 'N/A'})</div>
                </div>
                <div>
                  <div className="text-slate-500 font-semibold uppercase text-xs">Graduation Year</div>
                  <div className="text-white font-medium mt-1">{profile?.graduation_year || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-slate-500 font-semibold uppercase text-xs">Target Career Goal</div>
                  <div className="text-white font-medium mt-1">{profile?.career_goal || 'Not specified'}</div>
                </div>
              </div>
            )}
          </div>

          {/* Manage Skills Card */}
          <div className="glass p-6 sm:p-8 rounded-3xl border border-white/5">
            <h3 className="text-xl font-bold text-white mb-4">Core Skills Inventory</h3>
            <form onSubmit={handleAddSkill} className="flex gap-2 mb-6">
              <input
                type="text"
                placeholder="Add skill tag (e.g. Python, SQL, DSA)"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                className="bg-dark-950 border border-white/10 rounded-xl px-4 py-2 text-slate-100 text-sm focus:outline-none focus:border-primary-500 w-full"
              />
              <button
                type="submit"
                className="bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-md transition flex-shrink-0"
              >
                Add Skill
              </button>
            </form>

            <div className="flex flex-wrap gap-2 min-h-[40px] p-4 bg-dark-950/40 border border-white/5 rounded-2xl">
              {skills.length === 0 ? (
                <span className="text-slate-600 text-xs">No skill tags listed. Type tags in the search target above.</span>
              ) : (
                skills.map((s) => (
                  <span key={s} className="bg-primary-500/10 border border-primary-500/20 text-primary-300 text-xs font-semibold px-2.5 py-1.5 rounded-lg flex items-center gap-2">
                    {s}
                    <button onClick={() => handleRemoveSkill(s)} className="text-primary-400 hover:text-white font-bold">&times;</button>
                  </span>
                ))
              )}
            </div>
          </div>

        </div>

        {/* Right 1 Col: Resume Management Panel */}
        <div className="space-y-8">
          <div className="glass p-6 rounded-3xl border border-white/5">
            <h3 className="text-lg font-bold text-white mb-4">Resume Upload</h3>
            
            {profile?.resume ? (
              <div className="bg-primary-500/5 border border-primary-500/10 rounded-2xl p-5 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary-500/10 border border-primary-500/25 rounded-xl flex items-center justify-center text-primary-400 flex-shrink-0">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-white truncate">Resume File</div>
                    <a
                      href={getFileUrl(profile.resume)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary-400 hover:underline inline-flex items-center gap-1 mt-0.5"
                    >
                      View File
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-red-500/5 border border-red-500/10 rounded-2xl p-5 mb-6 text-center">
                <div className="text-red-400 text-xs font-semibold mb-1">No Resume Uploaded</div>
                <p className="text-slate-500 text-[10px]">Add your resume to qualify for mocks.</p>
              </div>
            )}

            <div className="border border-white/5 rounded-2xl p-4 bg-dark-950/40 text-center">
              <label className="block bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-bold py-3 rounded-xl cursor-pointer transition">
                {fileLoading ? (
                  <div className="h-4 w-4 border-2 border-t-transparent border-white rounded-full animate-spin mx-auto"></div>
                ) : profile?.resume ? (
                  'Replace Resume File'
                ) : (
                  'Upload Resume File'
                )}
                <input
                  type="file"
                  className="hidden"
                  accept=".pdf,.docx"
                  disabled={fileLoading}
                  onChange={handleResumeUpload}
                />
              </label>
              <p className="text-[10px] text-slate-500 mt-2">PDF, DOCX formats. Max file size: 5MB.</p>
            </div>
          </div>
        </div>

      </div>

      {/* 4. Mock Interview Bookings Section */}
      <div className="glass p-6 sm:p-8 rounded-3xl border border-white/5 mt-8 relative">
        <div className="absolute top-0 right-0 w-80 h-80 bg-accent-violet/5 rounded-full blur-[100px] pointer-events-none"></div>
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-white/5">
          <div>
            <h3 className="text-xl font-bold text-white">My Interview Bookings</h3>
            <p className="text-slate-500 text-xs mt-1">Review scheduled slots, access Google Meet rooms, and inspect recruiter feedback.</p>
          </div>
          <Link
            to="/hrs"
            className="inline-flex items-center justify-center bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition shadow-md self-start"
          >
            Book New Interview
          </Link>
        </div>

        {/* Tab Selection */}
        <div className="flex gap-2 mb-6 bg-dark-950/40 p-1 rounded-xl w-fit border border-white/5">
          {['upcoming', 'completed', 'cancelled'].map((tab) => (
            <button
              key={tab}
              onClick={() => setInterviewsTab(tab)}
              className={`px-4 py-2 rounded-lg text-[10px] font-semibold uppercase tracking-wider transition ${
                interviewsTab === tab
                  ? 'bg-primary-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* List of bookings */}
        {interviewsLoading ? (
          <div className="flex justify-center py-12">
            <div className="h-6 w-6 border-2 border-t-transparent border-primary-500 rounded-full animate-spin"></div>
          </div>
        ) : interviews.length === 0 ? (
          <div className="bg-dark-950/60 p-8 rounded-2xl text-center border border-white/5">
            <p className="text-slate-500 text-xs">No {interviewsTab} mock interview sessions found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {interviews.map((booking) => {
              const interviewer = booking.hr_details?.full_name || 'Verified Interviewer';
              const dateStr = booking.slot_details?.date
                ? new Date(booking.slot_details.date).toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  })
                : '—';
              const timeStr = booking.slot_details
                ? `${booking.slot_details.start_time?.substring(0, 5)} - ${booking.slot_details.end_time?.substring(0, 5)}`
                : '—';
              const isPending = booking.booking_status === 'pending';
              const meetLink = booking.meeting_link;

              return (
                <div key={booking.id} className={`bg-dark-950/60 border p-5 rounded-2xl flex flex-col justify-between transition ${
                  isPending ? 'border-amber-500/20 hover:border-amber-500/40' : 'border-white/5 hover:border-primary-500/20'
                }`}>
                  <div>
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">Interviewer</span>
                        <h4 className="text-white font-bold text-sm mt-0.5">{interviewer}</h4>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-semibold uppercase ${
                        booking.booking_status === 'completed'
                          ? 'bg-accent-emerald/10 text-accent-emerald border border-accent-emerald/25'
                          : booking.booking_status === 'cancelled'
                          ? 'bg-accent-coral/10 text-accent-coral border border-accent-coral/25'
                          : isPending
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/25'
                          : 'bg-primary-500/10 text-primary-300 border border-primary-500/25'
                      }`}>
                        {isPending ? 'Pending Payment' : booking.booking_status}
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-400 mt-4">
                      <div className="flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {dateStr} @ {timeStr} ({booking.slot_details?.duration} min)
                      </div>
                      <div className="flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 11v-1m0-10V5" />
                        </svg>
                        Amount: ₹{Math.round(booking.slot_details?.price || 0)}
                      </div>

                      {/* Meeting link for confirmed sessions */}
                      {meetLink && !isPending && (
                        <div className="flex items-center gap-1.5 mt-2">
                          <svg className="w-3.5 h-3.5 text-accent-emerald" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          <a
                            href={meetLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-accent-emerald hover:underline truncate"
                          >
                            Join Meeting Room
                          </a>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="border-t border-white/5 pt-4 mt-5 flex gap-2 justify-end">
                    {isPending ? (
                      <Link
                        to={`/booking/${booking.slot_details?.id}`}
                        className="bg-amber-500 hover:bg-amber-400 text-dark-950 text-xs font-bold px-4 py-2 rounded-xl transition shadow-md"
                      >
                        Complete Payment
                      </Link>
                    ) : (
                      <Link
                        to={`/session/${booking.id}`}
                        className="bg-white/5 border border-white/10 hover:bg-white/10 text-white text-xs font-bold px-4 py-2 rounded-xl transition"
                      >
                        {interviewsTab === 'upcoming' ? 'Join Session' : 'View Evaluation'}
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};

export default Dashboard;
