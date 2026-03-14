import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { inject } from '@vercel/analytics'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { ToastProvider } from './components/Toast'
import './index.css'
import App from './App.jsx'

// Initialize Vercel Analytics (only runs in production on Vercel)
inject()

const queryClient = new QueryClient()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider>
          <ToastProvider>
            <App />
          </ToastProvider>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>,
)
