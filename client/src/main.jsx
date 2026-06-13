import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HelmetProvider } from "react-helmet-async";
import App from "./App.jsx";
import { ContentProvider } from "./store/ContentContext.jsx";
import "./index.css";

class ErrorBoundary extends React.Component {
  state = { error: null };
  static getDerivedStateFromError(e) { return { error: e }; }
  render() {
    if (this.state.error) return (
      <div style={{ padding: "2rem", fontFamily: "monospace" }}>
        <h2>Something went wrong.</h2>
        <pre style={{ color: "red" }}>{this.state.error.message}</pre>
        <button onClick={() => window.location.reload()}>Reload</button>
      </div>
    );
    return this.props.children;
  }
}

const queryClient = new QueryClient({
  defaultOptions: { queries: { refetchOnWindowFocus: false, staleTime: 30000 } },
});

// Add edit-mode body class when iframe loads with ?editMode=true
if (new URLSearchParams(window.location.search).get("editMode") === "true") {
  document.documentElement.classList.add("cms-edit-mode");
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <HelmetProvider>
        <QueryClientProvider client={queryClient}>
          <ContentProvider>
            <BrowserRouter>
              <App />
            </BrowserRouter>
          </ContentProvider>
        </QueryClientProvider>
      </HelmetProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
