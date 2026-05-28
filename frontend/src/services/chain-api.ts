import { apiRequest } from "./api-client";
import type { ChainGoal, TokenBalance } from "./blockchain-api";

export interface CreateChainGoalInput {
  title: string;
  description?: string;
  category?: string;
  targetAmountEth: string;
  deadline: number;
  depositInterval: number;
}

export interface UserBenefits {
  ownerWallet: string;
  noPenaltyPasses: number;
  rewardBoosts: number;
}

export interface MarketplaceProduct {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  priceSave: string;
  category: "protocol" | "partner";
  material: boolean;
}

export interface MarketplacePurchase {
  id: string;
  userId: string;
  productId: string;
  title: string;
  priceSave: number;
  code: string;
  txHash: string;
  createdAt: string;
}

export function createChainGoalRequest(input: CreateChainGoalInput) {
  return apiRequest<{
    goal: ChainGoal;
    metadata: unknown;
    txHash: string;
  }>("/api/chain/goals", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export function depositChainGoalRequest(goalId: number, amountEth: string) {
  return apiRequest<{
    goal: ChainGoal;
    saveBalance: TokenBalance;
    benefits: UserBenefits;
    rewardAmountSave: string;
    txHash: string;
  }>(`/api/chain/goals/${goalId}/deposit`, {
    method: "POST",
    body: JSON.stringify({ amountEth })
  });
}

export function completeChainGoalRequest(goalId: number) {
  return apiRequest<{
    goal: ChainGoal;
    saveBalance: TokenBalance;
    txHash: string;
  }>(`/api/chain/goals/${goalId}/complete`, {
    method: "POST"
  });
}

export function earlyWithdrawChainGoalRequest(goalId: number) {
  return apiRequest<{
    goal: ChainGoal;
    saveBalance: TokenBalance;
    benefits: UserBenefits;
    burnedAmountSave: string;
    txHash: string;
  }>(`/api/chain/goals/${goalId}/early-withdraw`, {
    method: "POST"
  });
}

export function getMarketplaceBenefitsRequest() {
  return apiRequest<{
    benefits: UserBenefits;
    saveBalance: TokenBalance;
    purchases: MarketplacePurchase[];
  }>("/api/chain/marketplace/benefits");
}

export function getMarketplaceProductsRequest() {
  return apiRequest<{
    products: MarketplaceProduct[];
  }>("/api/chain/marketplace/products");
}

export function getMarketplacePurchasesRequest() {
  return apiRequest<{
    purchases: MarketplacePurchase[];
  }>("/api/chain/marketplace/purchases");
}

export function buyMarketplaceProductRequest(productId: string) {
  return apiRequest<{
    purchase: MarketplacePurchase;
    saveBalance: TokenBalance;
    txHash: string;
  }>(`/api/chain/marketplace/products/${productId}/purchase`, {
    method: "POST"
  });
}

export function buyNoPenaltyPassRequest() {
  return apiRequest<{
    benefits: UserBenefits;
    saveBalance: TokenBalance;
    txHash: string;
  }>("/api/chain/marketplace/no-penalty-pass", {
    method: "POST"
  });
}

export function buyRewardBoostRequest() {
  return apiRequest<{
    benefits: UserBenefits;
    saveBalance: TokenBalance;
    txHash: string;
  }>("/api/chain/marketplace/reward-boost", {
    method: "POST"
  });
}
