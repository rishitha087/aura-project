import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { updateStudentProfile, uploadStudentResume } from '../../services/student';

const Onboarding = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form states
  const [academic, setAcademic] = useState({ college_name: '', degree: '', branch: '', graduation_year: '' });
  const [skills, setSkills] = useState([]);
  const [customSkill, setCustomSkill] = useState('');
  const [careerGoal, setCareerGoal] = useState('');
  const [resumeFile, setResumeFile] = useState(null);

  // Suggested skills list
  const suggestedSkills = ['Java', 'Python', 'React', 'SQL', 'Data Structures', 'Aptitude', 'Node.js', 'C++', 'Git'];

  // Completion calculation helper
  const calculateCompleteness = () => {
    let completion = 0;
    if (academic.college_name && academic.degree && academic.branch && academic.graduation_year) {
      completion += 30;
    }
    if (resumeFile) {
      completion += 30;
    }
    if (skills.length > 0) {
      completion += 20;
    }
    if (careerGoal) {
      completion += 20;
    }
    return completion;
  };

  const handleNext = () => {
    setError('');
    // Validations
    if (step === 1) {
      if (!academic.college_name || !academic.degree || !academic.branch || !academic.graduation_year) {
        setError('Please fill in all academic details.');
        return;
      }
    }
    if (step === 2) {
      if (!resumeFile) {
        setError('Please upload your resume to proceed.');
        return;
      }
    }
    if (step === 3) {
      if (skills.length === 0) {
        setError('Please select at least one skill tag.');
        return;
      }
    }

    setStep(step + 1);
  };

  const handleBack = () => {
    setError('');
    setStep(step - 1);
  };

  const handleAddSkill = (skill) => {
    if (skill && !skills.includes(skill)) {
      setSkills([...skills, skill]);
    }
    setCustomSkill('');
  };

  const handleRemoveSkill = (skillToRemove) => {
    setSkills(skills.filter((s) => s !== skillToRemove));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Basic client-side validation
      const ext = file.name.split('.').pop().toLowerCase();
      if (!['pdf', 'docx'].includes(ext)) {
        setError('Only PDF and DOCX files are allowed.');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be under 5MB.');
        return;
      }
      setError('');
      setResumeFile(file);
    }
  };

  const handleFinish = async () => {
    if (!careerGoal) {
      setError('Please input your career goal.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      // 1. Save profile information
      await updateStudentProfile({
        college_name: academic.college_name,
        degree: academic.degree,
        branch: academic.branch,
        graduation_year: parseInt(academic.graduation_year),
        skills: skills,
        career_goal: careerGoal,
      });

      // 2. Upload resume
      if (resumeFile) {
        await uploadStudentResume(resumeFile);
      }

      navigate('/student/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to complete onboarding. Please verify your details.');
    } finally {
      setLoading(false);
    }
  };

  const progressPercent = calculateCompleteness();

  return (
    <div className="min-h-screen pt-24 pb-12 flex items-center justify-center px-4 relative overflow-hidden">
      {/* Backdrop patterns */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-primary-600/10 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="glass max-w-2xl w-full p-8 rounded-3xl relative z-10 border border-white/5 shadow-2xl">
        
        {/* Progress Header */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8 pb-6 border-b border-white/5">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-extrabold text-white">Student Onboarding</h2>
              <button
                onClick={() => navigate('/student/dashboard')}
                className="text-xs text-primary-400 hover:text-primary-300 font-semibold border border-primary-500/20 hover:border-primary-500/40 bg-primary-500/5 px-2.5 py-1.5 rounded-lg transition"
              >
                Skip to Dashboard
              </button>
            </div>
            <p className="text-slate-400 text-xs mt-1.5">Setup your credentials to activate placement readiness.</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-slate-400 text-xs font-semibold">Completeness:</span>
            <div className="bg-dark-950 border border-white/10 px-3 py-1.5 rounded-xl flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full ${progressPercent >= 70 ? 'bg-accent-emerald' : 'bg-accent-amber'}`} />
              <span className="text-white text-sm font-bold">{progressPercent}%</span>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm mb-6 text-center">
            {error}
          </div>
        )}

        {/* Step Indicator Bullets */}
        <div className="flex items-center justify-between max-w-sm mx-auto mb-8">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm border transition-all duration-300 ${
                  step === s
                    ? 'bg-primary-600 border-primary-500 text-white ring-4 ring-primary-500/20'
                    : step > s
                    ? 'bg-accent-emerald/20 border-accent-emerald/30 text-accent-emerald'
                    : 'bg-dark-950 border-white/10 text-slate-500'
                }`}
              >
                {step > s ? '✓' : s}
              </div>
              {s < 4 && <div className={`w-8 h-0.5 ${step > s ? 'bg-accent-emerald/30' : 'bg-white/5'}`} />}
            </div>
          ))}
        </div>

        {/* STEP VIEWS */}
        <div className="min-h-[220px]">
          {/* STEP 1: Academic details */}
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-white mb-2">Step 1: Academic Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 text-xs font-semibold mb-2">College Name</label>
                  <input
                    type="text"
                    required
                    placeholder="IIT Bombay"
                    value={academic.college_name}
                    onChange={(e) => setAcademic({ ...academic, college_name: e.target.value })}
                    className="w-full bg-dark-950 border border-white/10 rounded-xl px-4 py-2.5 text-slate-100 placeholder-slate-650 text-sm focus:outline-none focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-xs font-semibold mb-2">Degree</label>
                  <input
                    type="text"
                    required
                    placeholder="B.Tech / M.Tech"
                    value={academic.degree}
                    onChange={(e) => setAcademic({ ...academic, degree: e.target.value })}
                    className="w-full bg-dark-950 border border-white/10 rounded-xl px-4 py-2.5 text-slate-100 placeholder-slate-650 text-sm focus:outline-none focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-xs font-semibold mb-2">Branch</label>
                  <input
                    type="text"
                    required
                    placeholder="Computer Science"
                    value={academic.branch}
                    onChange={(e) => setAcademic({ ...academic, branch: e.target.value })}
                    className="w-full bg-dark-950 border border-white/10 rounded-xl px-4 py-2.5 text-slate-100 placeholder-slate-650 text-sm focus:outline-none focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-xs font-semibold mb-2">Graduation Year</label>
                  <input
                    type="number"
                    required
                    placeholder="2027"
                    value={academic.graduation_year}
                    onChange={(e) => setAcademic({ ...academic, graduation_year: e.target.value })}
                    className="w-full bg-dark-950 border border-white/10 rounded-xl px-4 py-2.5 text-slate-100 placeholder-slate-650 text-sm focus:outline-none focus:border-primary-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Resume upload */}
          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-white mb-2">Step 2: Resume Upload</h3>
              <div className="border-2 border-dashed border-white/10 hover:border-primary-500/40 rounded-2xl p-8 text-center bg-dark-950/40 transition">
                <svg className="w-12 h-12 text-slate-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <div className="text-sm font-medium text-white mb-1">
                  {resumeFile ? `Selected: ${resumeFile.name}` : 'Upload your resume'}
                </div>
                <p className="text-xs text-slate-500 mb-4">Accepts PDF, DOCX formats up to 5MB.</p>
                <label className="bg-white/5 border border-white/10 hover:bg-white/10 text-white font-semibold text-xs px-4 py-2.5 rounded-xl cursor-pointer transition">
                  Browse Files
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf,.docx"
                    onChange={handleFileChange}
                  />
                </label>
              </div>
            </div>
          )}

          {/* STEP 3: Skills tag selection */}
          {step === 3 && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-white mb-2">Step 3: Core Skills</h3>
              
              {/* Selected Skills Tags */}
              <div className="flex flex-wrap gap-2 mb-4 min-h-[40px] p-3 bg-dark-950/40 border border-white/5 rounded-xl">
                {skills.length === 0 ? (
                  <span className="text-slate-600 text-xs">No skills selected yet. Click from suggestions below.</span>
                ) : (
                  skills.map((s) => (
                    <span key={s} className="bg-primary-500/20 border border-primary-500/40 text-primary-300 text-xs font-semibold px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 animate-fade-in">
                      {s}
                      <button type="button" onClick={() => handleRemoveSkill(s)} className="text-primary-400 hover:text-white font-bold">&times;</button>
                    </span>
                  ))
                )}
              </div>

              {/* Suggestions */}
              <div>
                <label className="block text-slate-500 text-xs font-semibold mb-2">Suggestions</label>
                <div className="flex flex-wrap gap-1.5">
                  {suggestedSkills.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleAddSkill(tag)}
                      disabled={skills.includes(tag)}
                      className={`text-xs px-3 py-1.5 rounded-lg border transition ${
                        skills.includes(tag)
                          ? 'bg-white/5 border-white/5 text-slate-600 cursor-not-allowed'
                          : 'bg-dark-950 border-white/10 text-slate-300 hover:border-primary-500/40 hover:text-white'
                      }`}
                    >
                      + {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom skill add */}
              <div className="flex items-center gap-2 pt-4">
                <input
                  type="text"
                  placeholder="Or enter custom skill..."
                  value={customSkill}
                  onChange={(e) => setCustomSkill(e.target.value)}
                  className="bg-dark-950 border border-white/10 rounded-xl px-4 py-2 text-slate-100 placeholder-slate-650 text-sm focus:outline-none focus:border-primary-500 w-full"
                />
                <button
                  type="button"
                  onClick={() => handleAddSkill(customSkill.trim())}
                  className="bg-white/5 border border-white/10 hover:bg-white/10 text-white text-sm font-semibold px-4 py-2 rounded-xl transition flex-shrink-0"
                >
                  Add
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: Career goal selection */}
          {step === 4 && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-white mb-2">Step 4: Career Goals</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                {['Software Engineer', 'Data Scientist', 'Product Manager'].map((goal) => (
                  <button
                    key={goal}
                    type="button"
                    onClick={() => setCareerGoal(goal)}
                    className={`p-4 rounded-xl border text-left transition duration-200 ${
                      careerGoal === goal
                        ? 'bg-primary-600/10 border-primary-500 text-white'
                        : 'bg-dark-950 border-white/10 text-slate-400 hover:border-white/20'
                    }`}
                  >
                    <div className="font-bold text-sm text-white">{goal}</div>
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-slate-400 text-xs font-semibold mb-2">Specify Custom Target Role</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Front-end Developer, Cloud Associate"
                  value={careerGoal}
                  onChange={(e) => setCareerGoal(e.target.value)}
                  className="w-full bg-dark-950 border border-white/10 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-650 text-sm focus:outline-none focus:border-primary-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* Action button controls */}
        <div className="flex items-center justify-between mt-10 pt-6 border-t border-white/5">
          {step > 1 ? (
            <button
              onClick={handleBack}
              disabled={loading}
              className="border border-white/10 hover:bg-white/5 text-slate-300 font-semibold px-5 py-2.5 rounded-xl text-sm transition"
            >
              Back
            </button>
          ) : (
            <div />
          )}

          {step < 4 ? (
            <button
              onClick={handleNext}
              className="bg-primary-600 hover:bg-primary-700 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition"
            >
              Next Step
            </button>
          ) : (
            <button
              onClick={handleFinish}
              disabled={loading}
              className="bg-primary-600 hover:bg-primary-700 text-white font-bold px-7 py-2.5 rounded-xl text-sm transition flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <div className="h-4 w-4 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
              ) : (
                'Finish Setup'
              )}
            </button>
          )}
        </div>

      </div>
    </div>
  );
};

export default Onboarding;
