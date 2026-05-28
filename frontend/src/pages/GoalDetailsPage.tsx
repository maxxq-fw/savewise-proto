import { useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { SavingsProgressChart } from "../components/charts/SavingsProgressChart";
import { ProgressBar } from "../components/ui/ProgressBar";
import { StatusBadge } from "../components/ui/StatusBadge";
import {
  completeChainGoalRequest,
  depositChainGoalRequest,
  earlyWithdrawChainGoalRequest,
  getMarketplaceBenefitsRequest
} from "../services/chain-api";
import { useGoals } from "../store/goals-context";

const intervalLabels = {
  DAILY: "ежедневно",
  WEEKLY: "еженедельно",
  MONTHLY: "ежемесячно"
};

export function GoalDetailsPage() {
  const { id } = useParams();
  const {
    getGoalById,
    depositToGoal,
    completeGoal,
    earlyWithdraw,
    getLatestForecast
  } = useGoals();

  const goalId = Number(id);
  const goal = getGoalById(goalId);
  const latestForecast = getLatestForecast(goalId);

  const [depositAmount, setDepositAmount] = useState("");
  const [txError, setTxError] = useState("");
  const [txHash, setTxHash] = useState("");
  const [isTxLoading, setIsTxLoading] = useState(false);

  if (!goal) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        Цель не найдена.
      </div>
    );
  }

  const currentGoal = goal;

  const progress = Math.round((currentGoal.currentAmount / currentGoal.targetAmount) * 100);
  const canComplete =
    currentGoal.currentAmount >= currentGoal.targetAmount && currentGoal.status === "ACTIVE";

  async function handleDeposit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTxError("");
    setTxHash("");
    setIsTxLoading(true);

    try {
      if (!depositAmount || Number(depositAmount) <= 0) {
        throw new Error("Укажи сумму пополнения больше 0 ETH.");
      }

      const response = await depositChainGoalRequest(currentGoal.id, depositAmount);
      depositToGoal(
        currentGoal.id,
        Number(response.goal.currentAmountEth) - currentGoal.currentAmount,
        Number(response.rewardAmountSave)
      );
      setTxHash(response.txHash);
      setDepositAmount("");
    } catch (caughtError) {
      setTxError(
        caughtError instanceof Error
          ? caughtError.message
          : "Не удалось выполнить депозит."
      );
    } finally {
      setIsTxLoading(false);
    }
  }

  async function handleCompleteGoal() {
    setTxError("");
    setTxHash("");
    setIsTxLoading(true);

    try {
      const response = await completeChainGoalRequest(currentGoal.id);
      completeGoal(currentGoal.id);
      setTxHash(response.txHash);
    } catch (caughtError) {
      setTxError(
        caughtError instanceof Error
          ? caughtError.message
          : "Не удалось завершить цель."
      );
    } finally {
      setIsTxLoading(false);
    }
  }

  async function handleEarlyWithdraw() {
    setTxError("");
    setTxHash("");
    setIsTxLoading(true);

    try {
      const marketplaceState = await getMarketplaceBenefitsRequest();
      const hasNoPenaltyPass = marketplaceState.benefits.noPenaltyPasses > 0;
      const personalSaveBalance = Number(marketplaceState.saveBalance.balance);

      if (!hasNoPenaltyPass && personalSaveBalance < 10) {
        setTxError(
          "Недостаточно SAVE для досрочного вывода. Нужно 10 SAVE или активный No-Penalty Pass."
        );
        return;
      }

      const response = await earlyWithdrawChainGoalRequest(currentGoal.id);
      earlyWithdraw(currentGoal.id, Number(response.burnedAmountSave));
      setTxHash(response.txHash);
    } catch (caughtError) {
      setTxError(
        caughtError instanceof Error
          ? caughtError.message
          : "Не удалось выполнить досрочный вывод. Проверь баланс SAVE или наличие No-Penalty Pass."
      );
    } finally {
      setIsTxLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-6">
          <div>
            <h2 className="text-2xl font-semibold">{currentGoal.title}</h2>
            <p className="mt-1 text-slate-500">{currentGoal.description}</p>
          </div>

          <StatusBadge status={currentGoal.status} />
        </div>

        <div className="mt-6">
          <ProgressBar value={progress} />
          <div className="mt-3 flex justify-between text-sm text-slate-600">
            <span>{currentGoal.currentAmount} ETH накоплено</span>
            <span>{currentGoal.targetAmount} ETH цель</span>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-4">
          <div className="rounded-xl bg-slate-50 p-4">
            <div className="text-xs text-slate-500">ID в контракте</div>
            <div className="mt-1 font-medium">#{currentGoal.id}</div>
          </div>
          <div className="rounded-xl bg-slate-50 p-4">
            <div className="text-xs text-slate-500">Дедлайн</div>
            <div className="mt-1 font-medium">{currentGoal.deadline}</div>
          </div>
          <div className="rounded-xl bg-slate-50 p-4">
            <div className="text-xs text-slate-500">Интервал</div>
            <div className="mt-1 font-medium">
              {intervalLabels[currentGoal.depositInterval]}
            </div>
          </div>
          <div className="rounded-xl bg-slate-50 p-4">
            <div className="text-xs text-slate-500">SAVE-награды</div>
            <div className="mt-1 font-medium">{currentGoal.totalRewards} SAVE</div>
          </div>
        </div>
      </div>

      {txError && (
        <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
          {txError}
        </div>
      )}

      {txHash && (
        <div className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">
          Транзакция выполнена: {txHash}
        </div>
      )}

      {currentGoal.status === "ACTIVE" && (
        <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
          <form
            onSubmit={handleDeposit}
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <h3 className="text-lg font-semibold">Пополнить цель</h3>
            <p className="mt-1 text-sm text-slate-500">
              Депозит отправляется в контракт SavingsVault через backend.
            </p>

            <div className="mt-4">
              <label className="text-sm font-medium">Сумма пополнения, ETH</label>
              <input
                min="0.001"
                step="0.001"
                type="number"
                required
                value={depositAmount}
                onChange={(event) => setDepositAmount(event.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2 outline-none focus:border-slate-950"
              />
            </div>

            <button
              disabled={isTxLoading}
              type="submit"
              className="mt-4 w-full rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {isTxLoading ? "Транзакция..." : "Пополнить и получить SAVE"}
            </button>
          </form>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold">Действия с целью</h3>
            <p className="mt-1 text-sm text-slate-500">
              Завершение цели начисляет бонус. Досрочный вывод использует No-Penalty Pass, если он есть, иначе применяется штраф в SAVE.
            </p>

            <div className="mt-4 grid gap-3">
              <button
                disabled={!canComplete || isTxLoading}
                onClick={handleCompleteGoal}
                className="rounded-xl bg-slate-950 px-4 py-3 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {isTxLoading ? "Транзакция..." : "Завершить цель"}
              </button>

              <button
                disabled={isTxLoading}
                onClick={handleEarlyWithdraw}
                className="rounded-xl border border-red-200 bg-white px-4 py-3 text-sm font-medium text-red-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Досрочный вывод
              </button>

              <Link
                to={`/forecast/${currentGoal.id}`}
                className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-center text-sm font-medium"
              >
                Получить AI-прогноз
              </Link>
            </div>
          </div>
        </div>
      )}

      <SavingsProgressChart goal={currentGoal} />

      {latestForecast && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold">Последний AI-прогноз</h3>
          <div className="mt-4 rounded-xl bg-slate-50 p-4">
            <div className="text-3xl font-semibold">
              {latestForecast.successProbability}%
            </div>
            <p className="mt-2 text-sm text-slate-600">
              {latestForecast.summary}
            </p>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold">История пополнений</h3>

        <div className="mt-4 space-y-3">
          {currentGoal.deposits.length === 0 && (
            <div className="text-sm text-slate-500">Пополнений пока нет.</div>
          )}

          {currentGoal.deposits.map((deposit) => (
            <div
              key={deposit.id}
              className="flex items-center justify-between rounded-xl bg-slate-50 p-4 text-sm"
            >
              <div>
                <div className="font-medium">{deposit.amount} ETH</div>
                <div className="text-slate-500">{deposit.createdAt}</div>
              </div>
              <div className="font-medium text-slate-700">
                +{deposit.rewardAmount} SAVE
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
