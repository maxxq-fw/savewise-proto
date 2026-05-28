import fs from "fs";
import path from "path";
import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with account:", deployer.address);

  const SaveToken = await ethers.getContractFactory("SaveToken");
  const saveToken = await SaveToken.deploy(deployer.address);
  await saveToken.waitForDeployment();

  const saveTokenAddress = await saveToken.getAddress();

  console.log("SaveToken deployed to:", saveTokenAddress);

  const SavingsVault = await ethers.getContractFactory("SavingsVault");
  const savingsVault = await SavingsVault.deploy(saveTokenAddress);
  await savingsVault.waitForDeployment();

  const savingsVaultAddress = await savingsVault.getAddress();

  console.log("SavingsVault deployed to:", savingsVaultAddress);

  const minterRole = await saveToken.MINTER_ROLE();
  const grantTx = await saveToken.grantRole(minterRole, savingsVaultAddress);
  await grantTx.wait();

  console.log("MINTER_ROLE granted to SavingsVault");

  const network = await ethers.provider.getNetwork();

  const sharedContractsDir = path.join(
    __dirname,
    "..",
    "..",
    "shared",
    "contracts"
  );

  fs.mkdirSync(sharedContractsDir, { recursive: true });

  const deploymentInfo = {
    network: network.name,
    chainId: Number(network.chainId),
    saveToken: saveTokenAddress,
    savingsVault: savingsVaultAddress,
    deployer: deployer.address,
    deployedAt: new Date().toISOString()
  };

  fs.writeFileSync(
    path.join(sharedContractsDir, "localhost.json"),
    JSON.stringify(deploymentInfo, null, 2)
  );

  const saveTokenArtifact = await ethers.getContractFactory("SaveToken");
  const savingsVaultArtifact = await ethers.getContractFactory("SavingsVault");

  fs.writeFileSync(
    path.join(sharedContractsDir, "SaveTokenABI.json"),
    JSON.stringify(saveTokenArtifact.interface.formatJson(), null, 2)
  );

  fs.writeFileSync(
    path.join(sharedContractsDir, "SavingsVaultABI.json"),
    JSON.stringify(savingsVaultArtifact.interface.formatJson(), null, 2)
  );

  console.log("Deployment data saved to shared/contracts");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});