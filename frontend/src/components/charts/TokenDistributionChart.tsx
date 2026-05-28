import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { tokenConfig } from "../../data/mockData";

const data = [
  {
    name: "Депозит",
    value: tokenConfig.regularDepositReward,
    type: "Эмиссия"
  },
  {
    name: "Boost-депозит",
    value: tokenConfig.boostedDepositReward,
    type: "Эмиссия"
  },
  {
    name: "Завершение",
    value: tokenConfig.goalCompletionReward,
    type: "Эмиссия"
  },
  {
    name: "No-Penalty",
    value: tokenConfig.noPenaltyPassPrice,
    type: "Сжигание"
  },
  {
    name: "Reward Boost",
    value: tokenConfig.rewardBoostPrice,
    type: "Сжигание"
  }
];

export function TokenDistributionChart() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5">
        <h3 className="text-lg font-semibold">Потоки SAVE</h3>
        <p className="text-sm text-slate-500">
          Основные операции начисления и списания SAVE.
        </p>
      </div>

      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" tickLine={false} axisLine={false} />
            <YAxis tickLine={false} axisLine={false} />
            <Tooltip
              formatter={(value, _name, item) => [
                `${value} SAVE`,
                item.payload.type
              ]}
            />
            <Bar dataKey="value" fill="#0f172a" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
