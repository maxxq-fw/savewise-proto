import { useEffect, useState } from "react";
import { LogOut } from "lucide-react";
import { useAuth } from "../../store/auth-context";
import { getMarketplaceBenefitsRequest } from "../../services/chain-api";

export function Topbar() {
  const { logout } = useAuth();
  const [saveBalance, setSaveBalance] = useState("0");

  useEffect(() => {
    let active = true;

    async function loadBalance() {
      try {
        const response = await getMarketplaceBenefitsRequest();
        if (active) setSaveBalance(response.saveBalance.balance);
      } catch {
        if (active) setSaveBalance("0");
      }
    }

    loadBalance();
    const intervalId = window.setInterval(loadBalance, 5000);

    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, []);

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <div>
          <div className="text-sm text-slate-500">
            Децентрализованная система накоплений
          </div>
          <h1 className="text-xl font-semibold text-slate-950">
            SaveWise Protocol
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden rounded-xl bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 sm:block">
            {Number(saveBalance).toFixed(2)} SAVE
          </div>

          <button
            onClick={logout}
            className="flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            <LogOut size={17} />
            Выйти
          </button>
        </div>
      </div>
    </header>
  );
}
