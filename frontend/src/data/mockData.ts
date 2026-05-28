import type { SavingsGoal } from "../types/goal";

export const initialGoals: SavingsGoal[] = [];

export const tokenConfig = {
  initialSupply: 1_000_000,
  regularDepositReward: 5,
  boostedDepositReward: 10,
  rewardBoostDepositsPerPurchase: 5,
  goalCompletionReward: 25,
  earlyWithdrawPenalty: 10,
  noPenaltyPassPrice: 15,
  rewardBoostPrice: 20,
  pyaterochkaDiscountPrice: 10,
  coffeeCertificatePrice: 6,
  tbankCashbackCategoryPrice: 12
};
