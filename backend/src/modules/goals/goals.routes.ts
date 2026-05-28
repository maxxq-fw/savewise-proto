import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import { authMiddleware, type AuthenticatedRequest } from "../../middleware/auth.js";

export const goalsRoutes = Router();

goalsRoutes.use(authMiddleware);

const createGoalMetadataSchema = z.object({
  chainGoalId: z.number().int().optional(),
  ownerWallet: z.string().optional(),
  title: z.string().min(1),
  description: z.string().optional(),
  category: z.string().optional()
});

goalsRoutes.post(
  "/metadata",
  async (request: AuthenticatedRequest, response, next) => {
    try {
      const input = createGoalMetadataSchema.parse(request.body);

      const metadata = await prisma.goalMetadata.create({
        data: {
          userId: request.user!.id,
          chainGoalId: input.chainGoalId,
          ownerWallet: input.ownerWallet,
          title: input.title,
          description: input.description,
          category: input.category
        }
      });

      response.status(201).json({
        metadata
      });
    } catch (error) {
      next(error);
    }
  }
);

goalsRoutes.get("/", async (request: AuthenticatedRequest, response, next) => {
  try {
    const goals = await prisma.goalMetadata.findMany({
      where: {
        userId: request.user!.id
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    response.json({
      goals
    });
  } catch (error) {
    next(error);
  }
});