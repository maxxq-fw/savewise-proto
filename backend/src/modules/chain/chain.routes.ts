import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import { authMiddleware, type AuthenticatedRequest } from "../../middleware/auth.js";
import { blockchainService } from "../../services/blockchain.service.js";
import { custodialWalletService } from "../../services/custodial-wallet.service.js";
import {
  createVoucherCode,
  getMaterialProduct,
  materialMarketplaceProducts
} from "../../services/marketplace-products.js";
import { HttpError } from "../../utils/http-error.js";

export const chainRoutes = Router();

chainRoutes.use(authMiddleware);

const createGoalSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  category: z.string().optional(),
  targetAmountEth: z.string().min(1),
  deadline: z.number().int().positive(),
  depositInterval: z.number().int().positive()
});

const depositSchema = z.object({
  amountEth: z.string().min(1)
});

async function getUserWallet(request: AuthenticatedRequest) {
  const user = await custodialWalletService.ensureUserWallet(request.user!.id);

  if (!user.walletAddress) {
    throw new HttpError(500, "User wallet was not assigned.");
  }

  return user.walletAddress;
}

chainRoutes.post("/goals", async (request: AuthenticatedRequest, response, next) => {
  try {
    const input = createGoalSchema.parse(request.body);
    const walletAddress = await getUserWallet(request);

    const result = await blockchainService.createGoal(walletAddress, {
      title: input.title,
      targetAmountEth: input.targetAmountEth,
      deadline: input.deadline,
      depositInterval: input.depositInterval
    });

    const metadata = await prisma.goalMetadata.create({
      data: {
        userId: request.user!.id,
        chainGoalId: result.goalId,
        ownerWallet: result.goal.owner,
        title: input.title,
        description: input.description,
        category: input.category
      }
    });

    response.status(201).json({
      goal: result.goal,
      metadata,
      txHash: result.txHash
    });
  } catch (error) {
    next(error);
  }
});

chainRoutes.post(
  "/goals/:goalId/deposit",
  async (request: AuthenticatedRequest, response, next) => {
    try {
      const goalId = Number(request.params.goalId);
      const input = depositSchema.parse(request.body);
      const walletAddress = await getUserWallet(request);

      const result = await blockchainService.deposit(
        walletAddress,
        goalId,
        input.amountEth
      );

      response.json(result);
    } catch (error) {
      next(error);
    }
  }
);

chainRoutes.post(
  "/goals/:goalId/complete",
  async (request: AuthenticatedRequest, response, next) => {
    try {
      const goalId = Number(request.params.goalId);
      const walletAddress = await getUserWallet(request);
      const result = await blockchainService.completeGoal(walletAddress, goalId);

      response.json(result);
    } catch (error) {
      next(error);
    }
  }
);

chainRoutes.post(
  "/goals/:goalId/early-withdraw",
  async (request: AuthenticatedRequest, response, next) => {
    try {
      const goalId = Number(request.params.goalId);
      const walletAddress = await getUserWallet(request);
      const result = await blockchainService.earlyWithdraw(walletAddress, goalId);

      response.json(result);
    } catch (error) {
      next(error);
    }
  }
);

chainRoutes.post(
  "/goals/:goalId/pay-forecast",
  async (request: AuthenticatedRequest, response, next) => {
    try {
      const goalId = Number(request.params.goalId);
      const walletAddress = await getUserWallet(request);
      const result = await blockchainService.payForAiForecast(walletAddress, goalId);

      response.json(result);
    } catch (error) {
      next(error);
    }
  }
);

chainRoutes.get(
  "/marketplace/benefits",
  async (request: AuthenticatedRequest, response, next) => {
    try {
      const walletAddress = await getUserWallet(request);
      const [benefits, saveBalance, purchases] = await Promise.all([
        blockchainService.getUserBenefits(walletAddress),
        blockchainService.getSaveBalance(walletAddress),
        prisma.marketplacePurchase.findMany({
          where: {
            userId: request.user!.id
          },
          orderBy: {
            createdAt: "desc"
          }
        })
      ]);

      response.json({
        benefits,
        saveBalance,
        purchases
      });
    } catch (error) {
      next(error);
    }
  }
);

chainRoutes.get("/marketplace/products", async (_request, response) => {
  response.json({
    products: materialMarketplaceProducts
  });
});

chainRoutes.get(
  "/marketplace/purchases",
  async (request: AuthenticatedRequest, response, next) => {
    try {
      const purchases = await prisma.marketplacePurchase.findMany({
        where: {
          userId: request.user!.id
        },
        orderBy: {
          createdAt: "desc"
        }
      });

      response.json({
        purchases
      });
    } catch (error) {
      next(error);
    }
  }
);

chainRoutes.post(
  "/marketplace/products/:productId/purchase",
  async (request: AuthenticatedRequest, response, next) => {
    try {
      const product = getMaterialProduct(String(request.params.productId));

      if (!product) {
        throw new HttpError(404, "Marketplace product not found.");
      }

      const walletAddress = await getUserWallet(request);
      const burnResult = await blockchainService.burnSave(
        walletAddress,
        product.priceSave
      );

      const purchase = await prisma.marketplacePurchase.create({
        data: {
          userId: request.user!.id,
          productId: product.id,
          title: product.title,
          priceSave: Number(product.priceSave),
          code: createVoucherCode(product.id),
          txHash: burnResult.txHash
        }
      });

      response.json({
        purchase,
        saveBalance: burnResult.saveBalance,
        txHash: burnResult.txHash
      });
    } catch (error) {
      next(error);
    }
  }
);

chainRoutes.post(
  "/marketplace/no-penalty-pass",
  async (request: AuthenticatedRequest, response, next) => {
    try {
      const walletAddress = await getUserWallet(request);
      const result = await blockchainService.buyNoPenaltyPass(walletAddress);

      response.json(result);
    } catch (error) {
      next(error);
    }
  }
);

chainRoutes.post(
  "/marketplace/reward-boost",
  async (request: AuthenticatedRequest, response, next) => {
    try {
      const walletAddress = await getUserWallet(request);
      const result = await blockchainService.buyRewardBoost(walletAddress);

      response.json(result);
    } catch (error) {
      next(error);
    }
  }
);
