import { apiRequest } from "./api-client";

export interface ApiForecastResult {
  successProbability: number;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  recommendedMonthlyDeposit: number;
  recommendedWeeklyDeposit: number;
  forecastedCompletionDate: string;
  budgetPressure: string;
  summary: string;
  recommendations: string[];
}

export interface CreateForecastInput {
  monthlyIncome: number;
  fixedExpenses: number;
  variableExpenses: number;
}

export function createForecastRequest(
  chainGoalId: number,
  input: CreateForecastInput
) {
  return apiRequest<{
    forecast: ApiForecastResult;
    savedReport: unknown;
  }>(`/api/forecast/${chainGoalId}`, {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export function getLatestForecastRequest(chainGoalId: number) {
  return apiRequest<{
    report: ApiForecastResult | null;
  }>(`/api/forecast/${chainGoalId}/latest`);
}