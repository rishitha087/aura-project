import api from './api';

export const getResumeAnalysis = async () => {
  const response = await api.get('/student/resume-analysis/');
  return response.data;
};

export const triggerResumeAnalysis = async () => {
  const response = await api.post('/student/resume-analysis/');
  return response.data;
};

export const getInterviewReport = async (bookingId) => {
  const response = await api.get(`/student/interview-report/${bookingId}/`);
  return response.data;
};

export const getSkillGapReports = async () => {
  const response = await api.get('/student/skill-gap/');
  return response.data;
};

export const triggerSkillGapAnalysis = async (targetRole) => {
  const response = await api.post('/student/skill-gap/', { target_role: targetRole });
  return response.data;
};

export const getCareerGuidance = async () => {
  const response = await api.get('/student/career-guidance/');
  return response.data;
};

export const getRecommendedHRs = async () => {
  const response = await api.get('/student/recommended-hrs/');
  return response.data;
};

export const getLearningRoadmap = async () => {
  const response = await api.get('/student/roadmap/');
  return response.data;
};

export const chatWithAICoach = async (message, history = []) => {
  const response = await api.post('/student/ai-coach/', { message, history });
  return response.data;
};

export const getStudentAnalytics = async () => {
  const response = await api.get('/student/analytics/');
  return response.data;
};

export const getHRAnalytics = async () => {
  const response = await api.get('/hr/analytics/');
  return response.data;
};
