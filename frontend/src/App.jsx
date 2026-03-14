import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import Exams from './pages/Exams';
import Chat from './pages/Chat';
import Upload from './pages/Upload';
import Tasks from './pages/Tasks';
import FocusPlan from './pages/FocusPlan';
import Analytics from './pages/Analytics';
import Add from './pages/Add';
import Settings from './pages/Settings';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

function App() {
  return (
    <Router>
      <ErrorBoundary>
        <Routes>
          {/* Public Auth Routes */}
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
        </Routes>
      </ErrorBoundary>
    </Router>
  );
}

export default App;
