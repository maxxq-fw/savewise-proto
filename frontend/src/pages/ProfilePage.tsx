import { useEffect, useState } from "react";
import { User, Wallet } from "lucide-react";
import { useAuth } from "../store/auth-context";
import { useGoals } from "../store/goals-context";
import { getMarketplaceBenefitsRequest } from "../services/chain-api";

export function ProfilePage() {
  const { user } = useAuth();
  const { goals } = useGoals();
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

  if (!user) {
    return null;
  }

  const completedGoals = goals.filter((goal) => goal.status === "COMPLETED").length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Профиль пользователя</h2>
        <p className="mt-1 text-slate-500">
          Профиль используется для авторизации, хранения AI-отчетов и связи с
          on-chain действиями.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-950 text-white">
              <User size={24} />
            </div>

            <div>
              <div className="text-xl font-semibold">{user.name}</div>
              <div className="text-sm text-slate-500">{user.email}</div>
            </div>
          </div>

          <div className="mt-6 space-y-3 text-sm">
            <div className="rounded-xl bg-slate-50 p-4">
              <div className="text-slate-500">Дата регистрации</div>
              <div className="mt-1 font-medium">
                {new Date(user.createdAt).toLocaleDateString("ru-RU")}
              </div>
            </div>

            <div className="rounded-xl bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-slate-500">
                <Wallet size={16} />
                Личный custodial-кошелек
              </div>
              <div className="mt-1 break-all font-medium">
                {user.walletAddress ?? "Кошелек назначается при регистрации"}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold">Сводка активности</h3>

          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <div className="rounded-xl bg-slate-50 p-4">
              <div className="text-sm text-slate-500">Всего целей</div>
              <div className="mt-2 text-2xl font-semibold">{goals.length}</div>
            </div>

            <div className="rounded-xl bg-slate-50 p-4">
              <div className="text-sm text-slate-500">Завершено</div>
              <div className="mt-2 text-2xl font-semibold">{completedGoals}</div>
            </div>

            <div className="rounded-xl bg-slate-50 p-4">
              <div className="text-sm text-slate-500">Личный SAVE</div>
              <div className="mt-2 text-2xl font-semibold">
                {Number(personalSaveBalance).toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
