import dotenv from "dotenv";

dotenv.config();

function getEnv(name: string, fallback?: string) {
  const value = process.env[name] ?? fallback;

  if (value === undefined) {
    throw new Error(`Missing environment variable: ${name}`);
  }

  return value;
}

function getRequiredEnv(name: string) {
  const value = process.env[name];

  if (!value || value.trim().length === 0) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value.trim();
}

export const env = {
  nodeEnv: getEnv("NODE_ENV", "development"),
  port: Number(getEnv("PORT", "4000")),

  databaseUrl: getEnv("DATABASE_URL", "file:./dev.db"),

  jwtSecret: getEnv("JWT_SECRET", "savewise_super_secret_change_me"),
  jwtExpiresIn: getEnv("JWT_EXPIRES_IN", "7d"),

  rpcUrl: getEnv("RPC_URL", "http://127.0.0.1:8545"),
  contractsDir: getEnv("CONTRACTS_DIR", "../shared/contracts"),

  backendPrivateKey: getRequiredEnv("BACKEND_PRIVATE_KEY"),
  custodialPrivateKeys: getRequiredEnv("CUSTODIAL_PRIVATE_KEYS"),

  groqApiKey: getEnv("GROQ_API_KEY", ""),
  groqModel: getEnv("GROQ_MODEL", "llama-3.1-8b-instant")
};