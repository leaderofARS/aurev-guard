import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css"; // Tailwind global styles
import { BrowserRouter } from "react-router-dom";

// Development-only: optionally inject a fake CIP-30 wallet provider when
// VITE_USE_FAKE_WALLET=true is set in the dev environment. This allows
// local testing of signing flows without installing a browser extension.
if (import.meta.env.VITE_USE_FAKE_WALLET === "true") {
  // dynamic import so production bundles are not affected
  import("./dev/fakeWallet")
    .then(() => {
      console.log("Dev fake wallet loaded");
    })
    .catch((e) => console.warn("Failed to load fake wallet", e));
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
