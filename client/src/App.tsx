import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/auth.store';
import AppLayout from './components/layout/AppLayout';

// Pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import OTPPage from './pages/auth/OTPPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import ContributionsPage from './pages/contributions/ContributionsPage';
import LoansPage from './pages/loans/LoansPage';
import MeetingsPage from './pages/meetings/MeetingsPage';
import InvestmentsPage from './pages/investments/InvestmentsPage';
import MembersPage from './pages/members/MembersPage';
import ReportsPage from './pages/reports/ReportsPage';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/otp" element={<OTPPage />} />
        
        <Route path="/" element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }>
          <Route index element={<DashboardPage />} />
          <Route path="contributions" element={<ContributionsPage />} />
          <Route path="loans" element={<LoansPage />} />
          <Route path="meetings" element={<MeetingsPage />} />
          <Route path="investments" element={<InvestmentsPage />} />
          <Route path="members" element={<MembersPage />} />
          <Route path="reports" element={<ReportsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
