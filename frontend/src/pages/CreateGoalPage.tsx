import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { createChainGoalRequest } from "../services/chain-api";
import { useGoals } from "../store/goals-context";
import type { DepositInterval } from "../types/goal";

const intervalsInSeconds: Record<DepositInterval, number> = {
  DAILY: 24 * 60 * 60,
  WEEKLY: 7 * 24 * 60 * 60,
  MONTHLY: 30 * 24 * 60 * 60
};

export function CreateGoalPage() {
  const navigate = useNavigate();
  const { createGoal } = useGoals();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Финансы");
  const [targetAmount, setTargetAmount] = useState("");
  const [deadline, setDeadline] = useState("2026-12-31");
  const [depositInterval, setDepositInterval] =
    useState<DepositInterval>("WEEKLY");
  const [error, setError] = useState("");
  const [txHash, setTxHash] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setTxHash("");
    setIsSubmitting(true);

    try {
      if (!targetAmount || Number(targetAmount) <= 0) {
        throw new Error("Укажи целевую сумму больше 0 ETH.");
      }

      const deadlineTimestamp = Math.floor(new Date(deadline).getTime() / 1000);

      const response = await createChainGoalRequest({
        title,
        description,
        category,
        targetAmountEth: targetAmount,
        deadline: deadlineTimestamp,
        depositInterval: intervalsInSeconds[depositInterval]
      });

      const localGoal = createGoal({
        id: response.goal.id,
        title,
        description,
        category,
        targetAmount: Number(response.goal.targetAmountEth),
        deadline,
        depositInterval
      });

      setTxHash(response.txHash);
      navigate(`/goals/${localGoal.id}`);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Не удалось создать цель."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-2xl font-semibold">Создание цели накопления</h2>

      {error && (
        <div className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {txHash && (
        <div className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">
          Транзакция выполнена: {txHash}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label className="text-sm font-medium">Название цели</label>
          <input
            required
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2 outline-none focus:border-slate-950"
            placeholder="Например: новый ноутбук"
          />
        </div>

        <div>
          <label className="text-sm font-medium">Описание</label>
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            className="mt-1 min-h-24 w-full rounded-xl border border-slate-200 px-4 py-2 outline-none focus:border-slate-950"
            placeholder="Кратко опиши, зачем нужна эта цель"
          />
        </div>

        <div>
          <label className="text-sm font-medium">Категория</label>
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2 outline-none focus:border-slate-950"
          >
            <option>Финансы</option>
            <option>Техника</option>
            <option>Образование</option>
            <option>Путешествия</option>
            <option>Здоровье</option>
          </select>
        </div>

        <div>
          <label className="text-sm font-medium">Целевая сумма, ETH</label>
          <input
            required
            min="0.001"
            step="0.001"
            type="number"
            value={targetAmount}
            onChange={(event) => setTargetAmount(event.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2 outline-none focus:border-slate-950"
          />
        </div>

        <div>
          <label className="text-sm font-medium">Срок достижения</label>
          <input
            required
            type="date"
            value={deadline}
            onChange={(event) => setDeadline(event.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2 outline-none focus:border-slate-950"
          />
        </div>

        <div>
          <label className="text-sm font-medium">Интервал пополнения</label>
          <select
            value={depositInterval}
            onChange={(event) =>
              setDepositInterval(event.target.value as DepositInterval)
            }
            className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2 outline-none focus:border-slate-950"
          >
            <option value="DAILY">Ежедневно</option>
            <option value="WEEKLY">Еженедельно</option>
            <option value="MONTHLY">Ежемесячно</option>
          </select>
        </div>

        <button
          disabled={isSubmitting}
          type="submit"
          className="w-full rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {isSubmitting ? "Создание цели..." : "Создать цель"}
        </button>
      </form>
    </div>
  );
}
