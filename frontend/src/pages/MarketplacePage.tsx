import { useEffect, useState } from "react";
import {
  BarChart3,
  Coffee,
  CreditCard,
  ShieldCheck,
  ShoppingBasket,
  Sparkles,
  TicketPercent
} from "lucide-react";
import { StatCard } from "../components/ui/StatCard";
import { tokenConfig } from "../data/mockData";
import {
  buyMarketplaceProductRequest,
  buyNoPenaltyPassRequest,
  buyRewardBoostRequest,
  getMarketplaceBenefitsRequest,
  getMarketplaceProductsRequest,
  type MarketplaceProduct,
  type MarketplacePurchase,
  type UserBenefits
} from "../services/chain-api";

type ProtocolPurchaseType = "NO_PENALTY_PASS" | "REWARD_BOOST";

function getProductIcon(productId: string) {
  if (productId.includes("PYATEROCHKA")) return TicketPercent;
  if (productId.includes("COFFEE")) return Coffee;
  if (productId.includes("TBANK")) return CreditCard;
  return ShoppingBasket;
}

export function MarketplacePage() {
  const [benefits, setBenefits] = useState<UserBenefits | null>(null);
  const [products, setProducts] = useState<MarketplaceProduct[]>([]);
  const [purchases, setPurchases] = useState<MarketplacePurchase[]>([]);
  const [saveBalance, setSaveBalance] = useState("0");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  async function loadMarketplaceData() {
    try {
      const [benefitsResponse, productsResponse] = await Promise.all([
        getMarketplaceBenefitsRequest(),
        getMarketplaceProductsRequest()
      ]);

      setBenefits(benefitsResponse.benefits);
      setSaveBalance(benefitsResponse.saveBalance.balance);
      setPurchases(benefitsResponse.purchases);
      setProducts(productsResponse.products);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Не удалось загрузить marketplace-данные."
      );
    }
  }

  useEffect(() => {
    loadMarketplaceData();
  }, []);

  async function handleProtocolPurchase(type: ProtocolPurchaseType) {
    setError("");
    setMessage("");
    setPendingAction(type);

    try {
      const response =
        type === "NO_PENALTY_PASS"
          ? await buyNoPenaltyPassRequest()
          : await buyRewardBoostRequest();

      setBenefits(response.benefits);
      setSaveBalance(response.saveBalance.balance);
      setMessage(`Покупка выполнена. Tx: ${response.txHash}`);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Не удалось выполнить покупку. Проверь личный баланс SAVE."
      );
    } finally {
      setPendingAction(null);
    }
  }

  async function handleMaterialPurchase(productId: string) {
    setError("");
    setMessage("");
    setPendingAction(productId);

    try {
      const response = await buyMarketplaceProductRequest(productId);

      setSaveBalance(response.saveBalance.balance);
      setPurchases((current) => [response.purchase, ...current]);
      setMessage(
        `Купон куплен. Код: ${response.purchase.code}. Tx: ${response.txHash}`
      );
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Не удалось купить купон. Проверь личный баланс SAVE."
      );
    } finally {
      setPendingAction(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">SAVE Marketplace</h2>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {message && (
        <div className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-700">
          {message}
        </div>
      )}

      <section className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="Личный баланс SAVE"
          value={`${Number(saveBalance).toFixed(2)} SAVE`}
          description="Доступно для покупок"
          icon={Sparkles}
        />
        <StatCard
          title="No-Penalty Pass"
          value={`${benefits?.noPenaltyPasses ?? 0}`}
          description="Досрочный вывод без штрафа"
          icon={ShieldCheck}
        />
        <StatCard
          title="Reward Boost"
          value={`${benefits?.rewardBoosts ?? 0}`}
          description="Оставшиеся усиленные депозиты"
          icon={BarChart3}
        />
      </section>

      <section>
        <div className="mb-4">
          <h3 className="text-lg font-semibold">Протокольные привилегии</h3>
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          <div className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white">
              <BarChart3 size={22} />
            </div>
            <h3 className="mt-5 text-lg font-semibold">Reward Boost</h3>
            <p className="mt-2 text-sm text-slate-500">
              Усилитель регулярности: после покупки следующие {tokenConfig.rewardBoostDepositsPerPurchase} депозитов
              принесут по {tokenConfig.boostedDepositReward} SAVE вместо стандартных {tokenConfig.regularDepositReward} SAVE.
            </p>
            <div className="mt-5 rounded-xl bg-slate-50 p-4">
              <div className="text-sm text-slate-500">Стоимость</div>
              <div className="mt-1 text-2xl font-semibold">
                {tokenConfig.rewardBoostPrice} SAVE
              </div>
            </div>
            <button
              disabled={Boolean(pendingAction)}
              onClick={() => handleProtocolPurchase("REWARD_BOOST")}
              className="mt-auto w-full rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {pendingAction === "REWARD_BOOST" ? "Покупка..." : "Купить Reward Boost"}
            </button>
          </div>

          <div className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white">
              <ShieldCheck size={22} />
            </div>
            <h3 className="mt-5 text-lg font-semibold">No-Penalty Pass</h3>
            <p className="mt-2 text-sm text-slate-500">
              Пропуск для досрочного вывода без штрафа 10 SAVE. Если pass активен,
              контракт использует его автоматически.
            </p>
            <div className="mt-5 rounded-xl bg-slate-50 p-4">
              <div className="text-sm text-slate-500">Стоимость</div>
              <div className="mt-1 text-2xl font-semibold">
                {tokenConfig.noPenaltyPassPrice} SAVE
              </div>
            </div>
            <button
              disabled={Boolean(pendingAction)}
              onClick={() => handleProtocolPurchase("NO_PENALTY_PASS")}
              className="mt-auto w-full rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {pendingAction === "NO_PENALTY_PASS" ? "Покупка..." : "Купить No-Penalty Pass"}
            </button>
          </div>
        </div>
      </section>

      <section>
        <div className="mb-4">
          <h3 className="text-lg font-semibold">Партнерские бонусы</h3>
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          {products.map((product) => {
            const Icon = getProductIcon(product.id);

            return (
              <div
                key={product.id}
                className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white">
                  <Icon size={22} />
                </div>
                <h3 className="mt-5 text-lg font-semibold">{product.title}</h3>
                <div className="mt-1 text-sm font-medium text-slate-700">
                  {product.subtitle}
                </div>
                <p className="mt-2 text-sm text-slate-500">
                  {product.description}
                </p>
                <div className="mt-5 rounded-xl bg-slate-50 p-4">
                  <div className="text-sm text-slate-500">Стоимость</div>
                  <div className="mt-1 text-2xl font-semibold">
                    {product.priceSave} SAVE
                  </div>
                </div>
                <button
                  disabled={Boolean(pendingAction)}
                  onClick={() => handleMaterialPurchase(product.id)}
                  className="mt-auto w-full rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {pendingAction === product.id ? "Покупка..." : "Купить купон"}
                </button>
              </div>
            );
          })}
        </div>
      </section>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold">Мои купоны</h3>

        <div className="mt-4 space-y-3">
          {purchases.length === 0 && (
            <div className="text-sm text-slate-500">
              Купонов пока нет. Купи любой бонус за SAVE.
            </div>
          )}

          {purchases.map((purchase) => (
            <div
              key={purchase.id}
              className="rounded-xl bg-slate-50 p-4 text-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="font-medium text-slate-950">
                    {purchase.title}
                  </div>
                  <div className="mt-1 text-slate-500">
                    Куплено за {purchase.priceSave} SAVE
                  </div>
                </div>
                <div className="rounded-lg bg-white px-3 py-2 font-mono text-xs font-semibold text-slate-700">
                  {purchase.code}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
