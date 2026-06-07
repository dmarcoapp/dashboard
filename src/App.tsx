import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { PublicRoute } from "@/components/PublicRoute";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { MockModeIndicator } from "@/components/MockModeIndicator";

// Auth pages
import LoginPage from "@/pages/auth/LoginPage";
import TwoFactorPage from "@/pages/auth/TwoFactorPage";
import RegisterPage from "@/pages/auth/RegisterPage";
import EmailVerifyPage from "@/pages/auth/EmailVerifyPage";
import ForgotPasswordPage from "@/pages/auth/ForgotPasswordPage";
import PasswordResetPage from "@/pages/auth/PasswordResetPage";

// Dashboard pages
import DashboardPage from "@/pages/DashboardPage";
import ReportsPage from "@/pages/ReportsPage";
import ReportDetailPage from "@/pages/ReportDetailPage";
import DomainsPage from "@/pages/DomainsPage";
import DomainDetailPage from "@/pages/DomainDetailPage";
import BlocklistPage from "@/pages/BlocklistPage";
import ProfilePage from "@/pages/ProfilePage";
import NotificationsPage from "@/pages/NotificationsPage";

import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <MockModeIndicator />
        <BrowserRouter>
          <Routes>
            {/* Redirect root to dashboard */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            
            {/* Auth routes - redirect to dashboard if logged in */}
            <Route path="/auth/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
            <Route path="/auth/two-factor" element={<PublicRoute><TwoFactorPage /></PublicRoute>} />
            <Route path="/auth/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
            <Route path="/auth/email-verify" element={<PublicRoute><EmailVerifyPage /></PublicRoute>} />
            <Route path="/auth/forgot-password" element={<PublicRoute><ForgotPasswordPage /></PublicRoute>} />
            <Route path="/auth/password-reset" element={<PublicRoute><PasswordResetPage /></PublicRoute>} />
            
            {/* Protected dashboard routes */}
            <Route path="/" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="reports" element={<ReportsPage />} />
              <Route path="reports/:id" element={<ReportDetailPage />} />
              <Route path="domains" element={<DomainsPage />} />
              <Route path="domains/:domain" element={<DomainDetailPage />} />
              <Route path="blocklist" element={<BlocklistPage />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="notifications" element={<NotificationsPage />} />
            </Route>
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
