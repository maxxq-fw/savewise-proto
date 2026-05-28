import { Link, useLocation } from "react-router-dom";
import {
  BarChart3,
  Coins,
  Gauge,
  LayoutDashboard,
  PlusCircle,
  Target,
  ShoppingCart,
  User
} from "lucide-react";

const navItems = [
  {
    label: "Панель",
    path: "/dashboard",
    icon: LayoutDashboard
  },
  {
    label: "Цели",
    path: "/goals",
    icon: Target
  },
  {
    label: "Новая цель",
    path: "/goals/new",
    icon: PlusCircle
  },
  {
    label: "AI-прогноз",
    path: "/forecast/1",
    icon: Gauge
  },
  {
    label: "Токеномика",
    path: "/tokenomics",
    icon: Coins
  },
  {
    label: "Marketplace",
    path: "/marketplace",
    icon: ShoppingCart
  },
  {
    label: "Профиль",
    path: "/profile",
    icon: User
  }
];

function isActivePath(currentPath: string, itemPath: string) {
  if (itemPath === "/dashboard") return currentPath === "/dashboard";
  if (itemPath === "/goals") return currentPath === "/goals";
  if (itemPath === "/goals/new") return currentPath === "/goals/new";
  if (itemPath.startsWith("/forecast")) return currentPath.startsWith("/forecast");
  return currentPath.startsWith(itemPath);
}

export function Sidebar() {
  const location = useLocation();

  return (
    <aside className="sticky top-0 hidden h-screen w-72 border-r border-slate-200 bg-white px-4 py-5 lg:block">
      <div className="mb-8 px-2">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-white">
            <BarChart3 size={22} />
          </div>
          <div>
            <div className="text-lg font-semibold">SaveWise</div>
            <div className="text-xs text-slate-500">
              Протокол микронакоплений
            </div>
          </div>
        </div>
      </div>

      <nav className="space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActivePath(location.pathname, item.path);

          return (
            <Link
              key={item.path}
              to={item.path}
              className={[
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                active
                  ? "bg-slate-950 text-white"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
              ].join(" ")}
            >
              <Icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>

    <div className="absolute bottom-5 left-4 right-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
      <div className="font-medium text-slate-950">SaveWise Protocol</div>
      <p className="mt-1">
        Токенизированные микронакопления с AI-анализом бюджета и on-chain
        фиксацией ключевых действий.
      </p>
    </div>
    </aside>
  );
}