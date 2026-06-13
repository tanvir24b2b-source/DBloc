import { useQuery } from "@tanstack/react-query";
import api from "../lib/api.js";

export function useBlocs(params = {}) {
  return useQuery({
    queryKey: ["blocs", params],
    queryFn: async () => (await api.get("/blocs", { params })).data,
  });
}

export function useBloc(id) {
  return useQuery({
    queryKey: ["bloc", id],
    queryFn: async () => (await api.get(`/blocs/${id}`)).data,
    enabled: !!id,
  });
}

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: async () => (await api.get("/categories")).data,
  });
}
