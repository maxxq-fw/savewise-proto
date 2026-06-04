import { expect } from "chai";
import { ethers } from "hardhat";

const ONE_WEEK = 7 * 24 * 60 * 60;

function deadlineIn(seconds: number) {
  return Math.floor(Date.now() / 1000) + seconds;
}

describe("SavingsVault", function () {
  async function deployFixture() {
    const [owner, user] = await ethers.getSigners();

    const SaveToken = await ethers.getContractFactory("SaveToken");
    const saveToken = await SaveToken.deploy(owner.address);
    await saveToken.waitForDeployment();

    const SavingsVault = await ethers.getContractFactory("SavingsVault");
    const savingsVault = await SavingsVault.deploy(await saveToken.getAddress());
    await savingsVault.waitForDeployment();

    const minterRole = await saveToken.MINTER_ROLE();

    await saveToken.grantRole(minterRole, await savingsVault.getAddress());

    return { saveToken, savingsVault, owner, user };
  }

  it("should create a savings goal", async function () {
    const { savingsVault, user } = await deployFixture();

    const deadline = deadlineIn(30 * 24 * 60 * 60);

    await savingsVault
      .connect(user)
      .createGoal("Laptop", ethers.parseEther("1"), deadline, ONE_WEEK);

    const goal = await savingsVault.getGoal(1);

    expect(goal.owner).to.equal(user.address);
    expect(goal.title).to.equal("Laptop");
    expect(goal.targetAmount).to.equal(ethers.parseEther("1"));
  });

  it("should reject deposits below 1 ETH", async function () {
    const { savingsVault, user } = await deployFixture();

    const deadline = deadlineIn(10 * ONE_WEEK);

    await savingsVault
      .connect(user)
      .createGoal("Laptop", ethers.parseEther("10"), deadline, ONE_WEEK);

    await expect(
      savingsVault.connect(user).deposit(1, { value: ethers.parseEther("0.5") })
    ).to.be.revertedWith("SavingsVault: minimum deposit is 1 ETH");
  });

  it("should mint SAVE only after planned milestone is reached", async function () {
    const { saveToken, savingsVault, user } = await deployFixture();

    const deadline = deadlineIn(10 * ONE_WEEK);

    await savingsVault
      .connect(user)
      .createGoal("Large Goal", ethers.parseEther("100"), deadline, ONE_WEEK);

    const plan = await savingsVault.getGoalRewardPlan(1);
    expect(plan.plannedDepositAmount).to.equal(ethers.parseEther("10"));

    for (let i = 0; i < 9; i += 1) {
      await savingsVault
        .connect(user)
        .deposit(1, { value: ethers.parseEther("1") });
    }

    expect(await saveToken.balanceOf(user.address)).to.equal(0n);

    await savingsVault
      .connect(user)
      .deposit(1, { value: ethers.parseEther("1") });

    const goal = await savingsVault.getGoal(1);
    const saveBalance = await saveToken.balanceOf(user.address);

    expect(goal.currentAmount).to.equal(ethers.parseEther("10"));
    expect(goal.rewardedMilestones).to.equal(1n);
    expect(saveBalance).to.equal(ethers.parseEther("5"));
  });

  it("should mint several milestone rewards for a large deposit", async function () {
    const { saveToken, savingsVault, user } = await deployFixture();

    const deadline = deadlineIn(10 * ONE_WEEK);

    await savingsVault
      .connect(user)
      .createGoal("Large Goal", ethers.parseEther("100"), deadline, ONE_WEEK);

    await savingsVault
      .connect(user)
      .deposit(1, { value: ethers.parseEther("20") });

    const goal = await savingsVault.getGoal(1);
    const saveBalance = await saveToken.balanceOf(user.address);

    expect(goal.rewardedMilestones).to.equal(2n);
    expect(saveBalance).to.equal(ethers.parseEther("10"));
  });

  it("should complete goal when target is reached", async function () {
    const { saveToken, savingsVault, user } = await deployFixture();

    const deadline = deadlineIn(30 * 24 * 60 * 60);

    await savingsVault
      .connect(user)
      .createGoal("Laptop", ethers.parseEther("1"), deadline, ONE_WEEK);

    await savingsVault
      .connect(user)
      .deposit(1, { value: ethers.parseEther("1") });

    await savingsVault.connect(user).completeGoal(1);

    const goal = await savingsVault.getGoal(1);
    const saveBalance = await saveToken.balanceOf(user.address);

    expect(goal.completed).to.equal(true);
    expect(goal.closed).to.equal(true);
    expect(saveBalance).to.equal(ethers.parseEther("30"));
  });

  it("should burn SAVE on early withdraw without pass", async function () {
    const { saveToken, savingsVault, user } = await deployFixture();

    const deadline = deadlineIn(2 * ONE_WEEK);

    await savingsVault
      .connect(user)
      .createGoal("Emergency Fund", ethers.parseEther("2"), deadline, ONE_WEEK);

    await savingsVault
      .connect(user)
      .deposit(1, { value: ethers.parseEther("1") });

    await savingsVault
      .connect(user)
      .deposit(1, { value: ethers.parseEther("1") });

    expect(await saveToken.balanceOf(user.address)).to.equal(
      ethers.parseEther("10")
    );

    await savingsVault.connect(user).earlyWithdraw(1);

    const goal = await savingsVault.getGoal(1);
    const saveBalance = await saveToken.balanceOf(user.address);

    expect(goal.closed).to.equal(true);
    expect(saveBalance).to.equal(ethers.parseEther("0"));
  });

  it("should burn SAVE for AI forecast payment", async function () {
    const { saveToken, savingsVault, user } = await deployFixture();

    const deadline = deadlineIn(30 * 24 * 60 * 60);

    await savingsVault
      .connect(user)
      .createGoal("Course", ethers.parseEther("1"), deadline, ONE_WEEK);

    await savingsVault
      .connect(user)
      .deposit(1, { value: ethers.parseEther("1") });

    await savingsVault.connect(user).payForAiForecast(1);

    expect(await saveToken.balanceOf(user.address)).to.equal(
      ethers.parseEther("2")
    );
  });

  it("should buy reward boost and mint boosted reward on next five reward milestones", async function () {
    const { saveToken, savingsVault, user } = await deployFixture();

    await saveToken.mint(user.address, ethers.parseEther("20"));

    await savingsVault.connect(user).buyRewardBoost();

    let benefits = await savingsVault.getUserBenefits(user.address);
    expect(benefits.rewardBoosts).to.equal(5n);
    expect(await saveToken.balanceOf(user.address)).to.equal(0n);

    const deadline = deadlineIn(5 * ONE_WEEK);

    await savingsVault
      .connect(user)
      .createGoal("Boosted Goal", ethers.parseEther("5"), deadline, ONE_WEEK);

    for (let i = 0; i < 5; i += 1) {
      await savingsVault
        .connect(user)
        .deposit(1, { value: ethers.parseEther("1") });
    }

    benefits = await savingsVault.getUserBenefits(user.address);

    expect(benefits.rewardBoosts).to.equal(0n);
    expect(await saveToken.balanceOf(user.address)).to.equal(
      ethers.parseEther("50")
    );
  });

  it("should buy no-penalty pass and use it on early withdraw", async function () {
    const { saveToken, savingsVault, user } = await deployFixture();

    await saveToken.mint(user.address, ethers.parseEther("15"));

    await savingsVault.connect(user).buyNoPenaltyPass();

    let benefits = await savingsVault.getUserBenefits(user.address);
    expect(benefits.noPenaltyPasses).to.equal(1n);
    expect(await saveToken.balanceOf(user.address)).to.equal(0n);

    const deadline = deadlineIn(30 * 24 * 60 * 60);

    await savingsVault
      .connect(user)
      .createGoal("Pass Goal", ethers.parseEther("1"), deadline, ONE_WEEK);

    await savingsVault
      .connect(user)
      .deposit(1, { value: ethers.parseEther("1") });

    expect(await saveToken.balanceOf(user.address)).to.equal(
      ethers.parseEther("5")
    );

    await savingsVault.connect(user).earlyWithdraw(1);

    benefits = await savingsVault.getUserBenefits(user.address);
    const goal = await savingsVault.getGoal(1);

    expect(benefits.noPenaltyPasses).to.equal(0n);
    expect(goal.closed).to.equal(true);
    expect(await saveToken.balanceOf(user.address)).to.equal(
      ethers.parseEther("5")
    );
  });
});
