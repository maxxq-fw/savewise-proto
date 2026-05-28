import { Link } from "react-router-dom";
import { ProgressBar } from "../components/ui/ProgressBar";
import { StatusBadge } from "../components/ui/StatusBadge";
import { useGoals } from "../store/goals-context";

export function GoalsPage() {
  const { goals } = useGoals();

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Цели накопления</h2>
          <p className="mt-1 text-slate-500">
            Управление токенизированными микронакоплениями пользователя.
          </p>
        </div>

        <Link
          to="/goals/new"
          className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-medium text-white"
        >
          Создать цель
        </Link>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {goals.map((goal) => {
          const progress = Math.round(
            (goal.currentAmount / goal.targetAmount) * 100
          );

          return (
            <Link
              key={goal.id}
              to={`/goals/${goal.id}`}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold">{goal.title}</h3>
                  <p className="text-sm text-slate-500">{goal.category}</p>
                </div>
                <StatusBadge status={goal.status} />
              </div>

              <ProgressBar value={progress} />

              <div className="mt-4 flex justify-between text-sm text-slate-600">
                <span>{goal.currentAmount} ETH накоплено</span>
                <span>{goal.targetAmount} ETH цель</span>
              </div>

              <div className="mt-3 text-sm text-slate-500">
                Вероятность достижения по AI: {goal.successProbability}%
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}