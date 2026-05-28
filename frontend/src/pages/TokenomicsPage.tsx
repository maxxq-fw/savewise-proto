import { useEffect, useState } from "react";
import { Coins, Flame, Shield, Sparkles } from "lucide-react";
import { TokenDistributionChart } from "../components/charts/TokenDistributionChart";
import { StatCard } from "../components/ui/StatCard";
import { tokenConfig } from "../data/mockData";
import {
  getContractsRequest,
  getTokenStatsRequest,
  type DeploymentInfo,
  type TokenStats
} from "../services/blockchain-api";
import { getMarketplaceBenefitsRequest } from "../services/chain-api";
import { useGoals } from "../store/goals-context";

export function TokenomicsPage() {
  const { totalBurned } = useGoals();

  const [tokenStats, setTokenStats] = useState<TokenStats | null>(null);
  const [deploymentInfo, setDeploymentInfo] = useState<DeploymentInfo | null>(
    null
  );
  const [personalSaveBalance, setPersonalSaveBalance] = useState("0");
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadBlockchainData() {
      try {
        const [tokenResponse, contractsResponse, marketplaceResponse] =
          await Promise.all([
            getTokenStatsRequest(),
            getContractsRequest(),
            getMarketplaceBenefitsRequest()
          ]);

        setTokenStats(tokenResponse.stats);
        setDeploymentInfo(contractsResponse.deploymentInfo);
        setPersonalSaveBalance(marketplaceResponse.saveBalance.balance);
      } catch (caughtError) {
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Не удалось загрузить blockchain-данные."
        );
      }
    }

    loadBlockchainData();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Токеномика SAVE</h2>
        <p className="mt-1 text-slate-500">
          SAVE используется для наград, штрафов и внутренних привилегий протокола.
        </p>
      </div>

      {error && (
        <div className="rounded-xl bg-amber-50 p-4 text-sm text-amber-800">
          Backend недоступен или blockchain-сеть не запущена: {error}
        </div>
      )}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Supply"
          value={
            tokenStats
              ? Number(tokenStats.totalSupply).toLocaleString("ru-RU")
              : tokenConfig.initialSupply.toLocaleString("ru-RU")
          }
          description="Текущий выпуск SAVE"
          icon={Coins}
        />
        <StatCard
          title="Reward Emission"
          value={`+${tokenConfig.regularDepositReward} / +${tokenConfig.boostedDepositReward}`}
          description="Награда за обычный и boost-депозит"
          icon={Sparkles}
        />
        <StatCard
          title="Сожжено"
          value={`${totalBurned} SAVE`}
          description="Штрафы и покупки привилегий"
          icon={Flame}
        />
        <StatCard
          title="Личный баланс"
          value={`${Number(personalSaveBalance).toFixed(2)} SAVE`}
          description="Доступные utility-токены"
          icon={Shield}
        />
      </section>

      {deploymentInfo && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold">Развернутые контракты</h3>

          <div className="mt-4 grid gap-3 text-sm">
            <div className="rounded-xl bg-slate-50 p-4">
              <div className="text-slate-500">SAVE Token</div>
              <div className="mt-1 break-all font-medium">
                {deploymentInfo.saveToken}
              </div>
            </div>

            <div className="rounded-xl bg-slate-50 p-4">
              <div className="text-slate-500">SavingsVault</div>
              <div className="mt-1 break-all font-medium">
                {deploymentInfo.savingsVault}
              </div>
            </div>

            <div className="rounded-xl bg-slate-50 p-4">
              <div className="text-slate-500">Chain ID</div>
              <div className="mt-1 font-medium">{deploymentInfo.chainId}</div>
            </div>
          </div>
        </div>
      )}

      <TokenDistributionChart />

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold">Utility токена</h3>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {[
            `Награда за регулярный депозит: +${tokenConfig.regularDepositReward} SAVE`,
            `Reward Boost: следующие ${tokenConfig.rewardBoostDepositsPerPurchase} депозитов приносят по +${tokenConfig.boostedDepositReward} SAVE`,
            `Бонус за достижение цели: +${tokenConfig.goalCompletionReward} SAVE`,
            `Досрочный вывод без pass: -${tokenConfig.earlyWithdrawPenalty} SAVE`,
            `No-Penalty Pass: -${tokenConfig.noPenaltyPassPrice} SAVE`,
            `Reward Boost покупка: -${tokenConfig.rewardBoostPrice} SAVE`,
            `Партнерские бонусы: от ${tokenConfig.coffeeCertificatePrice} SAVE`
          ].map((item) => (
            <div key={item} className="rounded-xl bg-slate-50 p-4 text-sm">
              {item}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
