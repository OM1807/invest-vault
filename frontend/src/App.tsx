import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import LandingPage from '@/pages/LandingPage';
import AuthPage from '@/pages/AuthPage';
import FounderDashboard from '@/pages/FounderDashboard';
import InvestorDashboard from '@/pages/InvestorDashboard';
import BrowseStartupsPage from '@/pages/BrowseStartupsPage';
import StartupDetailPage from '@/pages/StartupDetailPage';
import ProfilePage from '@/pages/ProfilePage';

function DashboardRouter() {
  const { user } = useAuth();
  if (user?.role === 'founder') return <FounderDashboard />;
  if (user?.role === 'investor') return <InvestorDashboard />;
  return <Navigate to="/" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<AuthPage />} />
          <Route path="/register" element={<AuthPage />} />
          <Route path="/startups" element={<BrowseStartupsPage />} />
          <Route path="/startups/:id" element={<StartupDetailPage />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardRouter />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
