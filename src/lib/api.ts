import axios from 'axios';

const api = axios.create({
  baseURL: 'http://127.0.0.1:8000',
  timeout: 60000, // ✅ 60s default — Groq vision is fast now
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (config.url?.includes('/upload')) {
    config.timeout = 120000; // 2 minutes max — should finish in ~10s now
  }

  return config;
});

export default api;