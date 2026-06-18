import React, { useState, useEffect } from 'react';
import { getHRWallet, depositStudentWallet, withdrawHRWallet } from '../services/extensions';
import { getHRProfile } from '../services/hr';
import { getStudentProfile } from '../services/student';

const WalletPage = () => {
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [role, setRole] = useState('student');

  // Input states
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    const fetchWalletAndRole = async () => {
      try {
        const walletData = await getHRWallet();
        setWallet(walletData);
        
        // Fetch role via profile calls
        try {
          await getStudentProfile();
          setRole('student');
        } catch {
          await getHRProfile();
          setRole('hr');
        }
      } catch (err) {
        setError('Failed to fetch wallet information.');
      } finally {
        setLoading(false);
      }
    };
    fetchWalletAndRole();
  }, []);

  const handleDeposit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    if (!depositAmount || parseFloat(depositAmount) <= 0) return;

    setActionLoading(true);
    try {
      const data = await depositStudentWallet(parseFloat(depositAmount));
      setWallet(data);
      setDepositAmount('');
      setSuccessMsg(`Successfully deposited ₹${depositAmount} into your wallet!`);
    } catch (err) {
      setError('Deposit failed. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleWithdraw = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) return;

    setActionLoading(true);
    try {
      const data = await withdrawHRWallet(parseFloat(withdrawAmount));
      setWallet(data);
      setWithdrawAmount('');
      setSuccessMsg(`Withdrawal request of ₹${withdrawAmount} processed successfully!`);
    } catch (err) {
      setError(err.response?.data?.detail || 'Withdrawal failed. Check balance.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <div className="h-10 w-10 border-4 border-t-transparent border-primary-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-950 pt-28 pb-16 px-4 flex flex-col items-center relative overflow-hidden text-slate-200">
      {/* Background glow */}
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-accent-violet/5 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="max-w-4xl w-full relative z-10 space-y-8">
        
        {/* Header */}
        <div className="text-center sm:text-left mb-6">
          <h1 className="text-4xl font-extrabold text-white tracking-tight">
            Wallet <span className="text-gradient">Dashboard</span>
          </h1>
          <p className="text-slate-400 text-xs mt-1.5 font-medium">Manage your platform credits, balances, and withdrawal requests.</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm text-center">
            {error}
          </div>
        )}

        {successMsg && (
          <div className="bg-accent-emerald/10 border border-accent-emerald/20 text-accent-emerald p-4 rounded-xl text-sm text-center">
            {successMsg}
          </div>
        )}

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* 1. BALANCE CARD */}
          <div className="md:col-span-1 glass p-6 rounded-3xl border border-white/5 bg-gradient-to-br from-dark-900 via-dark-950 to-accent-violet/10 flex flex-col justify-between min-h-[220px] shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-accent-violet/10 rounded-full blur-3xl"></div>
            <div>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Available Balance</span>
              <h2 className="text-4xl font-black text-white mt-1.5">₹{wallet?.balance}</h2>
            </div>
            <div>
              <span className="text-[10px] text-slate-550 font-bold uppercase tracking-wider block">Promotional Credits</span>
              <span className="text-sm font-semibold text-slate-300">₹{wallet?.promo_credits}</span>
            </div>
            <div className="pt-4 border-t border-white/5 mt-4 flex items-center justify-between">
              <span className="text-[10px] text-slate-500 uppercase font-medium">Account Role</span>
              <span className="text-xs font-bold text-accent-violet capitalize bg-accent-violet/10 px-2.5 py-1 rounded-lg border border-accent-violet/10">
                {role}
              </span>
            </div>
          </div>

          {/* 2. TRANSACTION MODAL ACTIONS */}
          <div className="md:col-span-2 glass p-6 rounded-3xl border border-white/5 shadow-2xl flex flex-col justify-center min-h-[220px]">
            {role === 'student' ? (
              <form onSubmit={handleDeposit} className="space-y-4">
                <h3 className="text-lg font-bold text-white">Deposit Wallet Funds</h3>
                <p className="text-slate-400 text-xs leading-relaxed">
                  Top up your wallet balance. You can check out interview slots directly using your wallet balance.
                </p>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    required
                    placeholder="Enter amount (e.g. 500)"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    className="bg-dark-950 border border-white/10 rounded-xl px-4 py-2.5 text-slate-200 text-sm focus:outline-none focus:border-accent-violet placeholder-slate-650 flex-1"
                  />
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="bg-accent-violet hover:bg-accent-violet/90 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition shadow-lg shadow-accent-violet/20 disabled:opacity-50"
                  >
                    {actionLoading ? 'Processing...' : 'Deposit'}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleWithdraw} className="space-y-4">
                <h3 className="text-lg font-bold text-white">Request Wallet Withdrawal</h3>
                <p className="text-slate-400 text-xs leading-relaxed">
                  Submit a withdrawal request to transfer your earned interview revenue to your registered bank details.
                </p>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    required
                    placeholder="Enter amount (e.g. 1000)"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    className="bg-dark-950 border border-white/10 rounded-xl px-4 py-2.5 text-slate-200 text-sm focus:outline-none focus:border-accent-violet placeholder-slate-650 flex-1"
                  />
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="bg-accent-violet hover:bg-accent-violet/90 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition shadow-lg shadow-accent-violet/20 disabled:opacity-50"
                  >
                    {actionLoading ? 'Processing...' : 'Withdraw'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* 3. TRANSACTION HISTORY LIST */}
        <div className="glass p-6 rounded-3xl border border-white/5 shadow-2xl">
          <h3 className="text-lg font-bold text-white mb-4">Transaction History</h3>
          <div className="overflow-x-auto">
            {wallet?.transactions?.length === 0 ? (
              <p className="text-slate-600 text-sm py-4">No recent wallet transactions found.</p>
            ) : (
              <table className="w-full text-left text-xs text-slate-350">
                <thead>
                  <tr className="border-b border-white/5 text-slate-500 font-bold uppercase tracking-wider">
                    <th className="pb-3">Transaction ID</th>
                    <th className="pb-3">Type</th>
                    <th className="pb-3">Date</th>
                    <th className="pb-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {wallet?.transactions?.map((tx) => (
                    <tr key={tx.id} className="border-b border-white/5">
                      <td className="py-3 font-mono text-slate-400">TXN-{tx.id}</td>
                      <td className="py-3">
                        <span className={`capitalize font-bold ${
                          tx.transaction_type === 'deposit' || tx.transaction_type === 'payment_received'
                            ? 'text-accent-emerald' 
                            : 'text-red-400'
                        }`}>
                          {tx.transaction_type.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 text-slate-450">{new Date(tx.created_at).toLocaleString()}</td>
                      <td className={`py-3 text-right font-bold text-sm ${
                        tx.transaction_type === 'deposit' || tx.transaction_type === 'payment_received'
                          ? 'text-accent-emerald' 
                          : 'text-red-400'
                      }`}>
                        {tx.transaction_type === 'deposit' || tx.transaction_type === 'payment_received' ? '+' : '-'}
                        ₹{tx.amount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default WalletPage;
