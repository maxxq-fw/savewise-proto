import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt, { type SignOptions } from "jsonwebtoken";
import { z } from "zod";
import { env } from "../../config/env.js";
import { prisma } from "../../lib/prisma.js";
import { authMiddleware, type AuthenticatedRequest } from "../../middleware/auth.js";
import { HttpError } from "../../utils/http-error.js";
import { custodialWalletService } from "../../services/custodial-wallet.service.js";

export const authRoutes = Router();

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6)
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

function createToken(userId: string) {
  const options: SignOptions = {
    expiresIn: env.jwtExpiresIn as SignOptions["expiresIn"]
  };

  return jwt.sign({ userId }, env.jwtSecret, options);
}

authRoutes.post("/register", async (request, response, next) => {
  try {
    const input = registerSchema.parse(request.body);

    const existingUser = await prisma.user.findUnique({
      where: {
        email: input.email.toLowerCase()
      }
    });

    if (existingUser) {
      throw new HttpError(409, "Пользователь с таким email уже существует.");
    }

    const passwordHash = await bcrypt.hash(input.password, 10);

    const createdUser = await prisma.user.create({
      data: {
        name: input.name,
        email: input.email.toLowerCase(),
        passwordHash
      },
      select: {
        id: true,
        name: true,
        email: true,
        walletAddress: true,
        createdAt: true
      }
    });

    const user = await custodialWalletService.assignWalletToUser(createdUser.id);
    const token = createToken(user.id);

    response.status(201).json({
      user,
      token
    });
  } catch (error) {
    next(error);
  }
});

authRoutes.post("/login", async (request, response, next) => {
  try {
    const input = loginSchema.parse(request.body);

    const user = await prisma.user.findUnique({
      where: {
        email: input.email.toLowerCase()
      }
    });

    if (!user) {
      throw new HttpError(401, "Неверный email или пароль.");
    }

    const isValidPassword = await bcrypt.compare(input.password, user.passwordHash);

    if (!isValidPassword) {
      throw new HttpError(401, "Неверный email или пароль.");
    }

    const token = createToken(user.id);

    response.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        walletAddress: user.walletAddress,
        createdAt: user.createdAt
      },
      token
    });
  } catch (error) {
    next(error);
  }
});

authRoutes.get("/me", authMiddleware, async (request: AuthenticatedRequest, response) => {
  response.json({
    user: request.user
  });
});

authRoutes.patch(
  "/wallet",
  authMiddleware,
  async (request: AuthenticatedRequest, response, next) => {
    try {
      const schema = z.object({
        walletAddress: z.string().min(20)
      });

      const input = schema.parse(request.body);

      const user = await prisma.user.update({
        where: {
          id: request.user!.id
        },
        data: {
          walletAddress: input.walletAddress
        },
        select: {
          id: true,
          name: true,
          email: true,
          walletAddress: true,
          createdAt: true
        }
      });

      response.json({
        user
      });
    } catch (error) {
      next(error);
    }
  }
);