import { useEffect, useState } from "react";
import { Coins, Flame, Target, TrendingUp } from "lucide-react";
import { SavingsProgressChart } from "../components/charts/SavingsProgressChart";
import { StatCard } from "../components/ui/StatCard";
import { ProgressBar } from "../components/ui/ProgressBar";
import { StatusBadge } from "../components/ui/StatusBadge";
import { useAuth } from "../store/auth-context";
import { useGoals } from "../store/goals-context";
import { getMarketplaceBenefitsRequest } from "../services/chain-api";

export function DashboardPage() {
  const { user } = useAuth();
  const { goals, totalBurned } = useGoals();
  const [personalSaveBalance, setPersonalSaveBalance] = useState("0");

  useEffect(() => {
    async function loadBalance() {
      try {
        const response = await getMarketplaceBenefitsRequest();
        setPersonalSaveBalance(response.saveBalance.balance);
      } catch {
        setPersonalSaveBalance("0");
      }
    }

    loadBalance();
  }, []);

  const totalSaved = goals.reduce((sum, goal) => sum + goal.currentAmount, 0);
  const totalTarget = goals.reduce((sum, goal) => sum + goal.targetAmount, 0);
  const activeGoals = goals.filter((goal) => goal.status === "ACTIVE").length;
  const totalProgress =
    totalTarget === 0 ? 0 : Math.round((totalSaved / totalTarget) * 100);
  const mainGoal = goals[0];

  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-slate-950 p-8 text-white">
        <div className="max-w-3xl">
          <div className="mb-3 text-sm text-slate-300">
            Добро пожаловать, {user?.name}
          </div>
          <h2 className="text-3xl font-semibold tracking-tight">
            Формируй финансовую дисциплину через микронакопления, токены и
            AI-прогнозы.
          </h2>
          <p className="mt-4 text-slate-300">
            Создавай цели, регулярно пополняй накопления, получай SAVE-токены
            за дисциплину и используй AI-аналитику для оценки вероятности
            достижения финансовой цели.
          </p>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Всего накоплено"
          value={`${totalSaved} ETH`}
          description={`${totalProgress}% от всех целей`}
          icon={TrendingUp}
        />
        <StatCard
          title="Баланс SAVE"
          value={`${Number(personalSaveBalance).toFixed(2)} SAVE`}
          description="Доступные utility-токены"
          icon={Coins}
        />
        <StatCard
          title="Активные цели"
          value={`${activeGoals}`}
          description="Цели в процессе накопления"
          icon={Target}
        />
        <StatCard
          title="Сожжено токенов"
          value={`${totalBurned} SAVE`}
          description="Штрафы и комиссии"
          icon={Flame}
        />
      </section>

      {mainGoal && <SavingsProgressChart goal={mainGoal} />}

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5">
          <h3 className="text-lg font-semibold">Текущие цели накопления</h3>
          <p className="text-sm text-slate-500">
            Прогресс по активным и завершенным целям.
          </p>
        </div>

        <div className="space-y-5">
          {goals.map((goal) => {
            const progress = Math.round(
              (goal.currentAmount / goal.targetAmount) * 100
            );

            return (
              <div key={goal.id} className="rounded-xl border border-slate-100 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <div className="font-medium text-slate-950">
                      {goal.title}
                    </div>
                    <div className="text-sm text-slate-500">
                      {goal.category}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="hidden text-right sm:block">
                      <div className="font-medium">
                        {goal.currentAmount} / {goal.targetAmount} ETH
                      </div>
                      <div className="text-sm text-slate-500">
                        AI-прогноз: {goal.successProbability}%
                      </div>
                    </div>
                    <StatusBadge status={goal.status} />
                  </div>
                </div>

                <ProgressBar value={progress} />
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}