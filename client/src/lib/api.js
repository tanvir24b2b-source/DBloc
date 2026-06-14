import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  withCredentials: true,
});

// Attach access token from store (set lazily to avoid circular import)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("dbloc_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
