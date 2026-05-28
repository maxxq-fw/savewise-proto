import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from "react";
import { initialGoals, tokenConfig } from "../data/mockData";
import { useAuth } from "./auth-context";
import type {
  BudgetInput,
  CreateGoalInput,
  DepositRecord,
  ForecastReport,
  RiskLevel,
  SavingsGoal
} from "../types/goal";

interface GoalsContextValue {
  goals: SavingsGoal[];
  forecasts: ForecastReport[];
  saveBalance: number;
  totalBurned: number;
  createGoal: (input: CreateGoalInput) => SavingsGoal;
  depositToGoal: (goalId: number, amount: number, rewardAmount?: number) => void;
  completeGoal: (goalId: number) => void;
  earlyWithdraw: (goalId: number, burnedAmount?: number) => void;
  generateForecast: (goalId: number, budget: BudgetInput) => ForecastReport;
  getGoalById: (goalId: number) => SavingsGoal | undefined;
  getLatestForecast: (goalId: number) => ForecastReport | undefined;
}

const GoalsContext = createContext<GoalsContextValue | null>(null);

const GOALS_STORAGE_KEY = "savewise_goals";
const FORECASTS_STORAGE_KEY = "savewise_forecasts";
const EXTRA_SAVE_STORAGE_KEY = "savewise_extra_save";
const TOTAL_BURNED_STORAGE_KEY = "savewise_total_burned";

function getUserScopedKey(baseKey: string, userId?: string) {
  return userId ? `${baseKey}_${userId}` : `${baseKey}_anonymous`;
}

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function addDays(date: Date, days: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function toDateInputValue(date: Date) {
  return date.toISOString().slice(0, 10);
}

function getRiskLevel(probability: number): RiskLevel {
  if (probability >= 75) return "LOW";
  if (probability >= 45) return "MEDIUM";
  return "HIGH";
}

function readGoals(userId?: string) {
  if (!userId) return initialGoals;

  const raw = localStorage.getItem(getUserScopedKey(GOALS_STORAGE_KEY, userId));
  if (!raw) return initialGoals;

  try {
    return JSON.parse(raw) as SavingsGoal[];
  } catch {
    return initialGoals;
  }
}

function readForecasts(userId?: string) {
  if (!userId) return [];

  const raw = localStorage.getItem(getUserScopedKey(FORECASTS_STORAGE_KEY, userId));
  if (!raw) return [];

  try {
    return JSON.parse(raw) as ForecastReport[];
  } catch {
    return [];
  }
}

function readNumber(key: string, fallback: number, userId?: string) {
  if (!userId) return fallback;

  const raw = localStorage.getItem(getUserScopedKey(key, userId));
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function GoalsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id;

  const [goals, setGoalsState] = useState<SavingsGoal[]>(() => readGoals(userId));
  const [forecasts, setForecastsState] = useState<ForecastReport[]>(() =>
    readForecasts(userId)
  );
  const [extraSaveBalance, setExtraSaveBalanceState] = useState(() =>
    readNumber(EXTRA_SAVE_STORAGE_KEY, 0, userId)
  );
  const [totalBurned, setTotalBurnedState] = useState(() =>
    readNumber(TOTAL_BURNED_STORAGE_KEY, 0, userId)
  );

  useEffect(() => {
    setGoalsState(readGoals(userId));
    setForecastsState(readForecasts(userId));
    setExtraSaveBalanceState(readNumber(EXTRA_SAVE_STORAGE_KEY, 0, userId));
    setTotalBurnedState(readNumber(TOTAL_BURNED_STORAGE_KEY, 0, userId));
  }, [userId]);

  function setGoals(
    nextGoals: SavingsGoal[] | ((current: SavingsGoal[]) => SavingsGoal[])
  ) {
    setGoalsState((current) => {
      const result =
        typeof nextGoals === "function" ? nextGoals(current) : nextGoals;
      if (userId) {
        localStorage.setItem(getUserScopedKey(GOALS_STORAGE_KEY, userId), JSON.stringify(result));
      }
      return result;
    });
  }

  function setForecasts(
    nextForecasts:
      | ForecastReport[]
      | ((current: ForecastReport[]) => ForecastReport[])
  ) {
    setForecastsState((current) => {
      const result =
        typeof nextForecasts === "function"
          ? nextForecasts(current)
          : nextForecasts;
      if (userId) {
        localStorage.setItem(getUserScopedKey(FORECASTS_STORAGE_KEY, userId), JSON.stringify(result));
      }
      return result;
    });
  }

  function setExtraSaveBalance(value: number | ((current: number) => number)) {
    setExtraSaveBalanceState((current) => {
      const result = typeof value === "function" ? value(current) : value;
      if (userId) {
        localStorage.setItem(getUserScopedKey(EXTRA_SAVE_STORAGE_KEY, userId), String(result));
      }
      return result;
    });
  }

  function setTotalBurned(value: number | ((current: number) => number)) {
    setTotalBurnedState((current) => {
      const result = typeof value === "function" ? value(current) : value;
      if (userId) {
        localStorage.setItem(getUserScopedKey(TOTAL_BURNED_STORAGE_KEY, userId), String(result));
      }
      return result;
    });
  }

  const saveBalance = useMemo(() => {
    const earned = goals.reduce((sum, goal) => sum + goal.totalRewards, 0);
    const burned = goals.reduce((sum, goal) => sum + goal.burnedTokens, 0);
    return Math.max(0, extraSaveBalance + earned - burned);
  }, [extraSaveBalance, goals]);

  function createGoal(input: CreateGoalInput) {
    const nextId =
      input.id ??
      (goals.length === 0 ? 1 : Math.max(...goals.map((goal) => goal.id)) + 1);

    const newGoal: SavingsGoal = {
      id: nextId,
      title: input.title,
      description: input.description,
      category: input.category,
      targetAmount: input.targetAmount,
      currentAmount: 0,
      deadline: input.deadline,
      depositInterval: input.depositInterval,
      status: "ACTIVE",
      createdAt: toDateInputValue(new Date()),
      successProbability: 50,
      totalRewards: 0,
      burnedTokens: 0,
      deposits: []
    };

    setGoals((current) => {
      const withoutDuplicate = current.filter((goal) => goal.id !== nextId);
      return [newGoal, ...withoutDuplicate];
    });

    return newGoal;
  }

  function depositToGoal(goalId: number, amount: number, rewardAmount = tokenConfig.regularDepositReward) {
    if (amount <= 0) return;

    setGoals((current) =>
      current.map((goal) => {
        if (goal.id !== goalId || goal.status !== "ACTIVE") return goal;

        const deposit: DepositRecord = {
          id: createId("dep"),
          goalId,
          amount,
          createdAt: toDateInputValue(new Date()),
          rewardAmount
        };

        const nextCurrentAmount = Math.min(
          goal.targetAmount,
          goal.currentAmount + amount
        );

        const progress = Math.round(
          (nextCurrentAmount / goal.targetAmount) * 100
        );

        return {
          ...goal,
          currentAmount: nextCurrentAmount,
          totalRewards: goal.totalRewards + rewardAmount,
          successProbability: Math.min(
            95,
            Math.max(goal.successProbability, progress)
          ),
          deposits: [deposit, ...goal.deposits]
        };
      })
    );
  }

  function completeGoal(goalId: number) {
    setGoals((current) =>
      current.map((goal) => {
        if (goal.id !== goalId || goal.status !== "ACTIVE") return goal;
        if (goal.currentAmount < goal.targetAmount) return goal;

        return {
          ...goal,
          status: "COMPLETED",
          successProbability: 100,
          totalRewards: goal.totalRewards + tokenConfig.goalCompletionReward
        };
      })
    );
  }

  function earlyWithdraw(goalId: number, burnedAmount = tokenConfig.earlyWithdrawPenalty) {
    setGoals((current) =>
      current.map((goal) => {
        if (goal.id !== goalId || goal.status !== "ACTIVE") return goal;

        return {
          ...goal,
          status: "CLOSED",
          burnedTokens: goal.burnedTokens + burnedAmount
        };
      })
    );

    setTotalBurned((current) => current + burnedAmount);
    setExtraSaveBalance((current) =>
      Math.max(0, current - burnedAmount)
    );
  }

  function generateForecast(goalId: number, budget: BudgetInput) {
    const goal = goals.find((item) => item.id === goalId);

    if (!goal) {
      throw new Error("Цель не найдена");
    }

    const today = new Date();
    const deadline = new Date(goal.deadline);
    const remainingDays = Math.max(
      1,
      Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    );

    const monthsLeft = Math.max(1, remainingDays / 30);
    const remainingAmount = Math.max(0, goal.targetAmount - goal.currentAmount);
    const monthlyFreeCashFlow =
      budget.monthlyIncome - budget.fixedExpenses - budget.variableExpenses;

    const requiredMonthlyDeposit = remainingAmount / monthsLeft;
    const rawProbability =
      requiredMonthlyDeposit === 0
        ? 100
        : (monthlyFreeCashFlow / requiredMonthlyDeposit) * 70;

    const successProbability = Math.round(
      Math.max(5, Math.min(95, rawProbability))
    );

    const recommendedMonthlyDeposit = Math.ceil(requiredMonthlyDeposit);
    const recommendedWeeklyDeposit = Math.ceil(requiredMonthlyDeposit / 4.33);

    const riskLevel = getRiskLevel(successProbability);

    const budgetPressure =
      monthlyFreeCashFlow < requiredMonthlyDeposit
        ? "Высокая нагрузка"
        : monthlyFreeCashFlow < requiredMonthlyDeposit * 1.5
          ? "Средняя нагрузка"
          : "Низкая нагрузка";

    const expectedMonths =
      monthlyFreeCashFlow <= 0
        ? monthsLeft * 2
        : remainingAmount / Math.max(1, monthlyFreeCashFlow);

    const forecastedCompletionDate = toDateInputValue(
      addDays(today, Math.ceil(expectedMonths * 30))
    );

    const recommendations = [
      `Откладывать не менее ${recommendedWeeklyDeposit} ETH в неделю.`,
      "Не использовать досрочный вывод без необходимости, так как он применяет штраф в SAVE.",
      monthlyFreeCashFlow < requiredMonthlyDeposit
        ? "Сократить переменные расходы или увеличить срок достижения цели."
        : "Текущий бюджет позволяет двигаться к цели без критической нагрузки."
    ];

    const report: ForecastReport = {
      id: createId("forecast"),
      goalId,
      successProbability,
      riskLevel,
      recommendedMonthlyDeposit,
      recommendedWeeklyDeposit,
      forecastedCompletionDate,
      budgetPressure,
      summary:
        riskLevel === "LOW"
          ? "Цель выглядит достижимой при сохранении текущей финансовой дисциплины."
          : riskLevel === "MEDIUM"
            ? "Цель достижима, но требует регулярных пополнений и контроля переменных расходов."
            : "Риск невыполнения высокий. Нужно изменить сумму регулярного депозита, срок или структуру расходов.",
      recommendations,
      createdAt: toDateInputValue(new Date())
    };

    setForecasts((current) => [report, ...current]);

    setGoals((current) =>
      current.map((item) =>
        item.id === goalId
          ? { ...item, successProbability: report.successProbability }
          : item
      )
    );

    return report;
  }

  function getGoalById(goalId: number) {
    return goals.find((goal) => goal.id === goalId);
  }

  function getLatestForecast(goalId: number) {
    return forecasts.find((forecast) => forecast.goalId === goalId);
  }

  const value: GoalsContextValue = {
    goals,
    forecasts,
    saveBalance,
    totalBurned,
    createGoal,
    depositToGoal,
    completeGoal,
    earlyWithdraw,
    generateForecast,
    getGoalById,
    getLatestForecast
  };

  return (
    <GoalsContext.Provider value={value}>{children}</GoalsContext.Provider>
  );
}

export function useGoals() {
  const context = useContext(GoalsContext);

  if (!context) {
    throw new Error("useGoals должен использоваться внутри GoalsProvider");
  }

  return context;
}