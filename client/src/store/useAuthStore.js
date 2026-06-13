import { create } from "zustand";
import api from "../lib/api.js";

export const useAuthStore = create((set) => ({
  user: null,
  token: localStorage.getItem("dbloc_token") || null,
  loading: true,

  setAuth: ({ user, accessToken }) => {
    if (accessToken) localStorage.setItem("dbloc_token", accessToken);
    set({ user, token: accessToken || localStorage.getItem("dbloc_token") });
  },

  async login(email, password) {
    const { data } = await api.post("/auth/login", { email, password });
    localStorage.setItem("dbloc_token", data.accessToken);
    set({ user: data.user, token: data.accessToken });
    return data.user;
  },

  async register(payload) {
    const { data } = await api.post("/auth/register", payload);
    localStorage.setItem("dbloc_token", data.accessToken);
    set({ user: data.user, token: data.accessToken });
    return data.user;
  },

  async fetchMe() {
    const token = localStorage.getItem("dbloc_token");
    if (!token) {
      // Try refresh token cookie to restore session silently
      try {
        const { data } = await api.post("/auth/refresh");
        localStorage.setItem("dbloc_token", data.accessToken);
        set({ user: data.user, token: data.accessToken, loading: false });
      } catch {
        set({ user: null, token: null, loading: false });
      }
      return;
    }
    try {
      const { data } = await api.get("/auth/me");
      set({ user: data.user, loading: false });
    } catch {
      // Access token expired — try to refresh
      try {
        const { data } = await api.post("/auth/refresh");
        localStorage.setItem("dbloc_token", data.accessToken);
        set({ user: data.user, token: data.accessToken, loading: false });
      } catch {
        localStorage.removeItem("dbloc_token");
        set({ user: null, token: null, loading: false });
      }
    }
  },

  updateUser(patch) {
    set((s) => ({ user: s.user ? { ...s.user, ...patch } : s.user }));
  },

  logout() {
    api.post("/auth/logout").catch(() => {});
    localStorage.removeItem("dbloc_token");
    set({ user: null, token: null });
  },
}));
