import { Router } from "express";
import { blockchainService } from "../../services/blockchain.service.js";

export const blockchainRoutes = Router();

blockchainRoutes.get("/network", async (_request, response, next) => {
  try {
    const network = await blockchainService.getNetwork();
    response.json({ network });
  } catch (error) {
    next(error);
  }
});

blockchainRoutes.get("/contracts", (_request, response, next) => {
  try {
    const deploymentInfo = blockchainService.getDeploymentInfo();
    response.json({ deploymentInfo });
  } catch (error) {
    next(error);
  }
});

blockchainRoutes.get("/goals/user/:wallet", async (request, response, next) => {
  try {
    const goals = await blockchainService.getUserGoals(request.params.wallet);
    response.json({ goals });
  } catch (error) {
    next(error);
  }
});

blockchainRoutes.get("/goals/:goalId", async (request, response, next) => {
  try {
    const goal = await blockchainService.getGoal(Number(request.params.goalId));
    response.json({ goal });
  } catch (error) {
    next(error);
  }
});