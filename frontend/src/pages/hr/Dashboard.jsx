import React, { useEffect, useState } from 'react';
import { getHRProfile, updateHRProfile, getHRVerification, uploadHRDocuments, uploadHRPhoto, getHRInterviews } from '../../services/hr';
import { getFileUrl } from '../../services/api';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const [profile, setProfile] = useState(null);
  const [verification, setVerification] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form states
  const [formFields, setFormFields] = useState({
    company_name: '',
    designation: '',
    years_of_experience: '',
    bio: '',
    linkedin_url: '',
  });
  const [photoLoading, setPhotoLoading] = useState(false);
  const [docLoading, setDocLoading] = useState(false);

  // Interviews lists state
  const [interviews, setInterviews] = useState([]);
  const [interviewsTab, setInterviewsTab] = useState('upcoming');
  const [interviewsLoading, setInterviewsLoading] = useState(false);

  // Re-upload documents states (used when rejected)
  const [newResume, setNewResume] = useState(null);
  const [newId, setNewId] = useState(null);

  const fetchData = async () => {
    try {
      const profileData = await getHRProfile();
      setProfile(profileData);
      setFormFields({
        company_name: profileData.company_name || '',
        designation: profileData.designation || '',
        years_of_experience: profileData.years_of_experience || '',
        bio: profileData.bio || '',
        linkedin_url: profileData.linkedin_url || '',
      });

      const verificationData = await getHRVerification();
      setVerification(verificationData);
    } catch (err) {
      setError('Failed to fetch HR data.');
    } finally {
      setLoading(false);
    }
  };

  const fetchInterviews = async (tab) => {
    setInterviewsLoading(true);
    try {
      const data = await getHRInterviews(tab);
      setInterviews(data);
    } catch (err) {
      // Silently catch
    } finally {
      setInterviewsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    fetchInterviews(interviewsTab);
  }, [interviewsTab]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    try {
      const updated = await updateHRProfile({
        ...formFields,
        years_of_experience: formFields.years_of_experience ? parseInt(formFields.years_of_experience) : null,
      });
      setProfile(updated);
      setSuccess('Profile updated successfully.');
      setEditMode(false);
    } catch (err) {
      setError('Failed to save profile changes.');
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setError('Profile photo must be under 2MB.');
      return;
    }

    setError('');
    setSuccess('');
    setPhotoLoading(true);

    try {
      await uploadHRPhoto(file);
      setSuccess('Profile photo updated.');
      await fetchData();
    } catch (err) {
      setError('Photo upload failed.');
    } finally {
      setPhotoLoading(false);
    }
  };

  const handleResubmitDocs = async (e) => {
    e.preventDefault();
    if (!newResume && !newId) {
      setError('Please choose at least one file to update.');
      return;
    }

    setError('');
    setSuccess('');
    setDocLoading(true);

    try {
      await uploadHRDocuments({
        resume_file: newResume,
        employee_id_file: newId,
      });
      setSuccess('Documents resubmitted for admin review.');
      setNewResume(null);
      setNewId(null);
      await fetchData();
    } catch (err) {
      setError('Document resubmission failed.');
    } finally {
      setDocLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <div className="h-10 w-10 border-4 border-t-transparent border-accent-violet rounded-full animate-spin"></div>
      </div>
    );
  }

  const status = verification?.verification_status || 'pending';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16">
      
      {/* Header Banner */}
      <div className="glass p-6 sm:p-8 rounded-3xl mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-white/5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-accent-violet/10 rounded-full blur-[100px] pointer-events-none"></div>
        
        <div className="flex items-center gap-4">
          <div className="relative group">
            <div className="w-20 h-20 rounded-full bg-dark-950 border border-white/10 flex items-center justify-center overflow-hidden">
              {profile?.profile_photo ? (
                <img src={getFileUrl(profile.profile_photo)} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="text-white text-2xl font-bold">{profile?.user?.full_name?.charAt(0)}</span>
              )}
            </div>
            <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 rounded-full flex items-center justify-center text-[10px] text-white font-bold cursor-pointer transition">
              Change
              <input type="file" className="hidden" accept="image/png,image/jpeg" onChange={handlePhotoUpload} />
            </label>
          </div>
          <div>
            <span className="bg-accent-violet/15 border border-accent-violet/30 text-accent-violet text-[10px] font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider">
              Interviewer Account
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-2 flex items-center gap-2">
              {profile?.user?.full_name}
              {status === 'approved' && (
                <span className="bg-accent-emerald/10 border border-accent-emerald/20 p-1 rounded-full text-accent-emerald" title="Verified Professional">
                  <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                  </svg>
                </span>
              )}
            </h1>
            <p className="text-slate-400 text-xs mt-1">{profile?.user?.email} • {profile?.user?.phone_number}</p>
          </div>
        </div>

        {/* Status widget */}
        <div className="flex items-center gap-6 bg-dark-950/60 border border-white/5 p-4 rounded-2xl flex-shrink-0">
          <div className="text-left">
            <div className="text-slate-500 text-xs font-semibold uppercase">Verification Status</div>
            <div className="flex items-center gap-2 mt-1">
              <span className={`h-2.5 w-2.5 rounded-full ${
                status === 'approved' ? 'bg-accent-emerald' : status === 'rejected' ? 'bg-accent-coral' : 'bg-accent-amber animate-pulse'
              }`} />
              <span className="text-white text-sm font-bold capitalize">{status === 'pending' ? 'Pending Review' : status}</span>
            </div>
          </div>
        </div>
      </div>

      {/* HR Action Toolbar */}
      {status === 'approved' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          <Link
            to="/hr/dashboard/slots"
            className="glass p-4 rounded-2xl border border-white/5 hover:border-accent-violet/20 text-center flex flex-col items-center justify-center gap-2 transition glass-hover"
          >
            <span className="text-xl">📅</span>
            <span className="text-white text-xs font-bold">Availability Slots</span>
          </Link>
          <Link
            to="/hr/analytics"
            className="glass p-4 rounded-2xl border border-white/5 hover:border-accent-violet/20 text-center flex flex-col items-center justify-center gap-2 transition glass-hover"
          >
            <span className="text-xl">📈</span>
            <span className="text-white text-xs font-bold">Payout Analytics</span>
          </Link>
          <Link
            to="/hr/assessment"
            className="glass p-4 rounded-2xl border border-white/5 hover:border-accent-violet/20 text-center flex flex-col items-center justify-center gap-2 transition glass-hover"
          >
            <span className="text-xl">✍️</span>
            <span className="text-white text-xs font-bold">AI Skill Test</span>
          </Link>
          <Link
            to="/wallet"
            className="glass p-4 rounded-2xl border border-white/5 hover:border-accent-violet/20 text-center flex flex-col items-center justify-center gap-2 transition glass-hover"
          >
            <span className="text-xl">💳</span>
            <span className="text-white text-xs font-bold">Wallet & Balance</span>
          </Link>
          <Link
            to="/leaderboard"
            className="glass p-4 rounded-2xl border border-white/5 hover:border-accent-violet/20 text-center flex flex-col items-center justify-center gap-2 transition glass-hover"
          >
            <span className="text-xl">🏆</span>
            <span className="text-white text-xs font-bold">Leaderboard</span>
          </Link>
        </div>
      )}

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

      {/* Verification alerts */}
      {status === 'pending' && (
        <div className="bg-amber-500/10 border border-amber-500/20 p-5 rounded-2xl mb-8 flex items-start gap-4 shadow-sm border-l-4 border-l-amber-500">
          <svg className="w-6 h-6 text-amber-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h4 className="font-bold text-white text-sm">Application Under Review</h4>
            <p className="text-slate-400 text-xs mt-1 leading-relaxed">
              Your onboarding credentials (resume and corporate ID card) are currently in our queue. Administrative approval is required before you can configure calendar slots or conduct interviews.
            </p>
          </div>
        </div>
      )}

      {status === 'approved' && (
        <div className="bg-accent-emerald/10 border border-accent-emerald/20 p-5 rounded-2xl mb-8 flex items-start gap-4 shadow-sm border-l-4 border-l-accent-emerald">
          <svg className="w-6 h-6 text-accent-emerald flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h4 className="font-bold text-white text-sm">Verification Approved</h4>
            <p className="text-slate-400 text-xs mt-1 leading-relaxed">
              Congratulations! Your credentials have been verified. A verified professional badge has been assigned to your profile. You are now cleared to participate in placement mentoring loops.
            </p>
          </div>
        </div>
      )}

      {status === 'rejected' && (
        <div className="bg-red-500/10 border border-red-500/20 p-5 rounded-2xl mb-8 flex flex-col gap-4 shadow-sm border-l-4 border-l-red-500">
          <div className="flex items-start gap-4">
            <svg className="w-6 h-6 text-accent-coral flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h4 className="font-bold text-white text-sm">Application Rejected</h4>
              <p className="text-slate-400 text-xs mt-1 leading-relaxed">
                Your application could not be verified in its current state. Please review the comments and submit updated credentials below.
              </p>
              {verification?.admin_notes && (
                <div className="mt-3 p-3 bg-red-950/40 border border-red-900/30 rounded-xl text-red-300 text-xs font-mono">
                  <strong>Admin Feedback:</strong> {verification.admin_notes}
                </div>
              )}
            </div>
          </div>
          
          {/* Document resubmission form */}
          <form onSubmit={handleResubmitDocs} className="bg-dark-950/60 p-4 border border-white/5 rounded-2xl flex flex-col sm:flex-row items-center gap-4 justify-between">
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <label className="bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-semibold px-4 py-2.5 rounded-xl cursor-pointer transition text-center">
                New Resume
                <input type="file" className="hidden" accept=".pdf,.docx" onChange={(e) => setNewResume(e.target.files[0])} />
              </label>
              <label className="bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-semibold px-4 py-2.5 rounded-xl cursor-pointer transition text-center">
                New ID Card
                <input type="file" className="hidden" accept=".pdf,.png,.jpg,.jpeg" onChange={(e) => setNewId(e.target.files[0])} />
              </label>
            </div>
            
            <div className="flex items-center gap-3 w-full sm:w-auto justify-between">
              <div className="text-[10px] text-slate-500">
                {newResume && `Resume: Selected`} {newId && `ID: Selected`}
              </div>
              <button
                type="submit"
                disabled={docLoading || (!newResume && !newId)}
                className="bg-accent-violet hover:bg-accent-violet/90 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition disabled:opacity-50"
              >
                {docLoading ? 'Resubmitting...' : 'Resubmit Files'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Grid panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left cols: Profile Bio & Fields */}
        <div className="lg:col-span-2 space-y-8">
          <div className="glass p-6 sm:p-8 rounded-3xl border border-white/5">
            <div className="flex items-center justify-between pb-4 border-b border-white/5 mb-6">
              <h3 className="text-xl font-bold text-white">Professional Biography</h3>
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
              <form onSubmit={handleUpdateProfile} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-slate-400 text-xs font-semibold mb-2">Company</label>
                    <input
                      type="text"
                      required
                      value={formFields.company_name}
                      onChange={(e) => setFormFields({ ...formFields, company_name: e.target.value })}
                      className="w-full bg-dark-950 border border-white/10 rounded-xl px-4 py-2.5 text-slate-100 text-sm focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 text-xs font-semibold mb-2">Designation</label>
                    <input
                      type="text"
                      required
                      value={formFields.designation}
                      onChange={(e) => setFormFields({ ...formFields, designation: e.target.value })}
                      className="w-full bg-dark-950 border border-white/10 rounded-xl px-4 py-2.5 text-slate-100 text-sm focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 text-xs font-semibold mb-2">Exp (Years)</label>
                    <input
                      type="number"
                      required
                      value={formFields.years_of_experience}
                      onChange={(e) => setFormFields({ ...formFields, years_of_experience: e.target.value })}
                      className="w-full bg-dark-950 border border-white/10 rounded-xl px-4 py-2.5 text-slate-100 text-sm focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 text-xs font-semibold mb-2">LinkedIn Profile URL</label>
                  <input
                    type="url"
                    required
                    value={formFields.linkedin_url}
                    onChange={(e) => setFormFields({ ...formFields, linkedin_url: e.target.value })}
                    className="w-full bg-dark-950 border border-white/10 rounded-xl px-4 py-3 text-slate-100 text-sm focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 text-xs font-semibold mb-2">Bio Summary</label>
                  <textarea
                    required
                    rows={4}
                    value={formFields.bio}
                    onChange={(e) => setFormFields({ ...formFields, bio: e.target.value })}
                    className="w-full bg-dark-950 border border-white/10 rounded-xl px-4 py-3 text-slate-100 text-sm focus:outline-none resize-none"
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
                    className="bg-accent-violet hover:bg-accent-violet/90 text-white font-semibold px-5 py-2.5 rounded-xl text-xs transition"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-6 text-sm">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div>
                    <div className="text-slate-500 font-semibold uppercase text-xs">Current Employer</div>
                    <div className="text-white font-medium mt-1">{profile?.company_name || 'N/A'}</div>
                  </div>
                  <div>
                    <div className="text-slate-500 font-semibold uppercase text-xs">Role/Designation</div>
                    <div className="text-white font-medium mt-1">{profile?.designation || 'N/A'}</div>
                  </div>
                  <div>
                    <div className="text-slate-500 font-semibold uppercase text-xs">Recruiting Experience</div>
                    <div className="text-white font-medium mt-1">{profile?.years_of_experience} Years</div>
                  </div>
                </div>

                <div className="border-t border-white/5 pt-4">
                  <div className="text-slate-500 font-semibold uppercase text-xs mb-2">Professional Summary</div>
                  <p className="text-slate-300 leading-relaxed font-light whitespace-pre-line">{profile?.bio || 'No biography written.'}</p>
                </div>

                {profile?.linkedin_url && (
                  <div className="border-t border-white/5 pt-4">
                    <div className="text-slate-500 font-semibold uppercase text-xs mb-2">Networking Credentials</div>
                    <a
                      href={profile.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-accent-violet hover:underline inline-flex items-center gap-1.5"
                    >
                      View LinkedIn Profile
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Documents Submitted Display */}
        <div>
          <div className="glass p-6 rounded-3xl border border-white/5 space-y-4">
            <h3 className="text-lg font-bold text-white mb-2">Uploaded Credentials</h3>
            
            {/* Resume status */}
            <div className="flex items-center justify-between p-3 bg-dark-950/40 border border-white/5 rounded-xl text-xs">
              <span className="text-slate-400">Professional Resume</span>
              {verification?.resume_file ? (
                <a
                  href={getFileUrl(verification.resume_file)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent-violet hover:underline inline-flex items-center gap-1"
                >
                  View File
                </a>
              ) : (
                <span className="text-red-400">Not Uploaded</span>
              )}
            </div>

            {/* ID Card status */}
            <div className="flex items-center justify-between p-3 bg-dark-950/40 border border-white/5 rounded-xl text-xs">
              <span className="text-slate-400">Employee ID Card</span>
              {verification?.employee_id_file ? (
                <a
                  href={getFileUrl(verification.employee_id_file)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent-violet hover:underline inline-flex items-center gap-1"
                >
                  View File
                </a>
              ) : (
                <span className="text-red-400">Not Uploaded</span>
              )}
            </div>

            {/* Experience Letter status */}
            <div className="flex items-center justify-between p-3 bg-dark-950/40 border border-white/5 rounded-xl text-xs">
              <span className="text-slate-400">Experience Letter</span>
              {verification?.experience_letter ? (
                <a
                  href={getFileUrl(verification.experience_letter)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent-violet hover:underline inline-flex items-center gap-1"
                >
                  View File
                </a>
              ) : (
                <span className="text-slate-500">Not Provided</span>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* 4. Mock Interview Bookings Section */}
      <div className="glass p-6 sm:p-8 rounded-3xl border border-white/5 mt-8 relative">
        <div className="absolute top-0 right-0 w-80 h-80 bg-accent-violet/5 rounded-full blur-[100px] pointer-events-none"></div>
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-white/5">
          <div>
            <h3 className="text-xl font-bold text-white">Candidate Bookings</h3>
            <p className="text-slate-500 text-xs mt-1">Conduct interview drills, write evaluation comments, and access slots manager.</p>
          </div>
          <Link
            to="/hr/dashboard/slots"
            className="inline-flex items-center justify-center bg-accent-violet hover:bg-accent-violet/90 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition shadow-md self-start"
          >
            Configure Availability
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
                  ? 'bg-accent-violet text-white shadow'
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
            <div className="h-6 w-6 border-2 border-t-transparent border-accent-violet rounded-full animate-spin"></div>
          </div>
        ) : interviews.length === 0 ? (
          <div className="bg-dark-950/60 p-8 rounded-2xl text-center border border-white/5">
            <p className="text-slate-500 text-xs">No {interviewsTab} mock sessions found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {interviews.map((booking) => {
              const studentName = booking.student_details?.full_name || 'Student Candidate';
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
                  isPending ? 'border-amber-500/20' : 'border-white/5 hover:border-accent-violet/20'
                }`}>
                  <div>
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">Candidate</span>
                        <h4 className="text-white font-bold text-sm mt-0.5">{studentName}</h4>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-semibold uppercase ${
                        booking.booking_status === 'completed'
                          ? 'bg-accent-emerald/10 text-accent-emerald border border-accent-emerald/25'
                          : booking.booking_status === 'cancelled'
                          ? 'bg-accent-coral/10 text-accent-coral border border-accent-coral/25'
                          : isPending
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/25'
                          : 'bg-accent-violet/10 text-accent-violet border border-accent-violet/25'
                      }`}>
                        {isPending ? 'Awaiting Payment' : booking.booking_status}
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
                        Payout: ₹{Math.round(booking.slot_details?.price || 0)}
                      </div>

                      {/* Meeting link */}
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
                            Open Meeting Room
                          </a>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="border-t border-white/5 pt-4 mt-5 flex justify-end">
                    {!isPending && (
                      <Link
                        to={`/session/${booking.id}`}
                        className="bg-white/5 border border-white/10 hover:bg-white/10 text-white text-xs font-bold px-4 py-2 rounded-xl transition"
                      >
                        {interviewsTab === 'upcoming' ? 'Conduct Session' : 'View Evaluation'}
                      </Link>
                    )}
                    {isPending && (
                      <span className="text-amber-400 text-[10px] font-medium">Waiting for student payment...</span>
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
