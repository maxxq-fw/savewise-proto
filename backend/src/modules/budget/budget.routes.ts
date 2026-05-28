import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import { authMiddleware, type AuthenticatedRequest } from "../../middleware/auth.js";

export const budgetRoutes = Router();

budgetRoutes.use(authMiddleware);

const budgetSchema = z.object({
  monthlyIncome: z.number().nonnegative(),
  fixedExpenses: z.number().nonnegative(),
  variableExpenses: z.number().nonnegative()
});

budgetRoutes.post("/", async (request: AuthenticatedRequest, response, next) => {
  try {
    const input = budgetSchema.parse(request.body);

    const profile = await prisma.budgetProfile.create({
      data: {
        userId: request.user!.id,
        monthlyIncome: input.monthlyIncome,
        fixedExpenses: input.fixedExpenses,
        variableExpenses: input.variableExpenses
      }
    });

    response.status(201).json({
      profile
    });
  } catch (error) {
    next(error);
  }
});

budgetRoutes.get("/latest", async (request: AuthenticatedRequest, response, next) => {
  try {
    const profile = await prisma.budgetProfile.findFirst({
      where: {
        userId: request.user!.id
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    response.json({
      profile
    });
  } catch (error) {
    next(error);
  }
});