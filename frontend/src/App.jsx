import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import AppLayout from './layouts/AppLayout';
import LandingPage from './pages/LandingPage';
import DashboardPage from './pages/DashboardPage';
import RoutePlannerPage from './pages/RoutePlannerPage';
import TripResultsPage from './pages/TripResultsPage';
import ChargingStationsPage from './pages/ChargingStationsPage';
import SimulationsPage from './pages/SimulationsPage';
import TripHistoryPage from './pages/TripHistoryPage';
import ProfilePage from './pages/ProfilePage';
import AuthCallbackPage from './pages/AuthCallbackPage';
import VehicleLibraryPage from './pages/VehicleLibraryPage';
import EVComparisonPage from './pages/EVComparisonPage';
import TripDetailPage from './pages/TripDetailPage';
import SharedTripPage from './pages/SharedTripPage';
import ProtectedRoute from './components/common/ProtectedRoute';

function AppRouter() {
  const location = useLocation();

  // Handle OAuth callback synchronously during render to avoid race conditions
  // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
  if (location.hash?.includes('session_id=')) {
    return <AuthCallbackPage />;
  }

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/auth/callback" element={<AuthCallbackPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/route-planner" element={<RoutePlannerPage />} />
          <Route path="/trip-results" element={<TripResultsPage />} />
          <Route path="/charging-stations" element={<ChargingStationsPage />} />
          <Route path="/simulations" element={<SimulationsPage />} />
          <Route path="/history" element={<TripHistoryPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/vehicles" element={<VehicleLibraryPage />} />
          <Route path="/compare-evs" element={<EVComparisonPage />} />
          <Route path="/trip/:id" element={<TripDetailPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
      {/* Public share page — no auth required */}
      <Route path="/share/:token" element={<SharedTripPage />} />
    </Routes>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppRouter />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
