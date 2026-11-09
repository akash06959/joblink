import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Login from './pages/Login';
import Register from './pages/Register';
import Onboarding from './pages/Onboarding';

import RecruiterLayout from './components/RecruiterLayout';
import Dashboard from './pages/recruiter/Dashboard';
import PostJob from './pages/recruiter/PostJob';
import MyJobs from './pages/recruiter/MyJobs';
import EditJob from './pages/recruiter/EditJob';
import JobApplications from './pages/recruiter/JobApplications';
import RecruiterNotifications from './pages/recruiter/Notifications';

import SeekerLayout from './components/SeekerLayout';
import Home from './pages/seeker/Home';
import Jobs from './pages/seeker/Jobs';
import SmartMatch from './pages/seeker/SmartMatch';
import MyApplications from './pages/seeker/MyApplications';
import RegisteredEvents from './pages/seeker/RegisteredEvents';
import Profile from './pages/seeker/Profile';
import Competitions from './pages/seeker/Competitions';
import Mentorship from './pages/seeker/Mentorship';
import Notifications from './pages/seeker/Notifications';
import ViewResume from './pages/seeker/ViewResume';
import ResumeAnalyzer from './pages/seeker/ResumeAnalyzer';
import Messages from './pages/seeker/Messages';
import JobDetails from './pages/seeker/JobDetails';

import AdminLayout from './components/AdminLayout';
import AdminDashboard from './pages/admin/Dashboard';
import AdminUsers from './pages/admin/Users';
import AdminJobs from './pages/admin/Jobs';

// Protection wrapper for Recruiters
const RecruiterRoute = ({ children }) => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  if (!user || !user.token) {
    return <Navigate to="/login" replace />;
  }
  if (user.role !== 'Recruiter') {
    return <Navigate to="/" replace />;
  }
  return children;
};

// Protection wrapper for Seekers
const SeekerRoute = ({ children }) => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  if (!user || !user.token) {
    return <Navigate to="/login" replace />;
  }
  if (user.role !== 'Seeker') {
    if (user.role === 'Recruiter') {
      return <Navigate to="/recruiter/dashboard" replace />;
    }
    return <Navigate to="/login" replace />;
  }
  return children;
};

// Protection wrapper for Admins
const AdminRoute = ({ children }) => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  if (!user || !user.token) {
    return <Navigate to="/login" replace />;
  }
  if (user.role !== 'Admin') {
    return <Navigate to="/" replace />;
  }
  return children;
};

function App() {
  return (
    <Router>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            borderRadius: '12px',
            padding: '14px 18px',
            fontSize: '14px',
            fontWeight: '500',
            boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
            maxWidth: '380px',
          },
          success: {
            style: {
              background: '#f0fdf4',
              color: '#15803d',
              border: '1px solid #bbf7d0',
            },
            iconTheme: { primary: '#16a34a', secondary: '#f0fdf4' },
          },
          error: {
            style: {
              background: '#fef2f2',
              color: '#dc2626',
              border: '1px solid #fecaca',
            },
            iconTheme: { primary: '#dc2626', secondary: '#fef2f2' },
            duration: 5000,
          },
          loading: {
            style: {
              background: '#eff6ff',
              color: '#1d4ed8',
              border: '1px solid #bfdbfe',
            },
          },
        }}
      />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/onboarding" element={<Onboarding />} />

        {/* Admin Routes */}
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="jobs" element={<AdminJobs />} />
        </Route>

        {/* Recruiter Routes */}
        <Route
          path="/recruiter"
          element={
            <RecruiterRoute>
              <RecruiterLayout />
            </RecruiterRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="post-job" element={<PostJob />} />
          <Route path="my-jobs" element={<MyJobs />} />
          <Route path="edit-job/:id" element={<EditJob />} />
          <Route path="job/:jobId/applications" element={<JobApplications />} />
          <Route path="messages" element={<Messages />} />
          <Route path="notifications" element={<RecruiterNotifications />} />
        </Route>

        {/* Seeker Routes */}
        <Route
          path="/seeker"
          element={
            <SeekerRoute>
              <SeekerLayout />
            </SeekerRoute>
          }
        >
          <Route index element={<Navigate to="home" replace />} />
          <Route path="home" element={<Home />} />
          <Route path="jobs" element={<Jobs />} />
          <Route path="jobs/:id" element={<JobDetails />} />
          <Route path="smart-match" element={<SmartMatch />} />
          <Route path="competitions" element={<Competitions />} />
          <Route path="mentorship" element={<Mentorship />} />
          <Route path="my-applications" element={<MyApplications />} />
          <Route path="registered-events" element={<RegisteredEvents />} />
          <Route path="messages" element={<Messages />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="profile" element={<Profile />} />
          <Route path="view-resume" element={<ViewResume />} />
          <Route path="resume-analyzer" element={<ResumeAnalyzer />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
