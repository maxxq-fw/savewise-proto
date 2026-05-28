import type { NextFunction, Request, Response } from "express";
import { HttpError } from "../utils/http-error.js";

export function errorHandler(
  error: unknown,
  _request: Request,
  response: Response,
  _next: NextFunction
) {
  if (error instanceof HttpError) {
    return response.status(error.statusCode).json({
      message: error.message
    });
  }

  if (error instanceof Error) {
    return response.status(500).json({
      message: error.message
    });
  }

  return response.status(500).json({
    message: "Internal server error"
  });
}