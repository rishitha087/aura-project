import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getHRSlots, createHRSlot, deleteHRSlot, getHRVerification } from '../../services/hr';

const SlotManager = () => {
  const [slots, setSlots] = useState([]);
  const [verification, setVerification] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form fields
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [duration, setDuration] = useState('30');
  const [price, setPrice] = useState('149'); // Default tier
  const [meetingLink, setMeetingLink] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      const verifyData = await getHRVerification();
      setVerification(verifyData);
      
      const slotsData = await getHRSlots();
      setSlots(slotsData);
    } catch (err) {
      setError('Could not retrieve slot metadata.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const calculateEndTime = (startStr, durationMin) => {
    if (!startStr) return '';
    const [hours, minutes] = startStr.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + parseInt(durationMin);
    const endHours = Math.floor(totalMinutes / 60) % 24;
    const endMins = totalMinutes % 60;
    return `${String(endHours).padStart(2, '0')}:${String(endMins).padStart(2, '0')}:00`;
  };

  const handleCreateSlot = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    // Verifications check
    if (verification?.verification_status !== 'approved') {
      setError('Only verified HR professionals can configure availability slots.');
      return;
    }

    // Client date check
    const selectedDate = new Date(`${date}T00:00:00`);
    const today = new Date();
    today.setHours(0,0,0,0);
    if (selectedDate < today) {
      setError('Slot date must be today or in the future.');
      return;
    }

    setSubmitting(true);
    try {
      const calculatedEnd = calculateEndTime(startTime, duration);
      
      const payload = {
        date,
        start_time: startTime + ':00', // DRF TimeField format
        end_time: calculatedEnd,
        duration: parseInt(duration),
        price: parseFloat(price),
        ...(meetingLink ? { meeting_link: meetingLink } : {})
      };

      await createHRSlot(payload);
      setSuccess('Availability slot created successfully.');
      
      // Reset form
      setDate('');
      setStartTime('');
      setDuration('30');
      setPrice('149');
      setMeetingLink('');

      // Refresh list
      const slotsData = await getHRSlots();
      setSlots(slotsData);
    } catch (err) {
      const fieldErrors = err.response?.data;
      if (fieldErrors && typeof fieldErrors === 'object') {
        const firstErrKey = Object.keys(fieldErrors)[0];
        const errMsg = fieldErrors[firstErrKey];
        setError(`${firstErrKey}: ${Array.isArray(errMsg) ? errMsg[0] : errMsg}`);
      } else {
        setError(err.response?.data?.detail || 'Failed to create slot.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSlot = async (id) => {
    if (!window.confirm('Are you sure you want to delete this availability slot?')) return;
    setError('');
    setSuccess('');
    try {
      await deleteHRSlot(id);
      setSuccess('Slot removed successfully.');
      const slotsData = await getHRSlots();
      setSlots(slotsData);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to delete slot. Already booked?');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <div className="h-10 w-10 border-4 border-t-transparent border-accent-violet rounded-full animate-spin"></div>
      </div>
    );
  }

  const isApproved = verification?.verification_status === 'approved';

  // Group slots
  const availableSlots = slots.filter(s => s.status === 'available');
  const bookedSlots = slots.filter(s => s.status === 'booked');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16">
      
      {/* Back to Dashboard */}
      <div className="mb-6">
        <Link to="/hr/dashboard" className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-xs transition">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to HR Dashboard
        </Link>
      </div>

      <div className="mb-10 text-center md:text-left">
        <h1 className="text-4xl font-extrabold text-white tracking-tight">
          Manage <span className="text-gradient">Availability Slots</span>
        </h1>
        <p className="text-slate-400 text-sm mt-2">
          Add interview availability, set durations, choose price tiers, and view scheduled sessions.
        </p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-2xl text-sm mb-6 text-center">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-accent-emerald/10 border border-accent-emerald/20 text-accent-emerald p-4 rounded-2xl text-sm mb-6 text-center">
          {success}
        </div>
      )}

      {/* Lock alert for unapproved users */}
      {!isApproved && (
        <div className="bg-amber-500/15 border border-amber-500/25 p-5 rounded-2xl mb-8 flex items-start gap-4 shadow-md">
          <svg className="w-6 h-6 text-amber-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <div>
            <h4 className="font-bold text-white text-sm">Onboarding Verification Required</h4>
            <p className="text-slate-400 text-xs mt-1 leading-relaxed">
              Your HR profile is currently **{verification?.verification_status || 'pending'}**. Admin approval is required before slot management can be unlocked.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Side: Create Slot Form (Disabled if not approved) */}
        <div className="lg:col-span-1">
          <div className="glass p-6 sm:p-8 rounded-3xl border border-white/5 space-y-6">
            <h3 className="text-lg font-bold text-white pb-3 border-b border-white/5">Create Availability Slot</h3>
            
            <form onSubmit={handleCreateSlot} className="space-y-4">
              <div>
                <label className="block text-slate-400 text-xs font-semibold mb-2">Session Date</label>
                <input
                  type="date"
                  required
                  disabled={!isApproved || submitting}
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-dark-950 border border-white/10 rounded-xl px-4 py-2.5 text-slate-100 text-xs focus:outline-none focus:border-primary-500 disabled:opacity-40"
                />
              </div>

              <div>
                <label className="block text-slate-400 text-xs font-semibold mb-2">Start Time</label>
                <input
                  type="time"
                  required
                  disabled={!isApproved || submitting}
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full bg-dark-950 border border-white/10 rounded-xl px-4 py-2.5 text-slate-100 text-xs focus:outline-none focus:border-primary-500 disabled:opacity-40"
                />
              </div>

              <div>
                <label className="block text-slate-400 text-xs font-semibold mb-2">Duration</label>
                <select
                  disabled={!isApproved || submitting}
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full bg-dark-950 border border-white/10 rounded-xl px-4 py-2.5 text-slate-100 text-xs focus:outline-none focus:border-primary-500 disabled:opacity-40"
                >
                  <option value="30">30 Minutes</option>
                  <option value="45">45 Minutes</option>
                  <option value="60">60 Minutes</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 text-xs font-semibold mb-2">Price Tier</label>
                <select
                  disabled={!isApproved || submitting}
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full bg-dark-950 border border-white/10 rounded-xl px-4 py-2.5 text-slate-100 text-xs focus:outline-none focus:border-primary-500 disabled:opacity-40"
                >
                  <option value="149">Basic Mentoring (₹149)</option>
                  <option value="299">Intermediate Drill (₹299)</option>
                  <option value="499">Advanced Simulation (₹499)</option>
                </select>
              </div>

              {/* Meeting Link */}
              <div>
                <label className="block text-slate-400 text-xs font-semibold mb-1">Meeting Link <span className="text-slate-600 font-normal">(optional)</span></label>
                <input
                  type="url"
                  disabled={!isApproved || submitting}
                  placeholder="https://meet.google.com/... or Zoom/Teams URL"
                  value={meetingLink}
                  onChange={(e) => setMeetingLink(e.target.value)}
                  className="w-full bg-dark-950 border border-white/10 rounded-xl px-4 py-2.5 text-slate-100 text-xs focus:outline-none focus:border-primary-500 disabled:opacity-40"
                />
                <p className="text-slate-600 text-[10px] mt-1">Students will receive this link after booking.</p>
              </div>

              <button
                type="submit"
                disabled={!isApproved || submitting}
                className="w-full bg-accent-violet hover:bg-accent-violet/90 text-white font-bold py-3 rounded-xl text-xs shadow-md transition disabled:opacity-50 mt-4"
              >
                {submitting ? 'Generating Slot...' : 'Create Active Slot'}
              </button>
            </form>
          </div>
        </div>

        {/* Right Side: Active Slots List */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Available Slots */}
          <div className="glass p-6 sm:p-8 rounded-3xl border border-white/5">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center justify-between">
              Available Openings
              <span className="bg-primary-500/10 border border-primary-500/20 text-primary-300 text-[10px] font-semibold px-2.5 py-0.5 rounded-full">
                {availableSlots.length} Slots
              </span>
            </h3>

            {availableSlots.length === 0 ? (
              <p className="text-slate-500 text-xs text-center py-6">No open slots. Add a slot using the creator form.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {availableSlots.map(s => (
                  <div key={s.id} className="bg-dark-950/60 border border-white/5 p-4 rounded-2xl flex flex-col justify-between hover:border-accent-violet/30 transition">
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-white font-bold text-sm">
                          {new Date(s.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                        </span>
                        <span className="bg-accent-violet/10 border border-accent-violet/20 text-accent-violet text-[10px] px-2 py-0.5 rounded-md font-semibold">
                          {s.duration} Mins
                        </span>
                      </div>
                      <div className="text-slate-400 text-xs mt-1">
                        {s.start_time.substring(0, 5)} - {s.end_time.substring(0, 5)}
                      </div>
                    </div>
                    
                    <div className="border-t border-white/5 pt-3 mt-4 flex items-center justify-between">
                      <span className="text-white font-extrabold text-sm">₹{Math.round(s.price)}</span>
                      <button
                        onClick={() => handleDeleteSlot(s.id)}
                        className="bg-accent-coral/10 hover:bg-accent-coral/20 border border-accent-coral/20 text-accent-coral text-[10px] font-semibold px-3 py-1.5 rounded-lg transition"
                      >
                        Cancel Slot
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Booked Slots (Read-only on this view) */}
          <div className="glass p-6 sm:p-8 rounded-3xl border border-white/5">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center justify-between">
              Booked Sessions
              <span className="bg-accent-emerald/10 border border-accent-emerald/20 text-accent-emerald text-[10px] font-semibold px-2.5 py-0.5 rounded-full">
                {bookedSlots.length} Booked
              </span>
            </h3>

            {bookedSlots.length === 0 ? (
              <p className="text-slate-500 text-xs text-center py-6">No slots have been reserved by students yet.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {bookedSlots.map(s => (
                  <div key={s.id} className="bg-dark-950/60 border border-white/5 p-4 rounded-2xl flex flex-col justify-between border-l-4 border-l-accent-emerald">
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-white font-bold text-sm">
                          {new Date(s.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                        </span>
                        <span className="bg-accent-emerald/15 border border-accent-emerald/25 text-accent-emerald text-[10px] px-2 py-0.5 rounded-md font-semibold">
                          Booked
                        </span>
                      </div>
                      <div className="text-slate-400 text-xs mt-1">
                        Time: {s.start_time.substring(0, 5)} - {s.end_time.substring(0, 5)} ({s.duration} mins)
                      </div>
                    </div>
                    
                    <div className="border-t border-white/5 pt-3 mt-4 flex items-center justify-between">
                      <span className="text-slate-500 text-[10px]">Fee: ₹{Math.round(s.price)}</span>
                      <Link
                        to="/hr/dashboard"
                        className="text-accent-violet hover:underline text-[10px] font-bold"
                      >
                        View in Dashboard
                      </Link>
                    </div>
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

export default SlotManager;
