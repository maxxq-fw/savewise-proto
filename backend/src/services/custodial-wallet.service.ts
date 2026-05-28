import { ethers } from "ethers";
import { prisma } from "../lib/prisma.js";
import { HttpError } from "../utils/http-error.js";

interface LocalAccount {
  address: string;
  privateKey: string;
}

const HARDHAT_LOCAL_ACCOUNTS: LocalAccount[] = [
  {
    address: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    privateKey: "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d"
  },
  {
    address: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
    privateKey: "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a"
  },
  {
    address: "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
    privateKey: "0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6"
  },
  {
    address: "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65",
    privateKey: "0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a"
  },
  {
    address: "0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc",
    privateKey: "0x8b3a350cf5c34c9194ca85829a2df0ec3153be0318b5e2d3348e872092edffba"
  },
  {
    address: "0x976EA74026E726554dB657fA54763abd0C3a0aa9",
    privateKey: "0x92db14e403b83dfe3df233f83dfa3a0d7096f21ca9b0d6d6b8d88b2b4ec1564e"
  },
  {
    address: "0x14dC79964da2C08b23698B3D3cc7Ca32193d9955",
    privateKey: "0x4bbbf85ce3377467afe5d46f804f221813b2bb87f24d81f60f1fcdbf7cbf4356"
  },
  {
    address: "0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f",
    privateKey: "0xdbda1821b80551c9d65939329250298aa3472ba22feea921c0cf5d620ea67b97"
  },
  {
    address: "0xa0Ee7A142d267C1f36714E4a8F75612F20a79720",
    privateKey: "0x2a871d0798f97d79848a013d493a73bf4cc922c825d33c1cf7073dff6d409c6"
  }
];

class CustodialWalletService {
  private normalize(address: string) {
    return address.toLowerCase();
  }

  getAccountByAddress(address: string) {
    const account = HARDHAT_LOCAL_ACCOUNTS.find(
      (item) => this.normalize(item.address) === this.normalize(address)
    );

    if (!account) {
      throw new HttpError(500, `No local private key configured for wallet ${address}.`);
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

    const account = HARDHAT_LOCAL_ACCOUNTS.find(
      (item) => !usedAddresses.has(this.normalize(item.address))
    );

    if (!account) {
      throw new HttpError(
        500,
        "No free local Hardhat accounts left. Use a fresh database or add more development accounts."
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
        // The user has an old/common wallet address. Reassign a personal local wallet.
      }
    }

    return this.assignWalletToUser(user.id);
  }

  listPublicAccounts() {
    return HARDHAT_LOCAL_ACCOUNTS.map((account) => account.address);
  }
}

export const custodialWalletService = new CustodialWalletService();
