import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter } from "react-router-dom";
import App from "./App";
import "./index.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";

// The app talks to the real backend at VITE_API_BASE_URL (http://localhost:8080).
// A development backend implementing all 23 documented endpoints runs as a
// separate mini-service on port 8080 (see mini-services/api-backend).
ReactDOM.createRoot(document.getElementById("root")!).render(
  <ThemeProvider
    attribute="class"
    defaultTheme="light"
    enableSystem
    disableTransitionOnChange
  >
    <HashRouter>
      <App />
    </HashRouter>
    <SonnerToaster position="top-center" richColors closeButton />
  </ThemeProvider>,
);
