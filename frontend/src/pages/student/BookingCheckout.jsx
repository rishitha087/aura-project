import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { createBooking } from '../../services/student';
import { createPaymentOrder, verifyPaymentSignature } from '../../services/payment';

const BookingCheckout = () => {
  const { slotId } = useParams();
  const navigate = useNavigate();
  
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [eligibilityError, setEligibilityError] = useState('');
  const [paymentError, setPaymentError] = useState('');
  const [processing, setProcessing] = useState(false);
  const [alreadyBooked, setAlreadyBooked] = useState(false);

  useEffect(() => {
    const initializeBooking = async () => {
      try {
        const data = await createBooking(slotId);
        setBooking(data);
      } catch (err) {
        const msg = err.response?.data?.detail || 'Failed to create interview booking.';
        // Check if this slot is already booked (by this same user — duplicate prevention)
        if (msg.toLowerCase().includes('already been booked') || msg.toLowerCase().includes('unavailable')) {
          setAlreadyBooked(true);
        }
        setEligibilityError(msg);
      } finally {
        setLoading(false);
      }
    };
    
    initializeBooking();
  }, [slotId]);

  // Load Razorpay Script helper
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePay = async () => {
    if (!booking) return;
    setPaymentError('');
    setProcessing(true);

    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        setPaymentError('Failed to load Razorpay SDK. Check your internet connection.');
        setProcessing(false);
        return;
      }

      const orderData = await createPaymentOrder(booking.id);

      const options = {
        key: orderData.key_id,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'PrepSync Mock Interview',
        description: `Mock Interview Session with ${booking.hr_details?.full_name}`,
        order_id: orderData.order_id,
        handler: async function (response) {
          setProcessing(true);
          try {
            await verifyPaymentSignature({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            navigate(`/session/${booking.id}?payment=success`);
          } catch (verifyErr) {
            setPaymentError('Payment verification failed. Please contact support.');
          } finally {
            setProcessing(false);
          }
        },
        prefill: {
          name: booking.student_details?.full_name,
          email: booking.student_details?.email,
        },
        theme: { color: '#6366F1' },
        modal: {
          ondismiss: function () {
            setProcessing(false);
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();

    } catch (err) {
      setPaymentError(err.response?.data?.detail || 'Failed to initialize payment. Please try again.');
      setProcessing(false);
    }
  };

  // Sandbox simulate payment (no real Razorpay keys needed)
  const handleSandboxSimulate = async () => {
    if (!booking) return;
    setPaymentError('');
    setProcessing(true);

    try {
      const orderData = await createPaymentOrder(booking.id);
      
      await verifyPaymentSignature({
        razorpay_order_id: orderData.order_id,
        razorpay_payment_id: 'pay_mock_' + Math.random().toString(36).substr(2, 9),
        razorpay_signature: 'mock_signature',
      });

      navigate(`/session/${booking.id}?payment=success`);
    } catch (err) {
      setPaymentError('Simulation failed: ' + (err.response?.data?.detail || 'Unknown error.'));
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <div className="text-center">
          <div className="h-10 w-10 border-4 border-t-transparent border-primary-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400 text-xs">Reserving your interview slot...</p>
        </div>
      </div>
    );
  }

  if (eligibilityError) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16 text-center">
        <div className="glass p-8 rounded-3xl border border-red-500/20 max-w-lg mx-auto">
          <svg className="w-12 h-12 text-amber-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h3 className="text-xl font-bold text-white">{alreadyBooked ? 'Slot Unavailable' : 'Booking Locked'}</h3>
          <p className="text-slate-400 text-xs mt-3 leading-relaxed">{eligibilityError}</p>
          <div className="flex gap-4 justify-center mt-6">
            <Link to="/hrs" className="bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 text-xs font-bold px-5 py-2.5 rounded-xl transition">
              Browse Other HRs
            </Link>
            <Link to="/student/dashboard" className="bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition">
              Go to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const slot = booking?.slot_details;
  const hr = booking?.hr_details;
  const meetingLink = booking?.meeting_link;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16">
      <div className="max-w-xl mx-auto">
        
        {/* Back */}
        <Link to="/hrs" className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-xs transition mb-8">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Browse HRs
        </Link>

        <h1 className="text-3xl font-extrabold text-white text-center mb-8">
          Checkout & <span className="text-gradient">Payment</span>
        </h1>

        {/* Payment Error */}
        {paymentError && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-2xl text-xs mb-6 text-center">
            {paymentError}
          </div>
        )}

        {/* Booking Reserved Notice */}
        <div className="bg-amber-500/10 border border-amber-500/20 text-amber-300 p-3 rounded-xl text-xs mb-6 text-center flex items-center justify-center gap-2">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0-8v4m-6 6h12a2 2 0 002-2V7a2 2 0 00-2-2H6a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          Slot reserved. Complete payment to confirm your booking.
        </div>

        {/* Summary Card */}
        <div className="glass p-6 sm:p-8 rounded-3xl border border-white/5 space-y-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-primary-500/5 rounded-full blur-3xl pointer-events-none"></div>

          <div>
            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">Mentoring Session</span>
            <h3 className="text-xl font-extrabold text-white mt-1">Mock Interview Simulation</h3>
            <p className="text-slate-400 text-xs mt-1">Conducted by <strong className="text-slate-200">{hr?.full_name}</strong></p>
          </div>

          <div className="border-t border-white/5 pt-4 grid grid-cols-2 gap-4 text-xs">
            <div>
              <div className="text-slate-500 font-semibold uppercase text-[10px]">Date</div>
              <div className="text-white font-bold mt-0.5">
                {slot?.date ? new Date(slot.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : '—'}
              </div>
            </div>
            <div>
              <div className="text-slate-500 font-semibold uppercase text-[10px]">Time</div>
              <div className="text-white font-bold mt-0.5">
                {slot ? `${slot.start_time?.substring(0, 5)} – ${slot.end_time?.substring(0, 5)} (${slot.duration} min)` : '—'}
              </div>
            </div>
          </div>

          {/* Meeting link preview */}
          {meetingLink && (
            <div className="border-t border-white/5 pt-4">
              <div className="text-slate-500 font-semibold uppercase text-[10px] mb-1.5">Meeting Link</div>
              <div className="flex items-center gap-2 bg-accent-emerald/10 border border-accent-emerald/20 rounded-xl px-3 py-2">
                <svg className="w-4 h-4 text-accent-emerald flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <span className="text-accent-emerald text-xs font-medium truncate">{meetingLink}</span>
              </div>
              <p className="text-slate-600 text-[10px] mt-1">This link will be fully accessible after payment confirmation.</p>
            </div>
          )}

          {/* Pricing breakdown */}
          <div className="border-t border-white/5 pt-4 space-y-3 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>Session Booking Fee</span>
              <span>₹{Math.round(slot?.price || 0)}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Taxes & Platform Fees</span>
              <span>₹0.00</span>
            </div>
            <div className="h-px bg-white/5 my-2" />
            <div className="flex justify-between text-sm font-extrabold text-white">
              <span>Total Amount</span>
              <span>₹{Math.round(slot?.price || 0)}</span>
            </div>
          </div>

          {/* Buttons */}
          <div className="pt-6 space-y-3">
            <button
              onClick={handlePay}
              disabled={processing}
              className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3.5 rounded-2xl text-xs transition shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {processing ? (
                <div className="h-4 w-4 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                  Pay via Razorpay
                </>
              )}
            </button>

            {/* Sandbox Simulate Payment */}
            <button
              onClick={handleSandboxSimulate}
              disabled={processing}
              className="w-full bg-white/5 border border-white/10 hover:bg-white/10 text-accent-violet font-semibold py-3 rounded-2xl text-xs transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Simulate Test Payment (Dev Sandbox)
            </button>
            
            <p className="text-[10px] text-slate-500 text-center mt-2 leading-relaxed">
              Your booking is confirmed once payment completes. You'll get access to the meeting link to join at the scheduled time.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default BookingCheckout;
