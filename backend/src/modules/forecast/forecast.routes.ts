import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import { authMiddleware, type AuthenticatedRequest } from "../../middleware/auth.js";
import { aiService } from "../../services/ai.service.js";
import { blockchainService } from "../../services/blockchain.service.js";

export const forecastRoutes = Router();

forecastRoutes.use(authMiddleware);

const forecastSchema = z.object({
  monthlyIncome: z.number().nonnegative(),
  fixedExpenses: z.number().nonnegative(),
  variableExpenses: z.number().nonnegative()
});

forecastRoutes.post(
  "/:chainGoalId",
  async (request: AuthenticatedRequest, response, next) => {
    try {
      const chainGoalId = Number(request.params.chainGoalId);
      const budget = forecastSchema.parse(request.body);

      const goal = await blockchainService.getGoal(chainGoalId);

      const forecast = await aiService.generateForecast({
        goal: {
          id: goal.id,
          title: goal.title,
          targetAmountEth: goal.targetAmountEth,
          currentAmountEth: goal.currentAmountEth,
          deadline: goal.deadline
        },
        budget
      });

      const savedReport = await prisma.forecastReport.create({
        data: {
          userId: request.user!.id,
          chainGoalId,
          successProbability: forecast.successProbability,
          riskLevel: forecast.riskLevel,
          recommendedMonthlyDeposit: forecast.recommendedMonthlyDeposit,
          recommendedWeeklyDeposit: forecast.recommendedWeeklyDeposit,
          forecastedCompletionDate: forecast.forecastedCompletionDate,
          budgetPressure: forecast.budgetPressure,
          summary: forecast.summary,
          recommendations: JSON.stringify(forecast.recommendations),
          aiProvider: "groq"
        }
      });

      response.status(201).json({
        forecast,
        savedReport
      });
    } catch (error) {
      next(error);
    }
  }
);

forecastRoutes.get(
  "/:chainGoalId/latest",
  async (request: AuthenticatedRequest, response, next) => {
    try {
      const chainGoalId = Number(request.params.chainGoalId);

      const report = await prisma.forecastReport.findFirst({
        where: {
          userId: request.user!.id,
          chainGoalId
        },
        orderBy: {
          createdAt: "desc"
        }
      });

      response.json({
        report: report
          ? {
              ...report,
              recommendations: JSON.parse(report.recommendations)
            }
          : null
      });
    } catch (error) {
      next(error);
    }
  }
);