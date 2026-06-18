import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  getAdminStats,
  getAdminUsers,
  getAdminVerifications,
  updateVerification,
  getAdminBookings,
  getAdminContacts,
  updateContact,
} from '../../services/admin';

/* ───────────────────────────────────────────────
   Helpers
─────────────────────────────────────────────── */
const fmtNum  = (n) => Number(n || 0).toLocaleString('en-IN');
const fmtMoney = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const STATUS_STYLES = {
  pending:     'bg-amber-500/10 text-amber-400 border-amber-500/20',
  approved:    'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  rejected:    'bg-red-500/10 text-red-400 border-red-500/20',
  confirmed:   'bg-primary-500/10 text-primary-400 border-primary-500/20',
  completed:   'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  cancelled:   'bg-red-500/10 text-red-400 border-red-500/20',
  new:         'bg-primary-500/10 text-primary-400 border-primary-500/20',
  in_progress: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  resolved:    'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  success:     'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  failed:      'bg-red-500/10 text-red-400 border-red-500/20',
  no_docs:     'bg-slate-500/10 text-slate-400 border-slate-500/20',
};

const Badge = ({ status }) => (
  <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-bold border capitalize ${STATUS_STYLES[status] || STATUS_STYLES.pending}`}>
    {String(status || 'unknown').replace('_', ' ')}
  </span>
);

const Spinner = ({ size = 'md' }) => {
  const s = size === 'sm' ? 'h-5 w-5 border-2' : 'h-8 w-8 border-2';
  return <div className={`${s} border-t-transparent border-primary-400 rounded-full animate-spin`} />;
};

const CenterLoader = () => (
  <div className="flex items-center justify-center py-20">
    <Spinner />
  </div>
);

const Avatar = ({ name, gradient = 'from-primary-500 to-accent-violet' }) => (
  <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white text-sm font-black flex-shrink-0`}>
    {(name || '?')[0].toUpperCase()}
  </div>
);

/* ───────────────────────────────────────────────
   Overview stat card
─────────────────────────────────────────────── */
const StatCard = ({ icon, label, value, sub, border }) => (
  <div className={`relative overflow-hidden rounded-2xl border p-5 hover:scale-[1.02] transition-all duration-200 cursor-default ${border || 'border-white/10 bg-white/3'}`}>
    <div className="text-2xl mb-2">{icon}</div>
    <div className="text-2xl lg:text-3xl font-black text-white">{value}</div>
    <div className="text-slate-400 text-sm font-medium mt-0.5">{label}</div>
    {sub && <div className="text-slate-600 text-xs mt-1">{sub}</div>}
  </div>
);

/* ───────────────────────────────────────────────
   Table wrapper
─────────────────────────────────────────────── */
const Table = ({ cols, children, empty = 'No data found' }) => (
  <div className="rounded-2xl border border-white/8 overflow-x-auto bg-white/2">
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-white/5">
          {cols.map(c => (
            <th key={c} className="px-5 py-3.5 text-left text-slate-500 text-xs font-semibold uppercase tracking-wider whitespace-nowrap">{c}</th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-white/4">
        {children}
        {React.Children.count(children) === 0 && (
          <tr>
            <td colSpan={cols.length} className="px-5 py-16 text-center text-slate-500 text-sm">{empty}</td>
          </tr>
        )}
      </tbody>
    </table>
  </div>
);

/* ═══════════════════════════════════════════════
   OVERVIEW TAB
═══════════════════════════════════════════════ */
const OverviewTab = ({ stats, onRefresh }) => {
  if (!stats) return <CenterLoader />;

  return (
    <div className="space-y-7 animate-fade-in">
      {/* Primary stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard icon="🎓" label="Total Students"     value={fmtNum(stats.total_students)}      border="border-primary-500/20 bg-primary-500/5" />
        <StatCard icon="💼" label="HR Professionals"   value={fmtNum(stats.total_hrs)}            border="border-violet-500/20 bg-violet-500/5" />
        <StatCard icon="📅" label="Total Bookings"     value={fmtNum(stats.total_bookings)}       sub={`${fmtNum(stats.completed_bookings)} completed`} border="border-emerald-500/20 bg-emerald-500/5" />
        <StatCard icon="💰" label="Total Revenue"      value={fmtMoney(stats.total_revenue)}      border="border-amber-500/20 bg-amber-500/5" />
      </div>
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard icon="⏳" label="Pending HR Approvals" value={fmtNum(stats.pending_verifications)} border="border-red-500/20 bg-red-500/5" />
        <StatCard icon="✅" label="Approved HRs"        value={fmtNum(stats.approved_hrs)}          border="border-emerald-500/20 bg-emerald-500/5" />
        <StatCard icon="📩" label="New Queries"         value={fmtNum(stats.new_contacts)}          sub={`of ${fmtNum(stats.total_contacts)} total`} border="border-primary-500/20 bg-primary-500/5" />
        <StatCard icon="📋" label="Confirmed Sessions"  value={fmtNum(stats.confirmed_bookings)}    border="border-violet-500/20 bg-violet-500/5" />
      </div>

      {/* Recent activity panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Recent Students */}
        <div className="rounded-2xl border border-white/8 p-5 bg-white/2">
          <h3 className="text-white font-bold text-sm mb-4 flex items-center gap-2"><span>🎓</span> Recent Students</h3>
          <div className="space-y-3">
            {(stats.recent_students || []).map(s => (
              <div key={s.id} className="flex items-center gap-3">
                <Avatar name={s.full_name} />
                <div className="min-w-0">
                  <p className="text-white text-xs font-semibold truncate">{s.full_name}</p>
                  <p className="text-slate-500 text-[10px] truncate">{s.email}</p>
                </div>
                <span className="ml-auto text-slate-600 text-[10px] flex-shrink-0">{fmtDate(s.created_at)}</span>
              </div>
            ))}
            {!stats.recent_students?.length && <p className="text-slate-600 text-xs text-center py-4">No students yet</p>}
          </div>
        </div>
        {/* Recent HRs */}
        <div className="rounded-2xl border border-white/8 p-5 bg-white/2">
          <h3 className="text-white font-bold text-sm mb-4 flex items-center gap-2"><span>💼</span> Recent HR Registrations</h3>
          <div className="space-y-3">
            {(stats.recent_hrs || []).map(h => (
              <div key={h.id} className="flex items-center gap-3">
                <Avatar name={h.full_name} gradient="from-violet-500 to-pink-500" />
                <div className="min-w-0">
                  <p className="text-white text-xs font-semibold truncate">{h.full_name}</p>
                  <p className="text-slate-500 text-[10px] truncate">{h.email}</p>
                </div>
                <span className="ml-auto text-slate-600 text-[10px] flex-shrink-0">{fmtDate(h.created_at)}</span>
              </div>
            ))}
            {!stats.recent_hrs?.length && <p className="text-slate-600 text-xs text-center py-4">No HRs yet</p>}
          </div>
        </div>
        {/* Recent Bookings */}
        <div className="rounded-2xl border border-white/8 p-5 bg-white/2">
          <h3 className="text-white font-bold text-sm mb-4 flex items-center gap-2"><span>📅</span> Recent Bookings</h3>
          <div className="space-y-2">
            {(stats.recent_bookings || []).map(b => (
              <div key={b.id} className="rounded-xl bg-white/3 border border-white/5 p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-white text-xs font-semibold">{b.student}</span>
                  <Badge status={b.status} />
                </div>
                <p className="text-slate-500 text-[10px]">with {b.hr} · {b.date}</p>
              </div>
            ))}
            {!stats.recent_bookings?.length && <p className="text-slate-600 text-xs text-center py-4">No bookings yet</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════
   STUDENTS TAB
═══════════════════════════════════════════════ */
const StudentsTab = () => {
  const [users, setUsers]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [search, setSearch]   = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    getAdminUsers('student')
      .then(setUsers)
      .catch(e => setError(e?.response?.data?.detail || 'Failed to load students'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = users.filter(u =>
    [u.full_name, u.email, u.phone_number].some(f => f?.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input type="text" placeholder="Search by name or email…" value={search} onChange={e => setSearch(e.target.value)} className="input-premium pl-10 py-2.5 text-sm w-full" />
        </div>
        <span className="text-xs text-slate-500 bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl font-semibold">{filtered.length} students</span>
      </div>

      {error && <div className="rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3">{error}</div>}
      {loading ? <CenterLoader /> : (
        <Table cols={['#', 'Student', 'Email', 'Phone', 'Joined']}>
          {filtered.map((u, i) => (
            <tr key={u.id} className="hover:bg-white/3 transition-colors">
              <td className="px-5 py-4 text-slate-600 text-xs">{i + 1}</td>
              <td className="px-5 py-4">
                <div className="flex items-center gap-3">
                  <Avatar name={u.full_name} />
                  <span className="text-white text-sm font-medium">{u.full_name}</span>
                </div>
              </td>
              <td className="px-5 py-4 text-slate-400 text-xs">{u.email}</td>
              <td className="px-5 py-4 text-slate-400 text-xs">{u.phone_number || '—'}</td>
              <td className="px-5 py-4 text-slate-500 text-xs">{fmtDate(u.created_at)}</td>
            </tr>
          ))}
        </Table>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════
   HR PROFESSIONALS TAB  (the most critical one)
═══════════════════════════════════════════════ */
const HRsTab = () => {
  const [verifs, setVerifs]         = useState([]);   // all HRVerification objects with hr_details embedded
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [search, setSearch]         = useState('');
  const [filterStatus, setFilter]   = useState('all');
  const [actionLoading, setActLoad] = useState(null);  // verifId+action
  const [successMsg, setSuccess]    = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      // getAdminVerifications returns HRVerificationAdminSerializer objects
      // which include hr_details (nested user) and hr_profile
      const data = await getAdminVerifications();
      setVerifs(data);
    } catch (e) {
      setError(e?.response?.data?.detail || 'Failed to load HR verifications. Check admin permissions.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAction = async (verifId, newStatus) => {
    const key = `${verifId}-${newStatus}`;
    setActLoad(key);
    setSuccess('');
    setError('');
    try {
      await updateVerification(verifId, { verification_status: newStatus });
      setSuccess(`HR ${newStatus === 'approved' ? 'approved ✓' : 'rejected ✗'} successfully`);
      await load();
      setTimeout(() => setSuccess(''), 3000);
    } catch (e) {
      setError(e?.response?.data?.detail || `Failed to ${newStatus} HR.`);
    } finally {
      setActLoad(null);
    }
  };

  const filtered = verifs.filter(v => {
    const name  = v.hr_details?.full_name || '';
    const email = v.hr_details?.email || '';
    const matchSearch = name.toLowerCase().includes(search.toLowerCase()) || email.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || v.verification_status === filterStatus;
    return matchSearch && matchStatus;
  });

  const pendingCount = verifs.filter(v => v.verification_status === 'pending').length;

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input type="text" placeholder="Search HR by name or email…" value={search} onChange={e => setSearch(e.target.value)} className="input-premium pl-10 py-2.5 text-sm w-full" />
        </div>
        {/* Status filter pills */}
        <div className="flex gap-1 p-1 bg-white/5 rounded-xl border border-white/8">
          {['all', 'pending', 'approved', 'rejected'].map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all capitalize ${
                filterStatus === s ? 'bg-primary-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}>
              {s}
              {s === 'pending' && pendingCount > 0 && (
                <span className="ml-1 bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-md">{pendingCount}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Alerts */}
      {error   && <div className="rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3">{error}</div>}
      {successMsg && <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm px-4 py-3">{successMsg}</div>}

      {loading ? <CenterLoader /> : (
        <Table cols={['HR Professional', 'Email', 'Company', 'Joined', 'Documents', 'Status', 'Actions']}>
          {filtered.map(v => {
            const vstatus = v.verification_status;
            const name    = v.hr_details?.full_name  || 'Unknown';
            const email   = v.hr_details?.email      || '—';
            const company = v.hr_profile?.company_name || '—';
            const joined  = fmtDate(v.hr_details?.created_at);
            const hasDocs = v.resume_file || v.employee_id_file || v.experience_letter;
            const key     = `${v.id}-`;

            return (
              <tr key={v.id} className="hover:bg-white/3 transition-colors">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <Avatar name={name} gradient="from-violet-500 to-pink-500" />
                    <div>
                      <p className="text-white text-sm font-semibold">{name}</p>
                      {v.hr_profile?.designation && <p className="text-slate-500 text-[10px]">{v.hr_profile.designation}</p>}
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4 text-slate-400 text-xs max-w-[160px] truncate">{email}</td>
                <td className="px-5 py-4 text-slate-400 text-xs">{company}</td>
                <td className="px-5 py-4 text-slate-500 text-xs">{joined}</td>
                <td className="px-5 py-4">
                  {hasDocs ? (
                    <div className="flex flex-col gap-1">
                      {v.resume_file      && <a href={v.resume_file}      target="_blank" rel="noreferrer" className="text-primary-400 text-[10px] hover:underline">📄 Resume</a>}
                      {v.employee_id_file && <a href={v.employee_id_file} target="_blank" rel="noreferrer" className="text-primary-400 text-[10px] hover:underline">🪪 ID Card</a>}
                      {v.experience_letter && <a href={v.experience_letter} target="_blank" rel="noreferrer" className="text-primary-400 text-[10px] hover:underline">📋 Exp Letter</a>}
                    </div>
                  ) : <span className="text-slate-600 text-xs">No docs</span>}
                </td>
                <td className="px-5 py-4"><Badge status={vstatus} /></td>
                <td className="px-5 py-4">
                  <div className="flex gap-2">
                    {vstatus !== 'approved' && (
                      <button
                        onClick={() => handleAction(v.id, 'approved')}
                        disabled={!!actionLoading}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold hover:bg-emerald-500/20 transition-all disabled:opacity-40"
                      >
                        {actionLoading === `${key}approved` ? <Spinner size="sm" /> : '✓'} Approve
                      </button>
                    )}
                    {vstatus !== 'rejected' && (
                      <button
                        onClick={() => handleAction(v.id, 'rejected')}
                        disabled={!!actionLoading}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold hover:bg-red-500/20 transition-all disabled:opacity-40"
                      >
                        {actionLoading === `${key}rejected` ? <Spinner size="sm" /> : '✗'} Reject
                      </button>
                    )}
                    {vstatus === 'approved' && !actionLoading && (
                      <span className="text-emerald-400 text-xs font-semibold flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Verified
                      </span>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </Table>
      )}

      {!loading && filtered.length === 0 && !error && (
        <div className="rounded-2xl border border-white/8 p-12 text-center">
          <p className="text-slate-500 text-sm">No HR professionals match your filter.</p>
        </div>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════
   BOOKINGS TAB
═══════════════════════════════════════════════ */
const BookingsTab = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [filter, setFilter]     = useState('all');

  useEffect(() => {
    setLoading(true);
    setError('');
    getAdminBookings(filter === 'all' ? undefined : filter)
      .then(setBookings)
      .catch(e => setError(e?.response?.data?.detail || 'Failed to load bookings'))
      .finally(() => setLoading(false));
  }, [filter]);

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-xs text-slate-500 bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl font-semibold">{bookings.length} bookings</span>
        <div className="flex gap-1 p-1 bg-white/5 rounded-xl border border-white/8">
          {['all', 'pending', 'confirmed', 'completed', 'cancelled'].map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all capitalize ${
                filter === s ? 'bg-primary-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}>{s}</button>
          ))}
        </div>
      </div>

      {error && <div className="rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3">{error}</div>}
      {loading ? <CenterLoader /> : (
        <Table cols={['ID', 'Student', 'HR Professional', 'Date', 'Booking', 'Payment', 'Amount']}>
          {bookings.map(b => (
            <tr key={b.id} className="hover:bg-white/3 transition-colors">
              <td className="px-5 py-4 text-slate-500 text-xs font-mono">#{b.id}</td>
              <td className="px-5 py-4">
                <div className="flex items-center gap-2">
                  <Avatar name={b.student_details?.full_name} />
                  <span className="text-white text-sm">{b.student_details?.full_name || '—'}</span>
                </div>
              </td>
              <td className="px-5 py-4">
                <div className="flex items-center gap-2">
                  <Avatar name={b.hr_details?.full_name} gradient="from-violet-500 to-pink-500" />
                  <span className="text-white text-sm">{b.hr_details?.full_name || '—'}</span>
                </div>
              </td>
              <td className="px-5 py-4 text-slate-400 text-xs">{b.slot_details ? fmtDate(b.slot_details.date) : '—'}</td>
              <td className="px-5 py-4"><Badge status={b.booking_status} /></td>
              <td className="px-5 py-4"><Badge status={b.payment_status} /></td>
              <td className="px-5 py-4 text-white text-sm font-bold">
                {b.slot_details?.price ? `₹${Math.round(b.slot_details.price)}` : '—'}
              </td>
            </tr>
          ))}
        </Table>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════
   CONTACT QUERIES TAB
═══════════════════════════════════════════════ */
const ContactsTab = () => {
  const [contacts, setContacts]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [filter, setFilter]       = useState('all');
  const [expanded, setExpanded]   = useState(null);
  const [reply, setReply]         = useState('');
  const [saving, setSaving]       = useState(false);

  const load = useCallback(async (f) => {
    setLoading(true);
    setError('');
    try {
      const data = await getAdminContacts(f === 'all' ? undefined : f);
      setContacts(data);
    } catch (e) {
      setError(e?.response?.data?.detail || 'Failed to load contacts');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(filter); }, [filter, load]);

  const handleUpdate = async (id, newStatus) => {
    setSaving(true);
    try {
      await updateContact(id, { status: newStatus, admin_reply: reply });
      setExpanded(null);
      setReply('');
      await load(filter);
    } catch (e) {
      setError(e?.response?.data?.detail || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-xs text-slate-500 bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl font-semibold">{contacts.length} queries</span>
        <div className="flex gap-1 p-1 bg-white/5 rounded-xl border border-white/8">
          {['all', 'new', 'in_progress', 'resolved'].map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all capitalize ${
                filter === s ? 'bg-primary-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}>{s.replace('_', ' ')}</button>
          ))}
        </div>
      </div>

      {error && <div className="rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3">{error}</div>}
      {loading ? <CenterLoader /> : (
        <div className="space-y-3">
          {contacts.map(c => (
            <div key={c.id} className="rounded-2xl border border-white/8 bg-white/2 overflow-hidden">
              <div className="p-5">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap mb-2">
                      <span className="text-white font-bold text-sm">{c.name}</span>
                      <span className="text-slate-500 text-xs">{c.email}</span>
                      <Badge status={c.status} />
                      <span className="text-slate-600 text-[10px]">{fmtDate(c.created_at)}</span>
                    </div>
                    {c.subject && <p className="text-primary-300 text-xs font-semibold mb-2">Re: {c.subject}</p>}
                    <p className="text-slate-300 text-sm leading-relaxed">{c.message}</p>
                    {c.admin_reply && (
                      <div className="mt-3 p-3 rounded-xl bg-primary-500/8 border border-primary-500/15">
                        <p className="text-primary-400 text-[10px] font-bold mb-1 uppercase tracking-wider">Admin Reply</p>
                        <p className="text-slate-300 text-xs leading-relaxed">{c.admin_reply}</p>
                      </div>
                    )}
                  </div>
                  {c.status !== 'resolved' && (
                    <button
                      onClick={() => { setExpanded(expanded === c.id ? null : c.id); setReply(c.admin_reply || ''); }}
                      className="flex-shrink-0 px-3 py-2 rounded-xl bg-primary-500/10 border border-primary-500/20 text-primary-400 text-xs font-bold hover:bg-primary-500/20 transition-all"
                    >{expanded === c.id ? 'Cancel' : 'Reply'}</button>
                  )}
                </div>
              </div>

              {expanded === c.id && (
                <div className="border-t border-white/5 p-5 bg-white/2 space-y-3">
                  <textarea
                    rows={3} placeholder="Write your reply…"
                    value={reply} onChange={e => setReply(e.target.value)}
                    className="input-premium resize-none text-sm w-full"
                  />
                  <div className="flex gap-2">
                    <button onClick={() => handleUpdate(c.id, 'resolved')} disabled={saving}
                      className="px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold hover:bg-emerald-500/20 transition-all disabled:opacity-50">
                      {saving ? 'Saving…' : '✓ Mark Resolved'}
                    </button>
                    <button onClick={() => handleUpdate(c.id, 'in_progress')} disabled={saving}
                      className="px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold hover:bg-amber-500/20 transition-all disabled:opacity-50">
                      In Progress
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
          {!contacts.length && !error && (
            <div className="rounded-2xl border border-white/8 p-12 text-center">
              <p className="text-slate-500 text-sm">No contact queries found.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════
   MAIN ADMIN DASHBOARD
═══════════════════════════════════════════════ */
const TABS = [
  { id: 'overview',  icon: '📊', label: 'Overview'       },
  { id: 'hrs',       icon: '💼', label: 'HR Approvals'   },
  { id: 'students',  icon: '🎓', label: 'Students'       },
  { id: 'bookings',  icon: '📅', label: 'Bookings'       },
  { id: 'contacts',  icon: '📩', label: 'Contact Queries' },
];

const AdminDashboard = () => {
  const { user, logout, isAdmin } = useAuth();
  const navigate                  = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats]         = useState(null);
  const [statsErr, setStatsErr]   = useState('');

  // Guard: if not admin, boot immediately
  useEffect(() => {
    if (user && !isAdmin) navigate('/', { replace: true });
  }, [user, isAdmin, navigate]);

  useEffect(() => {
    if (!isAdmin) return;
    getAdminStats()
      .then(setStats)
      .catch(e => setStatsErr(e?.response?.data?.detail || 'Could not load stats — are you logged in as admin?'));
  }, [isAdmin]);

  const handleLogout = () => { logout(); navigate('/'); };

  if (!user || !isAdmin) return null;

  const pendingBadge = stats?.pending_verifications || 0;
  const newQueryBadge = stats?.new_contacts || 0;

  return (
    <div className="min-h-screen bg-dark-950">

      {/* ─── Admin top-bar ───────────────────────────────────── */}
      <div className="fixed top-16 left-0 right-0 z-40 border-b border-white/5 bg-dark-900/95 backdrop-blur-xl shadow-lg shadow-black/40">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-red-500 flex items-center justify-center text-white text-sm font-black shadow-lg shadow-amber-500/30">
              ⚙
            </div>
            <div>
              <p className="text-white text-sm font-black leading-none">Admin Dashboard</p>
              <p className="text-slate-500 text-[10px]">{user.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {stats && (
              <div className="hidden sm:flex items-center gap-4 text-xs text-slate-500">
                <span>👥 {fmtNum(stats.total_students)} students</span>
                <span>💼 {fmtNum(stats.total_hrs)} HRs</span>
                {pendingBadge > 0 && (
                  <span className="bg-red-500/15 border border-red-500/25 text-red-400 px-2.5 py-1 rounded-lg font-bold animate-pulse">
                    {pendingBadge} pending approval{pendingBadge !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
            )}
            <button onClick={handleLogout} className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-all text-xs font-semibold">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* ─── Page body ───────────────────────────────────────── */}
      <div className="pt-32 pb-20 max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Page heading */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-black text-white">
            Platform <span className="text-gradient">Control Centre</span>
          </h1>
          <p className="text-slate-400 mt-1 text-sm">Manage all users, HR approvals, bookings and queries from one place.</p>
        </div>

        {statsErr && (
          <div className="mb-6 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3">{statsErr}</div>
        )}

        {/* Tab bar */}
        <div className="flex flex-wrap gap-1 p-1.5 bg-dark-800/70 rounded-2xl border border-white/5 mb-8">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 whitespace-nowrap
                ${activeTab === tab.id
                  ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
              {tab.id === 'hrs' && pendingBadge > 0 && (
                <span className="bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-md leading-none animate-pulse">
                  {pendingBadge}
                </span>
              )}
              {tab.id === 'contacts' && newQueryBadge > 0 && (
                <span className="bg-primary-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-md leading-none">
                  {newQueryBadge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === 'overview'  && <OverviewTab stats={stats} />}
        {activeTab === 'hrs'       && <HRsTab />}
        {activeTab === 'students'  && <StudentsTab />}
        {activeTab === 'bookings'  && <BookingsTab />}
        {activeTab === 'contacts'  && <ContactsTab />}
      </div>
    </div>
  );
};

export default AdminDashboard;
