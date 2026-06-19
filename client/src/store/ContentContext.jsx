import { createContext, useContext, useEffect, useState, useCallback } from "react";
import api from "../lib/api.js";

const ContentContext = createContext(null);

/**
 * Loads all site content into a key->value map.
 * Detects ?editMode=true (used by admin Content Editor iframe) to enable click-to-edit.
 */
export function ContentProvider({ children }) {
  const [map, setMap] = useState({});
  const [items, setItems] = useState([]);
  const [loaded, setLoaded] = useState(false);

  const editMode = new URLSearchParams(window.location.search).get("editMode") === "true";

  const load = useCallback(async () => {
    try {
      const { data } = await api.get("/content");
      setMap(data.map || {});
      setItems(data.items || []);
    } catch {
      // fall back to empty — components use default fallback text
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // In edit mode, listen for save messages from the admin parent window
  useEffect(() => {
    if (!editMode) return;
    const ALLOWED_ORIGIN = window.location.origin;
    function onMessage(e) {
      if (e.origin !== ALLOWED_ORIGIN) return;
      if (e.data?.type === "cms-updated") {
        setMap((m) => ({ ...m, [e.data.key]: e.data.value }));
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [editMode]);

  // Click-to-edit: notify parent admin window which key was clicked
  const requestEdit = useCallback(
    (key) => {
      if (editMode && window.parent !== window) {
        window.parent.postMessage({ type: "cms-edit-request", key }, "*");
      }
    },
    [editMode]
  );

  const value = { map, items, loaded, editMode, requestEdit, reload: load };
  return <ContentContext.Provider value={value}>{children}</ContentContext.Provider>;
}

export function useContent() {
  const ctx = useContext(ContentContext);
  if (!ctx) throw new Error("useContent must be used within ContentProvider");
  return ctx;
}

// Convenience hook: get a single content value with a fallback
export function useText(key, fallback = "") {
  const { map } = useContent();
  return map[key] ?? fallback;
}
