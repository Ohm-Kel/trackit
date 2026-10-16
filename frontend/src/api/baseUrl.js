/** API base URL: same origin in production, the dev server's API otherwise. */
export const API_URL = import.meta.env.PROD
  ? '/api'
  : import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
