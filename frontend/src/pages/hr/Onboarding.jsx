import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { updateHRProfile, uploadHRPhoto, uploadHRDocuments } from '../../services/hr';

const Onboarding = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form fields
  const [details, setDetails] = useState({ 
    company_name: '', 
    designation: '', 
    years_of_experience: '',
    date_of_birth: ''
  });
  const [bio, setBio] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [skills, setSkills] = useState([]);
  const [qualities, setQualities] = useState([]);

  // Documents
  const [resumeFile, setResumeFile] = useState(null);
  const [idCardFile, setIdCardFile] = useState(null);
  const [expLetterFile, setExpLetterFile] = useState(null);
  const [payslipsFile, setPayslipsFile] = useState(null);

  // Photo
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);

  // Skills Categories
  const skillCategories = {
    "Technical Skills": [
      'Frontend Development', 'Backend Development', 'Full Stack Development', 
      'MERN Stack', 'Java Development', 'Python Development', 'Data Science', 
      'Artificial Intelligence', 'Machine Learning', 'Cloud Computing', 
      'DevOps', 'Cybersecurity', 'IoT', 'Embedded Systems', 'Blockchain', 
      'Emerging Technologies'
    ],
    "HR & Behavioral Skills": [
      'Recruitment', 'Talent Acquisition', 'Employee Engagement', 
      'Performance Management', 'Leadership', 'Communication', 
      'Interviewing', 'Conflict Resolution'
    ],
    "Aptitude Skills": [
      'Quantitative Aptitude', 'Logical Reasoning', 'Verbal Ability', 
      'Critical Thinking', 'Problem Solving', 'Presentation Skills', 
      'Time Management'
    ]
  };

  // Mandatory Qualities
  const mandatoryQualities = [
    'Professionalism',
    'Ethical Conduct',
    'Industry Expertise',
    'Analytical Thinking',
    'Communication Skills',
    'Feedback Quality',
    'Trustworthiness'
  ];

  const handleNext = () => {
    setError('');
    
    // Step validation
    if (step === 1) {
      if (!details.company_name || !details.designation || !details.years_of_experience || !details.date_of_birth) {
        setError('Please fill in all professional details and Date of Birth.');
        return;
      }
    }
    if (step === 2) {
      if (!bio.trim() || bio.length < 20) {
        setError('Please write a summary bio of at least 20 characters.');
        return;
      }
    }
    if (step === 3) {
      if (!linkedinUrl) {
        setError('Please provide your LinkedIn profile URL.');
        return;
      }
      if (!linkedinUrl.startsWith('http://') && !linkedinUrl.startsWith('https://')) {
        setError('Please enter a valid URL beginning with http:// or https://');
        return;
      }
    }
    if (step === 4) {
      if (skills.length === 0) {
        setError('Please tick at least one expert skill.');
        return;
      }
    }
    if (step === 5) {
      if (!resumeFile || !idCardFile || !payslipsFile) {
        setError('Resume, Employee ID card, and Recent Pay slips are all required.');
        return;
      }
    }
    if (step === 6) {
      if (qualities.length !== mandatoryQualities.length) {
        setError('Please confirm and check all Mandatory Professional Qualities to proceed.');
        return;
      }
    }

    setStep(step + 1);
  };

  const handleBack = () => {
    setError('');
    setStep(step - 1);
  };

  const handleToggleSkill = (skill) => {
    if (skills.includes(skill)) {
      setSkills(skills.filter(s => s !== skill));
    } else {
      setSkills([...skills, skill]);
    }
  };

  const handleToggleQuality = (quality) => {
    if (qualities.includes(quality)) {
      setQualities(qualities.filter(q => q !== quality));
    } else {
      setQualities([...qualities, quality]);
    }
  };

  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    const ext = file.name.split('.').pop().toLowerCase();

    if (type === 'resume') {
      if (!['pdf', 'docx'].includes(ext)) {
        setError('Resume must be in PDF or DOCX format.');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError('Resume must be under 5MB.');
        return;
      }
      setResumeFile(file);
    } else if (type === 'id') {
      if (!['pdf', 'png', 'jpg', 'jpeg'].includes(ext)) {
        setError('ID card must be PDF, PNG, or JPG.');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError('ID card must be under 5MB.');
        return;
      }
      setIdCardFile(file);
    } else if (type === 'experience') {
      if (!['pdf', 'png', 'jpg', 'jpeg'].includes(ext)) {
        setError('Experience letter must be PDF, PNG, or JPG.');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError('Experience letter must be under 5MB.');
        return;
      }
      setExpLetterFile(file);
    } else if (type === 'payslips') {
      if (!['pdf', 'png', 'jpg', 'jpeg'].includes(ext)) {
        setError('Pay slips must be PDF, PNG, or JPG.');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError('Pay slips must be under 5MB.');
        return;
      }
      setPayslipsFile(file);
    } else if (type === 'photo') {
      if (!['png', 'jpg', 'jpeg'].includes(ext)) {
        setError('Profile photo must be PNG or JPG.');
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        setError('Profile photo must be under 2MB.');
        return;
      }
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
    setError('');
  };

  const handleFinish = async () => {
    setError('');
    setLoading(true);

    try {
      // 1. Update HR profile data
      await updateHRProfile({
        company_name: details.company_name,
        designation: details.designation,
        years_of_experience: parseInt(details.years_of_experience),
        bio: bio,
        linkedin_url: linkedinUrl,
        date_of_birth: details.date_of_birth,
        ticked_skills: skills,
        professional_qualities: qualities
      });

      // 2. Upload Profile Photo
      if (photoFile) {
        await uploadHRPhoto(photoFile);
      }

      // 3. Upload Verification Documents
      await uploadHRDocuments({
        resume_file: resumeFile,
        employee_id_file: idCardFile,
        experience_letter: expLetterFile,
        pay_slips_file: payslipsFile
      });

      // Redirect directly to HR assessment to verify their account!
      navigate('/hr/assessment');
    } catch (err) {
      setError(err.response?.data?.detail || 'Onboarding submission failed. Check inputs.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-12 flex items-center justify-center px-4 relative overflow-hidden bg-dark-950">
      {/* Backdrop blur */}
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent-violet/10 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="glass max-w-3xl w-full p-8 rounded-3xl relative z-10 border border-white/5 shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-6 mb-8 border-b border-white/5">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-extrabold text-white">HR Professional Onboarding</h2>
              <button
                onClick={() => navigate('/hr/dashboard')}
                className="text-xs text-accent-violet hover:text-white font-semibold border border-accent-violet/20 hover:border-accent-violet/40 bg-accent-violet/5 px-2.5 py-1.5 rounded-lg transition"
              >
                Skip to Dashboard
              </button>
            </div>
            <p className="text-slate-400 text-xs mt-1.5 font-medium">Verify your recruitment details and credentials to join our panel.</p>
          </div>
          <span className="text-accent-violet border border-accent-violet/20 bg-accent-violet/5 text-xs font-semibold px-3 py-1.5 rounded-xl uppercase">
            Step {step} of 7
          </span>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm mb-6 text-center">
            {error}
          </div>
        )}

        {/* Indicator Bullets */}
        <div className="flex items-center justify-between max-w-lg mx-auto mb-8">
          {[1, 2, 3, 4, 5, 6, 7].map((s) => (
            <div key={s} className="flex items-center gap-1.5">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs border transition-all duration-300 ${
                  step === s
                    ? 'bg-accent-violet border-accent-violet/50 text-white ring-4 ring-accent-violet/20'
                    : step > s
                    ? 'bg-accent-emerald/20 border-accent-emerald/30 text-accent-emerald'
                    : 'bg-dark-950 border-white/10 text-slate-500'
                }`}
              >
                {step > s ? '✓' : s}
              </div>
              {s < 7 && <div className={`w-3 h-0.5 ${step > s ? 'bg-accent-emerald/30' : 'bg-white/5'}`} />}
            </div>
          ))}
        </div>

        {/* STEP WINDOWS */}
        <div className="min-h-[260px]">
          
          {/* STEP 1: Professional Details */}
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-white mb-2">Step 1: Professional Details</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 text-xs font-semibold mb-2">Current Employer/Company</label>
                  <input
                    type="text"
                    required
                    placeholder="Microsoft"
                    value={details.company_name}
                    onChange={(e) => setDetails({ ...details, company_name: e.target.value })}
                    className="w-full bg-dark-950 border border-white/10 rounded-xl px-4 py-2.5 text-slate-100 text-sm focus:outline-none focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-xs font-semibold mb-2">Designation / Role</label>
                  <input
                    type="text"
                    required
                    placeholder="Sr. Technical Recruiter"
                    value={details.designation}
                    onChange={(e) => setDetails({ ...details, designation: e.target.value })}
                    className="w-full bg-dark-950 border border-white/10 rounded-xl px-4 py-2.5 text-slate-100 text-sm focus:outline-none focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-xs font-semibold mb-2">Years of Experience</label>
                  <input
                    type="number"
                    required
                    placeholder="5"
                    value={details.years_of_experience}
                    onChange={(e) => setDetails({ ...details, years_of_experience: e.target.value })}
                    className="w-full bg-dark-950 border border-white/10 rounded-xl px-4 py-2.5 text-slate-100 text-sm focus:outline-none focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-xs font-semibold mb-2">Date of Birth</label>
                  <input
                    type="date"
                    required
                    value={details.date_of_birth}
                    onChange={(e) => setDetails({ ...details, date_of_birth: e.target.value })}
                    className="w-full bg-dark-950 border border-white/10 rounded-xl px-4 py-2.5 text-slate-100 text-sm focus:outline-none focus:border-primary-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Professional Bio */}
          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-white mb-2">Step 2: Professional Biography</h3>
              <div>
                <label className="block text-slate-400 text-xs font-semibold mb-2">Bio Summary (Minimum 20 characters)</label>
                <textarea
                  required
                  rows={6}
                  placeholder="Provide details about your recruitment background, technologies you hire for, and areas you specialize in (e.g. system design, coding loops, behavior checks)."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full bg-dark-950 border border-white/10 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-650 text-sm focus:outline-none focus:border-primary-500 resize-none"
                />
              </div>
            </div>
          )}

          {/* STEP 3: LinkedIn Profile */}
          {step === 3 && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-white mb-2">Step 3: Professional Networks</h3>
              <div>
                <label className="block text-slate-400 text-xs font-semibold mb-2">LinkedIn Profile URL</label>
                <input
                  type="url"
                  required
                  placeholder="https://www.linkedin.com/in/username"
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  className="w-full bg-dark-950 border border-white/10 rounded-xl px-4 py-3 text-slate-100 text-sm focus:outline-none focus:border-primary-500"
                />
              </div>
            </div>
          )}

          {/* STEP 4: Expertise Selection */}
          {step === 4 && (
            <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2">
              <h3 className="text-lg font-bold text-white mb-2">Step 4: Expertise Ticks</h3>
              <p className="text-xs text-slate-400 mb-4">Select the technical, HR/behavioral, and aptitude skills you can evaluate.</p>
              
              {Object.keys(skillCategories).map((categoryName) => (
                <div key={categoryName} className="mb-4">
                  <h4 className="text-xs font-bold text-accent-violet uppercase tracking-wider mb-2">{categoryName}</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {skillCategories[categoryName].map((skill) => (
                      <label 
                        key={skill} 
                        className={`flex items-center gap-2.5 p-2 rounded-xl border text-xs cursor-pointer transition select-none ${
                          skills.includes(skill)
                            ? 'bg-accent-violet/10 border-accent-violet/40 text-white'
                            : 'bg-dark-950 border-white/5 text-slate-400 hover:border-white/10'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={skills.includes(skill)}
                          onChange={() => handleToggleSkill(skill)}
                          className="rounded border-white/10 text-accent-violet focus:ring-0 focus:ring-offset-0 accent-accent-violet"
                        />
                        {skill}
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* STEP 5: Document Upload */}
          {step === 5 && (
            <div className="space-y-5">
              <h3 className="text-lg font-bold text-white mb-2">Step 5: Upload Credentials</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Resume File */}
                <div className="p-4 bg-dark-950/40 border border-white/5 rounded-2xl flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-white mb-1">Resume / CV (Required)</h4>
                    <p className="text-[10px] text-slate-500 mb-3">Upload your latest PDF/DOCX (Max 5MB)</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="bg-white/5 border border-white/10 hover:bg-white/10 text-white text-xs font-semibold px-4 py-2 rounded-xl cursor-pointer transition">
                      Upload
                      <input type="file" className="hidden" accept=".pdf,.docx" onChange={(e) => handleFileChange(e, 'resume')} />
                    </label>
                    <span className="text-[10px] text-slate-400 truncate max-w-[130px]">{resumeFile ? resumeFile.name : 'No file'}</span>
                  </div>
                </div>

                {/* ID Card File */}
                <div className="p-4 bg-dark-950/40 border border-white/5 rounded-2xl flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-white mb-1">Employee ID Card (Required)</h4>
                    <p className="text-[10px] text-slate-500 mb-3">Upload company ID card PDF/Image (Max 5MB)</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="bg-white/5 border border-white/10 hover:bg-white/10 text-white text-xs font-semibold px-4 py-2 rounded-xl cursor-pointer transition">
                      Upload
                      <input type="file" className="hidden" accept=".pdf,.png,.jpg,.jpeg" onChange={(e) => handleFileChange(e, 'id')} />
                    </label>
                    <span className="text-[10px] text-slate-400 truncate max-w-[130px]">{idCardFile ? idCardFile.name : 'No file'}</span>
                  </div>
                </div>

                {/* Pay Slips File */}
                <div className="p-4 bg-dark-950/40 border border-white/5 rounded-2xl flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-white mb-1">Recent Pay Slips (Required)</h4>
                    <p className="text-[10px] text-slate-500 mb-3">Recent salary pay slip PDF/Image (Max 5MB)</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="bg-white/5 border border-white/10 hover:bg-white/10 text-white text-xs font-semibold px-4 py-2 rounded-xl cursor-pointer transition">
                      Upload
                      <input type="file" className="hidden" accept=".pdf,.png,.jpg,.jpeg" onChange={(e) => handleFileChange(e, 'payslips')} />
                    </label>
                    <span className="text-[10px] text-slate-400 truncate max-w-[130px]">{payslipsFile ? payslipsFile.name : 'No file'}</span>
                  </div>
                </div>

                {/* Experience Letter File */}
                <div className="p-4 bg-dark-950/40 border border-white/5 rounded-2xl flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-white mb-1">Experience Letter (Optional)</h4>
                    <p className="text-[10px] text-slate-500 mb-3">Experience letter PDF/Image (Max 5MB)</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="bg-white/5 border border-white/10 hover:bg-white/10 text-white text-xs font-semibold px-4 py-2 rounded-xl cursor-pointer transition">
                      Upload
                      <input type="file" className="hidden" accept=".pdf,.png,.jpg,.jpeg" onChange={(e) => handleFileChange(e, 'experience')} />
                    </label>
                    <span className="text-[10px] text-slate-400 truncate max-w-[130px]">{expLetterFile ? expLetterFile.name : 'No file'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 6: Mandatory Qualities self-assessment */}
          {step === 6 && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-white mb-2">Step 6: Professional Qualities Self-Assessment</h3>
              <p className="text-xs text-slate-400 mb-4">Please assess yourself. Tick all required professional qualities below to confirm compliance.</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {mandatoryQualities.map((quality) => (
                  <label 
                    key={quality} 
                    className={`flex items-center gap-3 p-3 rounded-2xl border text-xs font-semibold cursor-pointer transition select-none ${
                      qualities.includes(quality)
                        ? 'bg-accent-emerald/10 border-accent-emerald/40 text-white'
                        : 'bg-dark-950 border-white/5 text-slate-400 hover:border-white/10'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={qualities.includes(quality)}
                      onChange={() => handleToggleQuality(quality)}
                      className="rounded border-white/10 text-accent-emerald focus:ring-0 focus:ring-offset-0 accent-accent-emerald"
                    />
                    {quality}
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* STEP 7: Profile Photo */}
          {step === 7 && (
            <div className="space-y-4 text-center">
              <h3 className="text-lg font-bold text-white mb-2 text-left">Step 7: Profile Photo</h3>
              
              <div className="w-32 h-32 rounded-full bg-dark-950 border border-white/10 mx-auto flex items-center justify-center overflow-hidden mb-6 shadow-inner relative group">
                {photoPreview ? (
                  <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <svg className="w-12 h-12 text-slate-700 group-hover:text-slate-500 transition" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                )}
              </div>

              <label className="inline-block bg-white/5 border border-white/10 hover:bg-white/10 text-white text-xs font-semibold px-6 py-3 rounded-xl cursor-pointer transition">
                Upload Photo
                <input type="file" className="hidden" accept="image/png,image/jpeg" onChange={(e) => handleFileChange(e, 'photo')} />
              </label>
              <p className="text-[10px] text-slate-500 mt-2">PNG, JPG or JPEG. Max file size: 2MB.</p>
            </div>
          )}
        </div>

        {/* Controls */}
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

          {step < 7 ? (
            <button
              onClick={handleNext}
              className="bg-accent-violet hover:bg-accent-violet/90 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition"
            >
              Next Step
            </button>
          ) : (
            <button
              onClick={handleFinish}
              disabled={loading}
              className="bg-accent-violet hover:bg-accent-violet/90 text-white font-bold px-7 py-2.5 rounded-xl text-sm transition flex items-center gap-2 disabled:opacity-50 shadow-lg shadow-accent-violet/20"
            >
              {loading ? (
                <div className="h-4 w-4 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
              ) : (
                'Submit Application'
              )}
            </button>
          )}
        </div>

      </div>
    </div>
  );
};

export default Onboarding;
