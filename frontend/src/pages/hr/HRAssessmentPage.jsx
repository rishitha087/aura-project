import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { generateHRAssessment, submitHRAssessment } from '../../services/extensions';

const HRAssessmentPage = () => {
  const navigate = useNavigate();
  const [assessment, setAssessment] = useState(null);
  const [answers, setAnswers] = useState(['', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState('');
  
  // Timer state
  const [timeLeft, setTimeLeft] = useState(900); // 15 minutes
  const [testStarted, setTestStarted] = useState(false);

  useEffect(() => {
    let timer;
    if (testStarted && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && testStarted) {
      handleSubmit(); // Auto-submit when timer expires
    }
    return () => clearInterval(timer);
  }, [testStarted, timeLeft]);

  const handleStart = async () => {
    setError('');
    setStarting(true);
    try {
      const data = await generateHRAssessment();
      setAssessment(data);
      setAnswers(new Array(data.questions.length).fill(''));
      setTestStarted(true);
      setTimeLeft(900); // Reset timer to 15 mins
    } catch (err) {
      setError('Failed to generate skill assessment. Please check your profile.');
    } finally {
      setStarting(false);
    }
  };

  const handleAnswerChange = (index, val) => {
    const updated = [...answers];
    updated[index] = val;
    setAnswers(updated);
  };

  const handleSubmit = async () => {
    setError('');
    setLoading(true);
    setTestStarted(false); // Stop timer

    try {
      const data = await submitHRAssessment(answers);
      setAssessment(data);
    } catch (err) {
      setError('Failed to submit evaluation answers. Try again.');
      setTestStarted(true); // Resume timer if failed to submit
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="min-h-screen bg-dark-950 pt-28 pb-16 px-4 flex flex-col items-center relative overflow-hidden text-slate-200">
      {/* Glow elements */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-accent-violet/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="max-w-3xl w-full relative z-10">
        
        {/* Error message */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm mb-6 text-center">
            {error}
          </div>
        )}

        {/* 1. START SCREEN */}
        {!testStarted && (!assessment || assessment.score === 0) && (
          <div className="glass p-8 rounded-3xl border border-white/5 text-center shadow-2xl space-y-6">
            <div className="w-16 h-16 bg-accent-violet/10 border border-accent-violet/20 rounded-2xl flex items-center justify-center mx-auto text-accent-violet">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">AI-Powered HR Skill Assessment</h1>
            <p className="text-slate-400 text-sm max-w-lg mx-auto">
              Before you can list mock slots and conduct interviews, the system will assess your domain knowledge.
              You will get **5 medium-level questions** tailored to your selected technical, behavioral, and aptitude skills.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left max-w-md mx-auto pt-2">
              <div className="p-3 bg-dark-900/60 rounded-2xl border border-white/5">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Timed Test</span>
                <p className="text-sm font-semibold text-white mt-0.5">15 Minutes</p>
              </div>
              <div className="p-3 bg-dark-900/60 rounded-2xl border border-white/5">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Auto Evaluation</span>
                <p className="text-sm font-semibold text-white mt-0.5">Instant Score</p>
              </div>
              <div className="p-3 bg-dark-900/60 rounded-2xl border border-white/5">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Passing Target</span>
                <p className="text-sm font-semibold text-white mt-0.5">Score &ge; 70</p>
              </div>
            </div>
            <button
              onClick={handleStart}
              disabled={starting}
              className="bg-accent-violet hover:bg-accent-violet/90 text-white font-bold px-8 py-3 rounded-2xl transition shadow-lg shadow-accent-violet/20 flex items-center gap-3 mx-auto disabled:opacity-50"
            >
              {starting ? (
                <>
                  <div className="h-4 w-4 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
                  Generating Test...
                </>
              ) : (
                'Start Assessment Now'
              )}
            </button>
          </div>
        )}

        {/* 2. TIMED QUESTION INTERFACE */}
        {testStarted && assessment && (
          <div className="space-y-6">
            <div className="flex items-center justify-between bg-dark-900/60 border border-white/5 p-4 rounded-2xl">
              <div>
                <span className="text-xs text-slate-400 font-medium">Assessment Timer</span>
                <h3 className={`text-xl font-bold mt-0.5 ${timeLeft < 120 ? 'text-red-400 animate-pulse' : 'text-white'}`}>
                  {formatTime(timeLeft)}
                </h3>
              </div>
              <span className="text-xs font-bold text-accent-violet bg-accent-violet/10 px-3 py-1.5 rounded-xl border border-accent-violet/20">
                5 Questions
              </span>
            </div>

            <div className="space-y-6">
              {assessment.questions.map((q, idx) => (
                <div key={idx} className="glass p-6 rounded-3xl border border-white/5 shadow-xl space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded-md bg-white/5 border border-white/5 text-slate-400">
                      Question {idx + 1} &middot; {q.category}
                    </span>
                  </div>
                  <p className="text-white font-semibold text-sm leading-relaxed">{q.question}</p>
                  <textarea
                    rows={4}
                    value={answers[idx]}
                    onChange={(e) => handleAnswerChange(idx, e.target.value)}
                    placeholder="Provide your professional, detailed answer here..."
                    className="w-full bg-dark-950 border border-white/10 rounded-2xl p-4 text-slate-200 text-sm focus:outline-none focus:border-accent-violet placeholder-slate-650 resize-none"
                  />
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-4">
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="bg-accent-violet hover:bg-accent-violet/90 text-white font-bold px-8 py-3 rounded-2xl transition shadow-lg shadow-accent-violet/20 flex items-center gap-3 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="h-4 w-4 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
                    AI Evaluating Answers...
                  </>
                ) : (
                  'Submit Assessment'
                )}
              </button>
            </div>
          </div>
        )}

        {/* 3. REPORT CARD RESULT SCREEN */}
        {assessment && assessment.score > 0 && !testStarted && (
          <div className="glass p-8 rounded-3xl border border-white/5 shadow-2xl space-y-6">
            
            {/* Status Header */}
            <div className="text-center space-y-3">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto text-white shadow-lg ${
                assessment.is_passed 
                  ? 'bg-accent-emerald/20 border border-accent-emerald/40 text-accent-emerald' 
                  : 'bg-red-500/20 border border-red-500/40 text-red-400'
              }`}>
                {assessment.is_passed ? (
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </div>
              <h2 className="text-3xl font-extrabold text-white">
                {assessment.is_passed ? 'Assessment Passed!' : 'Assessment Failed'}
              </h2>
              <p className="text-slate-400 text-xs font-semibold">
                Graded score: <span className="text-white text-sm font-extrabold">{assessment.score}</span> / 100
              </p>
            </div>

            {/* AI Feedback Report Body */}
            <div className="p-5 bg-dark-950/60 border border-white/5 rounded-2xl space-y-3 text-slate-300">
              <h4 className="text-xs font-bold text-accent-violet uppercase tracking-wider">AI Assessor Report Notes</h4>
              <p className="text-xs leading-relaxed whitespace-pre-line">{assessment.feedback}</p>
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-center gap-4 pt-4">
              {assessment.is_passed ? (
                <button
                  onClick={() => navigate('/hr/dashboard')}
                  className="bg-accent-emerald hover:bg-accent-emerald/90 text-white font-bold px-8 py-3 rounded-2xl transition shadow-lg shadow-accent-emerald/20"
                >
                  Proceed to HR Dashboard
                </button>
              ) : (
                <button
                  onClick={handleStart}
                  className="bg-accent-violet hover:bg-accent-violet/90 text-white font-bold px-8 py-3 rounded-2xl transition shadow-lg shadow-accent-violet/20"
                >
                  Re-attempt Test
                </button>
              )}
            </div>

          </div>
        )}

      </div>
    </div>
  );
};

export default HRAssessmentPage;
