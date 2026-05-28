import { Router } from "express";
import { blockchainService } from "../../services/blockchain.service.js";

export const tokenRoutes = Router();

tokenRoutes.get("/stats", async (_request, response, next) => {
  try {
    const stats = await blockchainService.getTokenStats();
    response.json({ stats });
  } catch (error) {
    next(error);
  }
});

tokenRoutes.get("/balance/:wallet", async (request, response, next) => {
  try {
    const balance = await blockchainService.getSaveBalance(request.params.wallet);
    response.json({ balance });
  } catch (error) {
    next(error);
  }
});