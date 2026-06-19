import { create } from "zustand";
import api from "../lib/api.js";

export const useAuthStore = create((set, get) => ({
  user: null,
  token: null,
  loading: true,

  setAuth: ({ user, accessToken }) => {
    if (accessToken) api.setToken(accessToken);
    set({ user, token: accessToken ?? get().token });
  },

  async login(email, password) {
    const { data } = await api.post("/auth/login", { email, password });
    api.setToken(data.accessToken);
    set({ user: data.user, token: data.accessToken });
    return data.user;
  },

  async register(payload) {
    const { data } = await api.post("/auth/register", payload);
    api.setToken(data.accessToken);
    set({ user: data.user, token: data.accessToken });
    return data.user;
  },

  async fetchMe() {
    const token = get().token;
    if (!token) {
      try {
        const { data } = await api.post("/auth/refresh");
        api.setToken(data.accessToken);
        set({ user: data.user, token: data.accessToken, loading: false });
      } catch {
        api.setToken(null);
        set({ user: null, token: null, loading: false });
      }
      return;
    }
    try {
      const { data } = await api.get("/auth/me");
      set({ user: data.user, loading: false });
    } catch {
      try {
        const { data } = await api.post("/auth/refresh");
        api.setToken(data.accessToken);
        set({ user: data.user, token: data.accessToken, loading: false });
      } catch {
        api.setToken(null);
        set({ user: null, token: null, loading: false });
      }
    }
  },

  updateUser(patch) {
    set((s) => ({ user: s.user ? { ...s.user, ...patch } : s.user }));
  },

  logout() {
    api.post("/auth/logout").catch(() => {});
    api.setToken(null);
    set({ user: null, token: null });
  },
}));
