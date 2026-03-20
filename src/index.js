import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);

// Register service worker for PWA offline support
if ("serviceWorker" in navigator) {
  window.addEventListener("load", function() {
    navigator.serviceWorker
      .register("/service-worker.js")
      .then(function(reg) {
        console.log("Service worker registered:", reg.scope);
      })
      .catch(function(err) {
        console.log("Service worker registration failed:", err);
      });
  });
}
