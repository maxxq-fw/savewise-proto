import { ethers } from "ethers";
import { env } from "../config/env.js";
import { prisma } from "../lib/prisma.js";
import { HttpError } from "../utils/http-error.js";

interface LocalAccount {
  address: string;
  privateKey: string;
}

class CustodialWalletService {
  private readonly accounts: LocalAccount[];

  constructor() {
    this.accounts = this.loadAccountsFromEnv();
  }

  private normalize(address: string) {
    return address.toLowerCase();
  }

  private loadAccountsFromEnv() {
    const privateKeys = env.custodialPrivateKeys
      .split(",")
      .map((privateKey) => privateKey.trim())
      .filter(Boolean);

    if (privateKeys.length === 0) {
      throw new Error(
        "CUSTODIAL_PRIVATE_KEYS is empty. Add comma-separated private keys to backend .env."
      );
    }

    const accounts = privateKeys.map((privateKey) => {
      try {
        const wallet = new ethers.Wallet(privateKey);

        return {
          address: ethers.getAddress(wallet.address),
          privateKey: wallet.privateKey
        };
      } catch {
        throw new Error(
          "Invalid private key in CUSTODIAL_PRIVATE_KEYS. Check backend .env."
        );
      }
    });

    const uniqueAddresses = new Set(
      accounts.map((account) => this.normalize(account.address))
    );

    if (uniqueAddresses.size !== accounts.length) {
      throw new Error(
        "Duplicate private keys found in CUSTODIAL_PRIVATE_KEYS."
      );
    }

    return accounts;
  }

  getAccountByAddress(address: string) {
    const account = this.accounts.find(
      (item) => this.normalize(item.address) === this.normalize(address)
    );

    if (!account) {
      throw new HttpError(
        500,
        `No private key configured for wallet ${address}. Check CUSTODIAL_PRIVATE_KEYS in .env.`
      );
    }

    return account;
  }

  async assignWalletToUser(userId: string) {
    const usedUsers = await prisma.user.findMany({
      where: {
        walletAddress: {
          not: null
        }
      },
      select: {
        walletAddress: true
      }
    });

    const usedAddresses = new Set(
      usedUsers
        .map((user: { walletAddress: string | null }) => user.walletAddress)
        .filter((address: string | null): address is string => Boolean(address))
        .map((address: string) => this.normalize(address))
    );

    const account = this.accounts.find(
      (item) => !usedAddresses.has(this.normalize(item.address))
    );

    if (!account) {
      throw new HttpError(
        500,
        "No free custodial accounts left. Add more private keys to CUSTODIAL_PRIVATE_KEYS or reset the database."
      );
    }

    return prisma.user.update({
      where: {
        id: userId
      },
      data: {
        walletAddress: ethers.getAddress(account.address)
      },
      select: {
        id: true,
        name: true,
        email: true,
        walletAddress: true,
        createdAt: true
      }
    });
  }

  async ensureUserWallet(userId: string) {
    const user = await prisma.user.findUnique({
      where: {
        id: userId
      },
      select: {
        id: true,
        name: true,
        email: true,
        walletAddress: true,
        createdAt: true
      }
    });

    if (!user) {
      throw new HttpError(401, "User not found.");
    }

    if (user.walletAddress) {
      try {
        this.getAccountByAddress(user.walletAddress);
        return user;
      } catch {
        // У пользователя может быть старый адрес из предыдущей конфигурации.
        // В таком случае назначаем новый доступный custodial-кошелек.
      }
    }

    return this.assignWalletToUser(user.id);
  }

  listPublicAccounts() {
    return this.accounts.map((account) => account.address);
  }
}

export const custodialWalletService = new CustodialWalletService();