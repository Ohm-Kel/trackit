import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/ProtectedRoute';

// Lazy-loaded pages
const Landing = lazy(() => import('./pages/Landing'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Exams = lazy(() => import('./pages/Exams'));
const Chat = lazy(() => import('./pages/Chat'));
const Upload = lazy(() => import('./pages/Upload'));
const Tasks = lazy(() => import('./pages/Tasks'));
const FocusPlan = lazy(() => import('./pages/FocusPlan'));
const Analytics = lazy(() => import('./pages/Analytics'));
const Add = lazy(() => import('./pages/Add'));
const Settings = lazy(() => import('./pages/Settings'));
const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const NotFound = lazy(() => import('./pages/NotFound'));

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-full min-h-[200px]">
      <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function App() {
  return (
    <Router>
      <ErrorBoundary>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Public Routes */}
            <Route path="/landing"         element={<Landing />} />
            <Route path="/login"           element={<Login />} />
            <Route path="/signup"          element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password"  element={<ResetPassword />} />

            {/* Protected Application Routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index             element={<Dashboard />} />
              <Route path="tasks"      element={<Tasks />} />
              <Route path="exams"      element={<Exams />} />
              <Route path="chat"       element={<Chat />} />
              <Route path="upload"     element={<Upload />} />
              <Route path="focus"      element={<FocusPlan />} />
              <Route path="analytics"  element={<Analytics />} />
              <Route path="add"        element={<Add />} />
              <Route path="settings"   element={<Settings />} />
            </Route>

            {/* 404 Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </Router>
  );
}

export default App;
