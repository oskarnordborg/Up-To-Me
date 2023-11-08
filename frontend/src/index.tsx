import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import { BrowserRouter } from "react-router-dom";
import reportWebVitals from "./reportWebVitals";
import { AuthProvider } from "./context/AuthProvider";

let startY = 0;
let isRefreshing = false;

// Listen for the touchstart event to record the starting position.
document.addEventListener("touchstart", (e) => {
  startY = e.touches[0].clientY;
});

// Listen for the touchmove event to detect the pull-down gesture.
document.addEventListener("touchmove", (e) => {
  const currentY = e.touches[0].clientY;

  // Calculate the vertical distance dragged.
  const deltaY = currentY - startY;

  // Check if the user has dragged down a certain distance (e.g., 100 pixels).
  if (deltaY > 100) {
    isRefreshing = true;
  }
});

// Listen for the touchend event to trigger a refresh if the pull-down gesture was detected.
document.addEventListener("touchend", () => {
  if (isRefreshing) {
    // Reload the page to refresh.
    window.location.reload();

    // Reset the refresh state.
    isRefreshing = false;
  }
});

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);
root.render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
