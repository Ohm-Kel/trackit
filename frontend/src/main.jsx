import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, onlineManager } from '@tanstack/react-query'
import { inject } from '@vercel/analytics'
import AppProviders from './AppProviders'
import { MAX_AGE } from './lib/queryPersistence'
import '@fontsource-variable/inter'
import './index.css'
import App from './App.jsx'

// Initialize Vercel Analytics (only runs in production on Vercel)
inject()

// React Query assumes it starts online; start from the browser's view so a
// page opened offline shows saved data instead of failing requests.
onlineManager.setOnline(navigator.onLine)

const queryClient = new QueryClient({
  defaultOptions: {
    // Keep unused queries long enough to be saved for offline use (ADR 0006).
    queries: { gcTime: MAX_AGE },
    // Fail at once while offline, with a clear message (api/http.js), rather
    // than queue the change silently until the connection returns.
    mutations: { networkMode: 'always' },
  },
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AppProviders queryClient={queryClient}>
      <App />
    </AppProviders>
  </StrictMode>,
)
