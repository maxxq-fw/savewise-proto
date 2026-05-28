import { expect } from "chai";
import { ethers } from "hardhat";

describe("SaveToken", function () {
  async function deployFixture() {
    const [owner, user] = await ethers.getSigners();

    const SaveToken = await ethers.getContractFactory("SaveToken");
    const saveToken = await SaveToken.deploy(owner.address);
    await saveToken.waitForDeployment();

    return { saveToken, owner, user };
  }

  it("should deploy with correct name and symbol", async function () {
    const { saveToken } = await deployFixture();

    expect(await saveToken.name()).to.equal("SaveWise Token");
    expect(await saveToken.symbol()).to.equal("SAVE");
  });

  it("should mint initial supply to admin", async function () {
    const { saveToken, owner } = await deployFixture();

    const balance = await saveToken.balanceOf(owner.address);
    expect(balance).to.equal(ethers.parseEther("1000000"));
  });

  it("should allow minter to mint tokens", async function () {
    const { saveToken, user } = await deployFixture();

    await saveToken.mint(user.address, ethers.parseEther("10"));

    expect(await saveToken.balanceOf(user.address)).to.equal(
      ethers.parseEther("10")
    );
  });
});