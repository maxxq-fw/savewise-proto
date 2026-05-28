import fs from "fs";
import path from "path";
import { ethers } from "ethers";
import { env } from "../config/env.js";
import { custodialWalletService } from "./custodial-wallet.service.js";
import { HttpError } from "../utils/http-error.js";

interface DeploymentInfo {
  network: string;
  chainId: number;
  saveToken: string;
  savingsVault: string;
  deployer: string;
  deployedAt: string;
}

interface RawGoal {
  id: bigint;
  owner: string;
  title: string;
  targetAmount: bigint;
  currentAmount: bigint;
  startDate: bigint;
  deadline: bigint;
  depositInterval: bigint;
  lastDepositAt: bigint;
  completed: boolean;
  closed: boolean;
}

function readJsonFile<T>(filePath: string): T {
  if (!fs.existsSync(filePath)) {
    throw new HttpError(500, `File not found: ${filePath}`);
  }

  return JSON.parse(fs.readFileSync(filePath, "utf-8")) as T;
}

function readAbi(filePath: string) {
  const parsed = readJsonFile<unknown>(filePath);

  if (typeof parsed === "string") {
    return JSON.parse(parsed);
  }

  return parsed;
}

function getContractsPath(fileName: string) {
  return path.resolve(process.cwd(), env.contractsDir, fileName);
}

function normalizeGoal(goal: RawGoal) {
  return {
    id: Number(goal.id),
    owner: goal.owner,
    title: goal.title,
    targetAmountWei: goal.targetAmount.toString(),
    currentAmountWei: goal.currentAmount.toString(),
    targetAmountEth: ethers.formatEther(goal.targetAmount),
    currentAmountEth: ethers.formatEther(goal.currentAmount),
    startDate: Number(goal.startDate),
    deadline: Number(goal.deadline),
    depositInterval: Number(goal.depositInterval),
    lastDepositAt: Number(goal.lastDepositAt),
    completed: goal.completed,
    closed: goal.closed
  };
}

class BlockchainService {
  private provider: ethers.JsonRpcProvider;
  private backendWallet: ethers.Wallet;
  private txQueues = new Map<string, Promise<unknown>>();

  constructor() {
    this.provider = new ethers.JsonRpcProvider(env.rpcUrl);
    this.backendWallet = new ethers.Wallet(env.backendPrivateKey, this.provider);
  }

  getDeploymentInfo() {
    return readJsonFile<DeploymentInfo>(getContractsPath("localhost.json"));
  }

  getProvider() {
    return this.provider;
  }

  getSignerAddress() {
    return this.backendWallet.address;
  }

  private getWalletForAddress(walletAddress: string) {
    const account = custodialWalletService.getAccountByAddress(walletAddress);
    return new ethers.Wallet(account.privateKey, this.provider);
  }

  private async withWalletTransactionQueue<T>(
    walletAddress: string,
    task: () => Promise<T>
  ): Promise<T> {
    const key = walletAddress.toLowerCase();
    const previous = this.txQueues.get(key) ?? Promise.resolve();
    const current = previous.then(task, task);

    this.txQueues.set(
      key,
      current.catch(() => undefined)
    );

    return current;
  }

  private async getFreshNonce(wallet: ethers.Wallet) {
    const nonceHex = await this.provider.send("eth_getTransactionCount", [
      wallet.address,
      "pending"
    ]);

    return Number(BigInt(nonceHex));
  }

  getContracts() {
    const deploymentInfo = this.getDeploymentInfo();

    const saveTokenAbi = readAbi(getContractsPath("SaveTokenABI.json"));
    const savingsVaultAbi = readAbi(getContractsPath("SavingsVaultABI.json"));

    const saveToken = new ethers.Contract(
      deploymentInfo.saveToken,
      saveTokenAbi,
      this.provider
    );

    const savingsVault = new ethers.Contract(
      deploymentInfo.savingsVault,
      savingsVaultAbi,
      this.provider
    );

    return {
      deploymentInfo,
      saveToken,
      savingsVault
    };
  }

  getWritableContracts(walletAddress: string) {
    const deploymentInfo = this.getDeploymentInfo();
    const wallet = this.getWalletForAddress(walletAddress);

    const saveTokenAbi = readAbi(getContractsPath("SaveTokenABI.json"));
    const savingsVaultAbi = readAbi(getContractsPath("SavingsVaultABI.json"));

    const saveToken = new ethers.Contract(
      deploymentInfo.saveToken,
      saveTokenAbi,
      wallet
    );

    const savingsVault = new ethers.Contract(
      deploymentInfo.savingsVault,
      savingsVaultAbi,
      wallet
    );

    return {
      deploymentInfo,
      wallet,
      saveToken,
      savingsVault
    };
  }

  async getNetwork() {
    const network = await this.provider.getNetwork();

    return {
      name: network.name,
      chainId: Number(network.chainId)
    };
  }

  async getSaveBalance(walletAddress: string) {
    const { saveToken } = this.getContracts();
    const balance = await saveToken.balanceOf(walletAddress);

    return {
      walletAddress,
      balanceWei: balance.toString(),
      balance: ethers.formatEther(balance)
    };
  }

  async getBackendSaveBalance() {
    return this.getSaveBalance(this.backendWallet.address);
  }

  async getTokenStats() {
    const { saveToken, deploymentInfo } = this.getContracts();

    const [name, symbol, decimals, totalSupply] = await Promise.all([
      saveToken.name(),
      saveToken.symbol(),
      saveToken.decimals(),
      saveToken.totalSupply()
    ]);

    return {
      address: deploymentInfo.saveToken,
      name,
      symbol,
      decimals: Number(decimals),
      totalSupplyWei: totalSupply.toString(),
      totalSupply: ethers.formatEther(totalSupply)
    };
  }

  async getGoal(goalId: number) {
    const { savingsVault } = this.getContracts();
    const goal = (await savingsVault.getGoal(goalId)) as RawGoal;

    return normalizeGoal(goal);
  }

  async getUserGoals(walletAddress: string) {
    const { savingsVault } = this.getContracts();
    const goalIds = (await savingsVault.getUserGoals(walletAddress)) as bigint[];

    const goals = await Promise.all(
      goalIds.map((goalId) => this.getGoal(Number(goalId)))
    );

    return goals;
  }

  async getUserBenefits(walletAddress: string) {
    const { savingsVault } = this.getContracts();
    const benefits = await savingsVault.getUserBenefits(walletAddress);

    return {
      ownerWallet: walletAddress,
      noPenaltyPasses: Number(benefits.noPenaltyPasses),
      rewardBoosts: Number(benefits.rewardBoosts)
    };
  }

  private extractGoalId(
    receipt: ethers.ContractTransactionReceipt,
    savingsVault: ethers.Contract
  ) {
    for (const log of receipt.logs) {
      try {
        const parsed = savingsVault.interface.parseLog({
          topics: [...log.topics],
          data: log.data
        });

        if (parsed?.name === "GoalCreated") {
          return Number(parsed.args.goalId);
        }
      } catch {
        // Ignore logs from other contracts.
      }
    }

    throw new HttpError(500, "GoalCreated event not found in transaction receipt.");
  }

  private extractDepositReward(
    receipt: ethers.ContractTransactionReceipt,
    savingsVault: ethers.Contract
  ) {
    for (const log of receipt.logs) {
      try {
        const parsed = savingsVault.interface.parseLog({
          topics: [...log.topics],
          data: log.data
        });

        if (parsed?.name === "DepositMade") {
          return ethers.formatEther(parsed.args.rewardAmount as bigint);
        }
      } catch {
        // Ignore logs from other contracts.
      }
    }

    return "5.0";
  }

  private extractEarlyWithdrawBurnedAmount(
    receipt: ethers.ContractTransactionReceipt,
    savingsVault: ethers.Contract
  ) {
    for (const log of receipt.logs) {
      try {
        const parsed = savingsVault.interface.parseLog({
          topics: [...log.topics],
          data: log.data
        });

        if (parsed?.name === "EarlyWithdraw") {
          return ethers.formatEther(parsed.args.burnedAmount as bigint);
        }
      } catch {
        // Ignore logs from other contracts.
      }
    }

    return "10.0";
  }

  private async assertMined(
    receipt: ethers.ContractTransactionReceipt | null,
    message: string
  ) {
    if (!receipt) {
      throw new HttpError(500, message);
    }

    if (receipt.status !== 1) {
      throw new HttpError(500, "Transaction reverted.");
    }
  }

  async createGoal(
    walletAddress: string,
    input: {
      title: string;
      targetAmountEth: string;
      deadline: number;
      depositInterval: number;
    }
  ) {
    return this.withWalletTransactionQueue(walletAddress, async () => {
      const { wallet, savingsVault } = this.getWritableContracts(walletAddress);

      const tx = await savingsVault.createGoal(
        input.title,
        ethers.parseEther(input.targetAmountEth),
        BigInt(input.deadline),
        BigInt(input.depositInterval),
        {
          nonce: await this.getFreshNonce(wallet)
        }
      );

      const receipt = await tx.wait();
      await this.assertMined(receipt, "Create goal transaction was not mined.");

      const goalId = this.extractGoalId(receipt, savingsVault);
      const goal = await this.getGoal(goalId);

      return {
        goalId,
        goal,
        txHash: receipt.hash
      };
    });
  }

  async deposit(walletAddress: string, goalId: number, amountEth: string) {
    return this.withWalletTransactionQueue(walletAddress, async () => {
      const { wallet, savingsVault } = this.getWritableContracts(walletAddress);

      const tx = await savingsVault.deposit(goalId, {
        value: ethers.parseEther(amountEth),
        nonce: await this.getFreshNonce(wallet)
      });

      const receipt = await tx.wait();
      await this.assertMined(receipt, "Deposit transaction was not mined.");

      const rewardAmountSave = this.extractDepositReward(receipt, savingsVault);
      const goal = await this.getGoal(goalId);
      const saveBalance = await this.getSaveBalance(walletAddress);
      const benefits = await this.getUserBenefits(walletAddress);

      return {
        goal,
        saveBalance,
        benefits,
        rewardAmountSave,
        txHash: receipt.hash
      };
    });
  }

  async completeGoal(walletAddress: string, goalId: number) {
    return this.withWalletTransactionQueue(walletAddress, async () => {
      const { wallet, savingsVault } = this.getWritableContracts(walletAddress);

      const tx = await savingsVault.completeGoal(goalId, {
        nonce: await this.getFreshNonce(wallet)
      });
      const receipt = await tx.wait();

      await this.assertMined(receipt, "Complete goal transaction was not mined.");

      const goal = await this.getGoal(goalId);
      const saveBalance = await this.getSaveBalance(walletAddress);

      return {
        goal,
        saveBalance,
        txHash: receipt.hash
      };
    });
  }

  async earlyWithdraw(walletAddress: string, goalId: number) {
    return this.withWalletTransactionQueue(walletAddress, async () => {
      const { wallet, savingsVault } = this.getWritableContracts(walletAddress);

      const benefitsBefore = await this.getUserBenefits(walletAddress);

      if (benefitsBefore.noPenaltyPasses === 0) {
        const balance = await this.getSaveBalance(walletAddress);
        const balanceValue = Number(balance.balance);

        if (balanceValue < 10) {
          throw new HttpError(
            400,
            "Недостаточно SAVE для досрочного вывода. Нужно 10 SAVE или активный No-Penalty Pass."
          );
        }
      }

      const withdrawTx = await savingsVault.earlyWithdraw(goalId, {
        nonce: await this.getFreshNonce(wallet)
      });
      const withdrawReceipt = await withdrawTx.wait();

      await this.assertMined(
        withdrawReceipt,
        "Early withdraw transaction was not mined."
      );

      const burnedAmountSave = this.extractEarlyWithdrawBurnedAmount(
        withdrawReceipt,
        savingsVault
      );
      const goal = await this.getGoal(goalId);
      const saveBalance = await this.getSaveBalance(walletAddress);
      const benefits = await this.getUserBenefits(walletAddress);

      return {
        goal,
        saveBalance,
        benefits,
        burnedAmountSave,
        approveTxHash: null,
        txHash: withdrawReceipt.hash
      };
    });
  }

  async payForAiForecast(walletAddress: string, goalId: number) {
    return this.withWalletTransactionQueue(walletAddress, async () => {
      const { wallet, savingsVault } = this.getWritableContracts(walletAddress);

      const balance = await this.getSaveBalance(walletAddress);
      if (Number(balance.balance) < 3) {
        throw new HttpError(400, "Недостаточно SAVE для оплаты AI-прогноза.");
      }

      const paymentTx = await savingsVault.payForAiForecast(goalId, {
        nonce: await this.getFreshNonce(wallet)
      });
      const paymentReceipt = await paymentTx.wait();

      await this.assertMined(
        paymentReceipt,
        "AI forecast payment transaction was not mined."
      );

      const saveBalance = await this.getSaveBalance(walletAddress);

      return {
        saveBalance,
        approveTxHash: null,
        txHash: paymentReceipt.hash
      };
    });
  }

  async buyNoPenaltyPass(walletAddress: string) {
    return this.withWalletTransactionQueue(walletAddress, async () => {
      const { wallet, savingsVault } = this.getWritableContracts(walletAddress);

      const balance = await this.getSaveBalance(walletAddress);
      if (Number(balance.balance) < 15) {
        throw new HttpError(400, "Недостаточно SAVE для покупки No-Penalty Pass.");
      }

      const purchaseTx = await savingsVault.buyNoPenaltyPass({
        nonce: await this.getFreshNonce(wallet)
      });
      const purchaseReceipt = await purchaseTx.wait();

      await this.assertMined(
        purchaseReceipt,
        "No-Penalty Pass purchase transaction was not mined."
      );

      const saveBalance = await this.getSaveBalance(walletAddress);
      const benefits = await this.getUserBenefits(walletAddress);

      return {
        saveBalance,
        benefits,
        approveTxHash: null,
        txHash: purchaseReceipt.hash
      };
    });
  }

  async buyRewardBoost(walletAddress: string) {
    return this.withWalletTransactionQueue(walletAddress, async () => {
      const { wallet, savingsVault } = this.getWritableContracts(walletAddress);

      const balance = await this.getSaveBalance(walletAddress);
      if (Number(balance.balance) < 20) {
        throw new HttpError(400, "Недостаточно SAVE для покупки Reward Boost.");
      }

      const purchaseTx = await savingsVault.buyRewardBoost({
        nonce: await this.getFreshNonce(wallet)
      });
      const purchaseReceipt = await purchaseTx.wait();

      await this.assertMined(
        purchaseReceipt,
        "Reward Boost purchase transaction was not mined."
      );

      const saveBalance = await this.getSaveBalance(walletAddress);
      const benefits = await this.getUserBenefits(walletAddress);

      return {
        saveBalance,
        benefits,
        approveTxHash: null,
        txHash: purchaseReceipt.hash
      };
    });
  }

  async burnSave(walletAddress: string, amountSave: string) {
    return this.withWalletTransactionQueue(walletAddress, async () => {
      const { wallet, saveToken } = this.getWritableContracts(walletAddress);

      const tx = await saveToken.burn(ethers.parseEther(amountSave), {
        nonce: await this.getFreshNonce(wallet)
      });

      const receipt = await tx.wait();

      await this.assertMined(receipt, "SAVE burn transaction was not mined.");

      const saveBalance = await this.getSaveBalance(walletAddress);

      return {
        saveBalance,
        txHash: receipt.hash
      };
    });
  }
}

export const blockchainService = new BlockchainService();
