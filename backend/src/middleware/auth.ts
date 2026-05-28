import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { prisma } from "../lib/prisma.js";
import { HttpError } from "../utils/http-error.js";

interface JwtPayload {
  userId: string;
}

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    name: string;
    email: string;
    walletAddress: string | null;
  };
}

export async function authMiddleware(
  request: AuthenticatedRequest,
  _response: Response,
  next: NextFunction
) {
  try {
    const header = request.headers.authorization;

    if (!header || !header.startsWith("Bearer ")) {
      throw new HttpError(401, "Authorization token is missing.");
    }

    const token = header.replace("Bearer ", "");

    const payload = jwt.verify(token, env.jwtSecret) as JwtPayload;

    const user = await prisma.user.findUnique({
      where: {
        id: payload.userId
      },
      select: {
        id: true,
        name: true,
        email: true,
        walletAddress: true
      }
    });

    if (!user) {
      throw new HttpError(401, "User not found.");
    }

    request.user = user;
    next();
  } catch (error) {
    next(error);
  }
}