// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./SaveToken.sol";

contract SavingsVault is ReentrancyGuard, Ownable {
    struct Goal {
        uint256 id;
        address owner;
        string title;
        uint256 targetAmount;
        uint256 currentAmount;
        uint256 startDate;
        uint256 deadline;
        uint256 depositInterval;
        uint256 lastDepositAt;
        uint256 rewardedMilestones;
        bool completed;
        bool closed;
    }

    struct UserBenefits {
        uint256 noPenaltyPasses;
        uint256 rewardBoosts; // remaining boosted reward milestones
    }

    struct RewardPlan {
        uint256 periodCount;
        uint256 plannedDepositAmount;
        uint256 rewardedMilestones;
        uint256 totalMilestones;
    }

    SaveToken public immutable saveToken;

    uint256 public nextGoalId = 1;

    uint256 public minimumDepositAmount = 1 ether;

    uint256 public regularDepositReward = 5 * 10 ** 18;
    uint256 public boostedDepositReward = 10 * 10 ** 18;
    uint256 public goalCompletionReward = 25 * 10 ** 18;

    uint256 public earlyWithdrawPenalty = 10 * 10 ** 18;
    uint256 public premiumForecastFee = 3 * 10 ** 18;
    uint256 public noPenaltyPassPrice = 15 * 10 ** 18;
    uint256 public rewardBoostPrice = 20 * 10 ** 18;
    uint256 public rewardBoostDepositsPerPurchase = 5;

    mapping(uint256 => Goal) private goals;
    mapping(address => uint256[]) private userGoalIds;
    mapping(address => uint256) public noPenaltyPasses;
    mapping(address => uint256) public rewardBoosts; // remaining boosted reward milestones

    event GoalCreated(
        uint256 indexed goalId,
        address indexed owner,
        string title,
        uint256 targetAmount,
        uint256 deadline,
        uint256 depositInterval,
        uint256 plannedDepositAmount,
        uint256 periodCount
    );

    event DepositMade(
        uint256 indexed goalId,
        address indexed user,
        uint256 amount,
        uint256 currentAmount,
        uint256 rewardAmount,
        uint256 newRewardMilestones,
        uint256 rewardedMilestones
    );

    event GoalCompleted(
        uint256 indexed goalId,
        address indexed user,
        uint256 withdrawnAmount,
        uint256 rewardAmount
    );

    event EarlyWithdraw(
        uint256 indexed goalId,
        address indexed user,
        uint256 withdrawnAmount,
        uint256 burnedAmount
    );

    event AiForecastPaid(
        uint256 indexed goalId,
        address indexed user,
        uint256 burnedAmount
    );

    event NoPenaltyPassPurchased(
        address indexed user,
        uint256 price,
        uint256 remainingPasses
    );

    event RewardBoostPurchased(
        address indexed user,
        uint256 price,
        uint256 remainingBoosts
    );

    event NoPenaltyPassUsed(
        address indexed user,
        uint256 indexed goalId,
        uint256 remainingPasses
    );

    event RewardBoostUsed(
        address indexed user,
        uint256 indexed goalId,
        uint256 boostedMilestones,
        uint256 rewardAmount,
        uint256 remainingBoosts
    );

    constructor(address saveTokenAddress) Ownable(msg.sender) {
        require(
            saveTokenAddress != address(0),
            "SavingsVault: zero token address"
        );

        saveToken = SaveToken(saveTokenAddress);
    }

    function createGoal(
        string calldata title,
        uint256 targetAmount,
        uint256 deadline,
        uint256 depositInterval
    ) external returns (uint256) {
        require(bytes(title).length > 0, "SavingsVault: empty title");
        require(
            targetAmount >= minimumDepositAmount,
            "SavingsVault: target below minimum deposit"
        );
        require(deadline > block.timestamp, "SavingsVault: invalid deadline");
        require(
            depositInterval > 0,
            "SavingsVault: interval must be positive"
        );

        uint256 goalId = nextGoalId++;

        goals[goalId] = Goal({
            id: goalId,
            owner: msg.sender,
            title: title,
            targetAmount: targetAmount,
            currentAmount: 0,
            startDate: block.timestamp,
            deadline: deadline,
            depositInterval: depositInterval,
            lastDepositAt: 0,
            rewardedMilestones: 0,
            completed: false,
            closed: false
        });

        userGoalIds[msg.sender].push(goalId);

        RewardPlan memory plan = _getRewardPlan(goals[goalId]);

        emit GoalCreated(
            goalId,
            msg.sender,
            title,
            targetAmount,
            deadline,
            depositInterval,
            plan.plannedDepositAmount,
            plan.periodCount
        );

        return goalId;
    }

    function deposit(uint256 goalId) external payable nonReentrant {
        Goal storage goal = goals[goalId];

        require(goal.owner == msg.sender, "SavingsVault: not goal owner");
        require(!goal.completed, "SavingsVault: goal already completed");
        require(!goal.closed, "SavingsVault: goal is closed");
        require(block.timestamp <= goal.deadline, "SavingsVault: deadline passed");
        require(
            msg.value >= minimumDepositAmount,
            "SavingsVault: minimum deposit is 1 ETH"
        );

        goal.currentAmount += msg.value;
        goal.lastDepositAt = block.timestamp;

        RewardPlan memory plan = _getRewardPlan(goal);
        uint256 achievedMilestones = goal.currentAmount / plan.plannedDepositAmount;

        if (achievedMilestones > plan.totalMilestones) {
            achievedMilestones = plan.totalMilestones;
        }

        uint256 newRewardMilestones = 0;
        uint256 rewardAmount = 0;

        if (achievedMilestones > goal.rewardedMilestones) {
            newRewardMilestones = achievedMilestones - goal.rewardedMilestones;
            goal.rewardedMilestones = achievedMilestones;

            uint256 boostedMilestones = _min(rewardBoosts[msg.sender], newRewardMilestones);
            uint256 regularMilestones = newRewardMilestones - boostedMilestones;

            if (boostedMilestones > 0) {
                rewardBoosts[msg.sender] -= boostedMilestones;
                uint256 boostedRewardAmount = boostedMilestones * boostedDepositReward;
                rewardAmount += boostedRewardAmount;

                emit RewardBoostUsed(
                    msg.sender,
                    goalId,
                    boostedMilestones,
                    boostedRewardAmount,
                    rewardBoosts[msg.sender]
                );
            }

            rewardAmount += regularMilestones * regularDepositReward;

            if (rewardAmount > 0) {
                saveToken.mint(msg.sender, rewardAmount);
            }
        }

        emit DepositMade(
            goalId,
            msg.sender,
            msg.value,
            goal.currentAmount,
            rewardAmount,
            newRewardMilestones,
            goal.rewardedMilestones
        );
    }

    function completeGoal(uint256 goalId) external nonReentrant {
        Goal storage goal = goals[goalId];

        require(goal.owner == msg.sender, "SavingsVault: not goal owner");
        require(!goal.completed, "SavingsVault: already completed");
        require(!goal.closed, "SavingsVault: goal is closed");
        require(
            goal.currentAmount >= goal.targetAmount,
            "SavingsVault: target not reached"
        );

        uint256 amountToWithdraw = goal.currentAmount;

        goal.completed = true;
        goal.closed = true;
        goal.currentAmount = 0;

        saveToken.mint(msg.sender, goalCompletionReward);

        (bool success, ) = payable(msg.sender).call{value: amountToWithdraw}("");
        require(success, "SavingsVault: ETH transfer failed");

        emit GoalCompleted(
            goalId,
            msg.sender,
            amountToWithdraw,
            goalCompletionReward
        );
    }

    function earlyWithdraw(uint256 goalId) external nonReentrant {
        Goal storage goal = goals[goalId];

        require(goal.owner == msg.sender, "SavingsVault: not goal owner");
        require(!goal.completed, "SavingsVault: already completed");
        require(!goal.closed, "SavingsVault: already closed");

        uint256 amountToWithdraw = goal.currentAmount;
        uint256 burnedAmount = 0;

        goal.closed = true;
        goal.currentAmount = 0;

        if (noPenaltyPasses[msg.sender] > 0) {
            noPenaltyPasses[msg.sender] -= 1;

            emit NoPenaltyPassUsed(
                msg.sender,
                goalId,
                noPenaltyPasses[msg.sender]
            );
        } else {
            burnedAmount = earlyWithdrawPenalty;
            saveToken.burnByMinter(msg.sender, burnedAmount);
        }

        if (amountToWithdraw > 0) {
            (bool success, ) = payable(msg.sender).call{value: amountToWithdraw}("");
            require(success, "SavingsVault: ETH transfer failed");
        }

        emit EarlyWithdraw(
            goalId,
            msg.sender,
            amountToWithdraw,
            burnedAmount
        );
    }

    function payForAiForecast(uint256 goalId) external {
        Goal storage goal = goals[goalId];

        require(goal.owner == msg.sender, "SavingsVault: not goal owner");
        require(!goal.closed, "SavingsVault: goal is closed");

        saveToken.burnByMinter(msg.sender, premiumForecastFee);

        emit AiForecastPaid(goalId, msg.sender, premiumForecastFee);
    }

    function buyNoPenaltyPass() external {
        saveToken.burnByMinter(msg.sender, noPenaltyPassPrice);
        noPenaltyPasses[msg.sender] += 1;

        emit NoPenaltyPassPurchased(
            msg.sender,
            noPenaltyPassPrice,
            noPenaltyPasses[msg.sender]
        );
    }

    function buyRewardBoost() external {
        saveToken.burnByMinter(msg.sender, rewardBoostPrice);
        rewardBoosts[msg.sender] += rewardBoostDepositsPerPurchase;

        emit RewardBoostPurchased(
            msg.sender,
            rewardBoostPrice,
            rewardBoosts[msg.sender]
        );
    }

    function getUserBenefits(address user) external view returns (UserBenefits memory) {
        return UserBenefits({
            noPenaltyPasses: noPenaltyPasses[user],
            rewardBoosts: rewardBoosts[user]
        });
    }

    function getGoal(uint256 goalId) external view returns (Goal memory) {
        require(goals[goalId].owner != address(0), "SavingsVault: goal not found");
        return goals[goalId];
    }

    function getGoalRewardPlan(uint256 goalId) external view returns (RewardPlan memory) {
        require(goals[goalId].owner != address(0), "SavingsVault: goal not found");
        return _getRewardPlan(goals[goalId]);
    }

    function getUserGoals(address user) external view returns (uint256[] memory) {
        return userGoalIds[user];
    }

    function getUserGoalCount(address user) external view returns (uint256) {
        return userGoalIds[user].length;
    }

    function updateRewards(
        uint256 newRegularDepositReward,
        uint256 newBoostedDepositReward,
        uint256 newGoalCompletionReward
    ) external onlyOwner {
        regularDepositReward = newRegularDepositReward;
        boostedDepositReward = newBoostedDepositReward;
        goalCompletionReward = newGoalCompletionReward;
    }

    function updateFees(
        uint256 newEarlyWithdrawPenalty,
        uint256 newPremiumForecastFee
    ) external onlyOwner {
        earlyWithdrawPenalty = newEarlyWithdrawPenalty;
        premiumForecastFee = newPremiumForecastFee;
    }

    function updateMarketplacePrices(
        uint256 newNoPenaltyPassPrice,
        uint256 newRewardBoostPrice
    ) external onlyOwner {
        noPenaltyPassPrice = newNoPenaltyPassPrice;
        rewardBoostPrice = newRewardBoostPrice;
    }

    function updateRewardBoostDepositsPerPurchase(
        uint256 newRewardBoostDepositsPerPurchase
    ) external onlyOwner {
        require(
            newRewardBoostDepositsPerPurchase > 0,
            "SavingsVault: boost duration must be positive"
        );

        rewardBoostDepositsPerPurchase = newRewardBoostDepositsPerPurchase;
    }

    function updateMinimumDepositAmount(uint256 newMinimumDepositAmount) external onlyOwner {
        require(
            newMinimumDepositAmount > 0,
            "SavingsVault: minimum deposit must be positive"
        );

        minimumDepositAmount = newMinimumDepositAmount;
    }

    function _getRewardPlan(Goal storage goal) private view returns (RewardPlan memory) {
        uint256 savingDuration = goal.deadline - goal.startDate;
        uint256 periodCount = _ceilDiv(savingDuration, goal.depositInterval);

        if (periodCount == 0) {
            periodCount = 1;
        }

        uint256 plannedDepositAmount = _ceilDiv(goal.targetAmount, periodCount);

        if (plannedDepositAmount < minimumDepositAmount) {
            plannedDepositAmount = minimumDepositAmount;
        }

        uint256 totalMilestones = _ceilDiv(goal.targetAmount, plannedDepositAmount);

        if (totalMilestones == 0) {
            totalMilestones = 1;
        }

        return RewardPlan({
            periodCount: periodCount,
            plannedDepositAmount: plannedDepositAmount,
            rewardedMilestones: goal.rewardedMilestones,
            totalMilestones: totalMilestones
        });
    }

    function _ceilDiv(uint256 a, uint256 b) private pure returns (uint256) {
        if (a == 0) {
            return 0;
        }

        return ((a - 1) / b) + 1;
    }

    function _min(uint256 a, uint256 b) private pure returns (uint256) {
        return a < b ? a : b;
    }
}
