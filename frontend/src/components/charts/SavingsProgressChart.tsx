import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import type { SavingsGoal } from "../../types/goal";

interface SavingsProgressChartProps {
  goal: SavingsGoal;
}

export function SavingsProgressChart({ goal }: SavingsProgressChartProps) {
  const sortedDeposits = [...goal.deposits].sort(
    (a, b) =>
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  let cumulativeAmount = 0;

  const data = sortedDeposits.map((deposit) => {
    cumulativeAmount += deposit.amount;

    return {
      date: deposit.createdAt,
      amount: cumulativeAmount,
      deposit: deposit.amount
    };
  });

  const chartData =
    data.length > 0
      ? data
      : [
          {
            date: goal.createdAt,
            amount: 0,
            deposit: 0
          }
        ];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5">
        <h3 className="text-lg font-semibold">Динамика накоплений</h3>
        <p className="text-sm text-slate-500">
          Рост накопленной суммы по истории депозитов.
        </p>
      </div>

      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="savingsGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0f172a" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#0f172a" stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="date" tickLine={false} axisLine={false} />
            <YAxis tickLine={false} axisLine={false} />
            <Tooltip
              formatter={(value, name) => {
                if (name === "amount") return [`${value} ETH`, "Накоплено"];
                if (name === "deposit") return [`${value} ETH`, "Депозит"];
                return value;
              }}
              labelFormatter={(label) => `Дата: ${label}`}
            />
            <Area
              type="monotone"
              dataKey="amount"
              stroke="#0f172a"
              fill="url(#savingsGradient)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}