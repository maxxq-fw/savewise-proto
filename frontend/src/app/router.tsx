import { createBrowserRouter, Navigate } from "react-router-dom";
import { AppLayout } from "../components/layout/AppLayout";
import { ProtectedRoute } from "../components/routing/ProtectedRoute";
import { PublicOnlyRoute } from "../components/routing/PublicOnlyRoute";
import { CreateGoalPage } from "../pages/CreateGoalPage";
import { DashboardPage } from "../pages/DashboardPage";
import { ForecastPage } from "../pages/ForecastPage";
import { GoalDetailsPage } from "../pages/GoalDetailsPage";
import { GoalsPage } from "../pages/GoalsPage";
import { LoginPage } from "../pages/LoginPage";
import { MarketplacePage } from "../pages/MarketplacePage";
import { ProfilePage } from "../pages/ProfilePage";
import { RegisterPage } from "../pages/RegisterPage";
import { TokenomicsPage } from "../pages/TokenomicsPage";

export const router = createBrowserRouter([
  {
    path: "/login",
    element: (
      <PublicOnlyRoute>
        <LoginPage />
      </PublicOnlyRoute>
    )
  },
  {
    path: "/register",
    element: (
      <PublicOnlyRoute>
        <RegisterPage />
      </PublicOnlyRoute>
    )
  },
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />
      },
      {
        path: "dashboard",
        element: <DashboardPage />
      },
      {
        path: "goals",
        element: <GoalsPage />
      },
      {
        path: "goals/new",
        element: <CreateGoalPage />
      },
      {
        path: "goals/:id",
        element: <GoalDetailsPage />
      },
      {
        path: "forecast/:id",
        element: <ForecastPage />
      },
      {
        path: "tokenomics",
        element: <TokenomicsPage />
      },
      {
        path: "marketplace",
        element: <MarketplacePage />
      },
      {
        path: "profile",
        element: <ProfilePage />
      }
    ]
  }
]);