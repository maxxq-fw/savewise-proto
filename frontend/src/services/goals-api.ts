import { apiRequest } from "./api-client";

export interface CreateGoalMetadataInput {
  chainGoalId?: number;
  ownerWallet?: string;
  title: string;
  description?: string;
  category?: string;
}

export function createGoalMetadataRequest(input: CreateGoalMetadataInput) {
  return apiRequest<{ metadata: unknown }>("/api/goals/metadata", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export function getGoalMetadataRequest() {
  return apiRequest<{ goals: unknown[] }>("/api/goals");
}