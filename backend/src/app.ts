import cors from "cors";
import express from "express";
import { authRoutes } from "./modules/auth/auth.routes.js";
import { blockchainRoutes } from "./modules/blockchain/blockchain.routes.js";
import { budgetRoutes } from "./modules/budget/budget.routes.js";
import { forecastRoutes } from "./modules/forecast/forecast.routes.js";
import { goalsRoutes } from "./modules/goals/goals.routes.js";
import { tokenRoutes } from "./modules/token/token.routes.js";
import { chainRoutes } from "./modules/chain/chain.routes.js";
import { errorHandler } from "./middleware/error-handler.js";

export const app = express();

app.use(
  cors({
    origin: true,
    credentials: true
  })
);

app.use(express.json());

app.get("/", (_request, response) => {
  response.json({
    service: "savewise-backend",
    status: "running",
    health: "/health",
    api: {
      auth: "/api/auth",
      goals: "/api/goals",
      budgetProfile: "/api/budget-profile",
      blockchain: "/api/blockchain",
      chain: "/api/chain",
      token: "/api/token",
      forecast: "/api/forecast"
    }
  });
});

app.get("/health", (_request, response) => {
  response.json({
    status: "ok",
    service: "savewise-backend"
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/goals", goalsRoutes);
app.use("/api/budget-profile", budgetRoutes);
app.use("/api/blockchain", blockchainRoutes);
app.use("/api/chain", chainRoutes);
app.use("/api/token", tokenRoutes);
app.use("/api/forecast", forecastRoutes);

app.use(errorHandler);