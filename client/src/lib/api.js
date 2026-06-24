import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  withCredentials: true,
});

let _token = null;
api.setToken = (t) => { _token = t; };

api.interceptors.request.use((config) => {
  if (_token) config.headers.Authorization = `Bearer ${_token}`;
  return config;
});

// Auto-refresh on 401: retry the original request once with a fresh token
let _refreshing = null;
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;
    if (err.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        if (!_refreshing) {
          _refreshing = axios.post(
            `${import.meta.env.VITE_API_URL || "/api"}/auth/refresh`,
            {},
            { withCredentials: true }
          ).finally(() => { _refreshing = null; });
        }
        const { data } = await _refreshing;
        api.setToken(data.accessToken);
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(original);
      } catch {
        api.setToken(null);
        // Let the error bubble — auth store will handle logout if needed
      }
    }
    return Promise.reject(err);
  }
);

export default api;
