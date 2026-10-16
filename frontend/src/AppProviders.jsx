import { QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './components/Toast';
import UserQueryCache from './components/UserQueryCache';

/** Providers shared by the app (main.jsx) and the tests (test/renderApp.jsx). */
export default function AppProviders({ queryClient, children }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <UserQueryCache>
          <ThemeProvider>
            <ToastProvider>{children}</ToastProvider>
          </ThemeProvider>
        </UserQueryCache>
      </AuthProvider>
    </QueryClientProvider>
  );
}
