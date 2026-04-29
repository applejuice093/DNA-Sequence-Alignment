import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { AlignmentProvider } from "./context/AlignmentContext";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AlignmentProvider>
        <App />
      </AlignmentProvider>
    </BrowserRouter>
  </React.StrictMode>
);
