import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

// Layout
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';

// Common
import ProtectedRoute from './components/common/ProtectedRoute';

// Pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';

// Student Workspace
import StudentDashboard from './pages/student/Dashboard';
import StudentOnboarding from './pages/student/Onboarding';
import BrowseHRs from './pages/student/BrowseHRs';
import HRProfile from './pages/student/HRProfile';
import BookingCheckout from './pages/student/BookingCheckout';
import ResumeAnalysis from './pages/student/ResumeAnalysis';
import InterviewReport from './pages/student/InterviewReport';
import SkillGap from './pages/student/SkillGap';
import CareerGuidance from './pages/student/CareerGuidance';
import RecommendedHRs from './pages/student/RecommendedHRs';
import Roadmap from './pages/student/Roadmap';
import AICoach from './pages/student/AICoach';
import StudentAnalytics from './pages/student/StudentAnalytics';

// HR Professional Workspace
import HRDashboard from './pages/hr/Dashboard';
import HROnboarding from './pages/hr/Onboarding';
import SlotManager from './pages/hr/SlotManager';
import HRAnalytics from './pages/hr/HRAnalytics';

// Admin Panel
import AdminDashboard from './pages/admin/Dashboard';

// Shared / Session Workspace
import SessionDetails from './pages/SessionDetails';

// Extension Pages
import HRAssessmentPage from './pages/hr/HRAssessmentPage';
import LeaderboardPage from './pages/LeaderboardPage';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="flex flex-col min-h-screen bg-dark-950 text-slate-100 font-sans antialiased">
          <Navbar />
          
          <main className="flex-grow">
            <Routes>
              {/* Public Views */}
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Student Views */}
              <Route
                path="/student/onboarding"
                element={
                  <ProtectedRoute allowedRoles={['student']}>
                    <StudentOnboarding />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/student/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['student']}>
                    <StudentDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/hrs"
                element={
                  <ProtectedRoute allowedRoles={['student']}>
                    <BrowseHRs />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/hr/:id"
                element={
                  <ProtectedRoute allowedRoles={['student']}>
                    <HRProfile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/booking/:slotId"
                element={
                  <ProtectedRoute allowedRoles={['student']}>
                    <BookingCheckout />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/student/resume-analysis"
                element={
                  <ProtectedRoute allowedRoles={['student']}>
                    <ResumeAnalysis />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/student/interview-report/:id"
                element={
                  <ProtectedRoute allowedRoles={['student']}>
                    <InterviewReport />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/student/skill-gap"
                element={
                  <ProtectedRoute allowedRoles={['student']}>
                    <SkillGap />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/student/career-guidance"
                element={
                  <ProtectedRoute allowedRoles={['student']}>
                    <CareerGuidance />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/student/recommended-hrs"
                element={
                  <ProtectedRoute allowedRoles={['student']}>
                    <RecommendedHRs />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/student/roadmap"
                element={
                  <ProtectedRoute allowedRoles={['student']}>
                    <Roadmap />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/student/ai-coach"
                element={
                  <ProtectedRoute allowedRoles={['student']}>
                    <AICoach />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/student/analytics"
                element={
                  <ProtectedRoute allowedRoles={['student']}>
                    <StudentAnalytics />
                  </ProtectedRoute>
                }
              />

              {/* HR Professional Views */}
              <Route
                path="/hr/onboarding"
                element={
                  <ProtectedRoute allowedRoles={['hr']}>
                    <HROnboarding />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/hr/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['hr']}>
                    <HRDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/hr/dashboard/slots"
                element={
                  <ProtectedRoute allowedRoles={['hr']}>
                    <SlotManager />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/hr/analytics"
                element={
                  <ProtectedRoute allowedRoles={['hr']}>
                    <HRAnalytics />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/hr/assessment"
                element={
                  <ProtectedRoute allowedRoles={['hr']}>
                    <HRAssessmentPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/leaderboard"
                element={
                  <ProtectedRoute allowedRoles={['student', 'hr']}>
                    <LeaderboardPage />
                  </ProtectedRoute>
                }
              />

              {/* Shared Session View */}
              <Route
                path="/session/:id"
                element={
                  <ProtectedRoute allowedRoles={['student', 'hr']}>
                    <SessionDetails />
                  </ProtectedRoute>
                }
              />

              {/* Admin Views */}
              <Route
                path="/admin/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </main>

          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
