import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  withCredentials: true,
});

// Token is injected by the auth store via this setter to avoid circular imports.
// useAuthStore calls api.setToken() whenever the token changes.
let _token = null;
api.setToken = (t) => { _token = t; };

api.interceptors.request.use((config) => {
  if (_token) config.headers.Authorization = `Bearer ${_token}`;
  return config;
});

export default api;
