import axios from 'axios';
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const api = axios.create({
  baseURL: API_BASE_URL,
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