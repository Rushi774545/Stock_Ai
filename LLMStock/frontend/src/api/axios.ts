import axios from 'axios';

let baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// Ensure baseUrl ends with /api
if (baseUrl && !baseUrl.endsWith('/api') && !baseUrl.endsWith('/api/')) {
  baseUrl = baseUrl.endsWith('/') ? `${baseUrl}api` : `${baseUrl}/api`;
}

const api = axios.create({
  baseURL: baseUrl,
});

/** Sending a stale/invalid Bearer breaks JWT auth before AllowAny runs on login/register. */
function isPublicAuthRequest(url: string | undefined) {
  if (!url) return false;
  return (
    /\/auth\/login\/?(\?|$)/.test(url) ||
    /\/auth\/register\/?(\?|$)/.test(url) ||
    /\/auth\/token\/refresh\/?(\?|$)/.test(url)
  );
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token && !isPublicAuthRequest(config.url)) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const url = error.config?.url ?? '';
      if (!isPublicAuthRequest(url)) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
