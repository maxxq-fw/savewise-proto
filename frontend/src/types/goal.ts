export type GoalStatus = "ACTIVE" | "COMPLETED" | "CLOSED";
export type DepositInterval = "DAILY" | "WEEKLY" | "MONTHLY";
export type RiskLevel = "LOW" | "MEDIUM" | "HIGH";

export interface DepositRecord {
  id: string;
  goalId: number;
  amount: number;
  createdAt: string;
  rewardAmount: number;
}

export interface SavingsGoal {
  id: number;
  title: string;
  description?: string;
  category: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  depositInterval: DepositInterval;
  status: GoalStatus;
  createdAt: string;
  successProbability: number;
  totalRewards: number;
  burnedTokens: number;
  plannedDepositAmount: number;
  rewardedMilestones: number;
  totalRewardMilestones: number;
  deposits: DepositRecord[];
}

export interface CreateGoalInput {
  id?: number;
  title: string;
  description?: string;
  category: string;
  targetAmount: number;
  deadline: string;
  depositInterval: DepositInterval;
  plannedDepositAmount?: number;
  rewardedMilestones?: number;
  totalRewardMilestones?: number;
}

export interface BudgetInput {
  monthlyIncome: number;
  fixedExpenses: number;
  variableExpenses: number;
}

export interface ForecastReport {
  id: string;
  goalId: number;
  successProbability: number;
  riskLevel: RiskLevel;
  recommendedMonthlyDeposit: number;
  recommendedWeeklyDeposit: number;
  forecastedCompletionDate: string;
  budgetPressure: string;
  summary: string;
  recommendations: string[];
  createdAt: string;
}