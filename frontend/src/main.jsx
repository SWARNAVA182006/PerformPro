import React from "react";
import ReactDOM from "react-dom/client";
import { GoogleOAuthProvider } from "@react-oauth/google";
import App from "./App";
import "./styles/global.css";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '803673399942-c36f4818m94ncc6e6igj3kf888ak13up.apps.googleusercontent.com';

if (!GOOGLE_CLIENT_ID) {
  console.warn('[PerformPro] VITE_GOOGLE_CLIENT_ID is not set — Google Login will be disabled.');
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <App />
    </GoogleOAuthProvider>
  </React.StrictMode>
);