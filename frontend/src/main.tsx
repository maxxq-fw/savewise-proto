import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { AuthProvider } from "./store/auth-context";
import { GoalsProvider } from "./store/goals-context";
import { router } from "./app/router";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AuthProvider>
      <GoalsProvider>
        <RouterProvider router={router} />
      </GoalsProvider>
    </AuthProvider>
  </React.StrictMode>
);
