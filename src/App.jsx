import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { Toaster } from 'sonner';
import ProtectedRoute from './components/ProtectedRoute';

// Layouts
import CitoyenLayout from './layouts/CitoyenLayout';

// Pages publiques
import LandingPage from './pages/LandingPage';
import AccountTypePage from './pages/AccountTypePage';
import LoginPage from './pages/LoginPage';
import SignupCitoyenPage from './pages/SignupCitoyenPage';
import SignupEtablissementPage from './pages/SignupEtablissementPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import NotFoundPage from './pages/NotFoundPage';
import AgentStatsPage from './pages/AgentStatsPage';
import AgentSetupPasswordPage from './pages/AgentSetupPasswordPage';

// Pages Citoyen
import CitoyenHomePage from './pages/CitoyenHomePage';
import MyActivitiesPage from './pages/MyActivitiesPage';
import EstablishmentDetailPage from './pages/EstablishmentDetailPage';
import TakeTicketPage from './pages/TakeTicketPage';
import TicketConfirmationPage from './pages/TicketConfirmationPage';
import TrackTicketPage from './pages/TrackTicketPage';
import AppointmentCalendarPage from './pages/AppointmentCalendarPage';
import AppointmentConfirmationPage from './pages/AppointmentConfirmationPage';
import CitoyenProfilePage from './pages/CitoyenProfilePage';

// Pages Admin
import AdminDashboard from './pages/AdminDashboard';
import ConfigureHoursPage from './pages/ConfigureHoursPage';
import ManageServicesPage from './pages/ManageServicesPage';
import ManageAgentsPage from './pages/ManageAgentsPage';
import ConfigureAppointmentsPage from './pages/ConfigureAppointmentsPage';
import AdminStatsPage from './pages/AdminStatsPage';
import AdminProfilePage from './pages/AdminProfilePage';

// Pages Agent
import AgentDashboard from './pages/AgentDashboard';
import AgentAppointmentsPage from './pages/AgentAppointmentsPage';
import AgentProfilePage from './pages/AgentProfilePage';

// Pages Super Admin
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import ValidateEstablishmentsPage from './pages/ValidateEstablishmentsPage';
import ManageEstablishmentsPage from './pages/ManageEstablishmentsPage';
import SuperAdminProfilePage from './pages/SuperAdminProfilePage';
import SuperAdminEstablishmentDetailPage from './pages/SuperAdminEstablishmentDetailPage';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" richColors />
        <Routes>
          {/* Routes publiques */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/account-type" element={<AccountTypePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup/citoyen" element={<SignupCitoyenPage />} />
          <Route path="/signup/etablissement" element={<SignupEtablissementPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/agent-setup/:token" element={<AgentSetupPasswordPage />} />

          {/* Routes Citoyen avec Layout */}
          <Route
            path="/citoyen"
            element={
              <ProtectedRoute allowedRoles={['citoyen']}>
                <CitoyenLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/citoyen/home" replace />} />
            <Route path="home" element={<CitoyenHomePage />} />
            <Route path="activities" element={<MyActivitiesPage />} />
            <Route path="profile" element={<CitoyenProfilePage />} />
            <Route path="establishment/:id" element={<EstablishmentDetailPage />} />
            <Route path="take-ticket/:etablissementId/:serviceId" element={<TakeTicketPage />} />
            <Route path="ticket-confirmation/:ticketId" element={<TicketConfirmationPage />} />
            <Route path="track-ticket/:ticketId" element={<TrackTicketPage />} />
            <Route path="appointment/:etablissementId/:serviceId" element={<AppointmentCalendarPage />} />
            <Route path="appointment-confirmation/:appointmentId" element={<AppointmentConfirmationPage />} />
          </Route>

          {/* Routes Admin */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['admin_etablissement']}>
                <Outlet />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="hours" element={<ConfigureHoursPage />} />
            <Route path="services" element={<ManageServicesPage />} />
            <Route path="agents" element={<ManageAgentsPage />} />
            <Route path="appointments-config" element={<ConfigureAppointmentsPage />} />
            <Route path="stats" element={<AdminStatsPage />} />
            <Route path="profile" element={<AdminProfilePage />} />
          </Route>

          {/* Routes Agent */}
          <Route
            path="/agent"
            element={
              <ProtectedRoute allowedRoles={['agent']}>
                <Outlet />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/agent/dashboard" replace />} />
            <Route path="dashboard" element={<AgentDashboard />} />
            <Route path="appointments" element={<AgentAppointmentsPage />} />
            <Route path="stats" element={<AgentStatsPage />} />
            <Route path="profile" element={<AgentProfilePage />} />
          </Route>

          {/* Routes Super Admin */}
          <Route
            path="/superadmin"
            element={
              <ProtectedRoute allowedRoles={['super_admin']}>
                <Outlet />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/superadmin/dashboard" replace />} />
            <Route path="dashboard" element={<SuperAdminDashboard />} />
            <Route path="validate" element={<ValidateEstablishmentsPage />} />
            <Route path="establishments" element={<ManageEstablishmentsPage />} />
            <Route path="establishments/:id" element={<SuperAdminEstablishmentDetailPage />} />
            <Route path="profile" element={<SuperAdminProfilePage />} />
          </Route>

          {/* Redirection 404 */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;