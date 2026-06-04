import { apiRequest } from "./api-client";

export interface DeploymentInfo {
  network: string;
  chainId: number;
  saveToken: string;
  savingsVault: string;
  deployer: string;
  deployedAt: string;
}

export interface TokenStats {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  totalSupplyWei: string;
  totalSupply: string;
}

export interface TokenBalance {
  walletAddress: string;
  balanceWei: string;
  balance: string;
}

export interface ChainGoal {
  id: number;
  owner: string;
  title: string;
  targetAmountWei: string;
  currentAmountWei: string;
  targetAmountEth: string;
  currentAmountEth: string;
  startDate: number;
  deadline: number;
  depositInterval: number;
  lastDepositAt: number;
  rewardedMilestones: number;
  periodCount: number;
  plannedDepositAmountWei: string;
  plannedDepositAmountEth: string;
  totalRewardMilestones: number;
  minimumDepositAmountEth: string;
  completed: boolean;
  closed: boolean;
}

export function getContractsRequest() {
  return apiRequest<{ deploymentInfo: DeploymentInfo }>(
    "/api/blockchain/contracts",
    { auth: false }
  );
}

export function getNetworkRequest() {
  return apiRequest<{ network: { name: string; chainId: number } }>(
    "/api/blockchain/network",
    { auth: false }
  );
}

export function getTokenStatsRequest() {
  return apiRequest<{ stats: TokenStats }>("/api/token/stats", {
    auth: false
  });
}

export function getSaveBalanceRequest(walletAddress: string) {
  return apiRequest<{ balance: TokenBalance }>(
    `/api/token/balance/${walletAddress}`,
    { auth: false }
  );
}

export function getChainGoalRequest(goalId: number) {
  return apiRequest<{ goal: ChainGoal }>(`/api/blockchain/goals/${goalId}`, {
    auth: false
  });
}

export function getUserChainGoalsRequest(walletAddress: string) {
  return apiRequest<{ goals: ChainGoal[] }>(
    `/api/blockchain/goals/user/${walletAddress}`,
    { auth: false }
  );
}