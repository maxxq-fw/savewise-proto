import { useState, type FormEvent } from "react";
import { useParams } from "react-router-dom";
import { createForecastRequest } from "../services/forecast-api";
import { useGoals } from "../store/goals-context";
import type { ForecastReport } from "../types/goal";

const riskLabels = {
  LOW: "Низкий риск",
  MEDIUM: "Средний риск",
  HIGH: "Высокий риск"
};

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function ForecastPage() {
  const { id } = useParams();
  const goalId = Number(id);

  const { getGoalById, generateForecast } = useGoals();
  const goal = getGoalById(goalId);

  const [monthlyIncome, setMonthlyIncome] = useState("");
  const [fixedExpenses, setFixedExpenses] = useState("");
  const [variableExpenses, setVariableExpenses] = useState("");
  const [report, setReport] = useState<ForecastReport | undefined>();
  const [isLoading, setIsLoading] = useState(false);

  if (!goal) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        Цель не найдена.
      </div>
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setReport(undefined);
    setIsLoading(true);

    const budget = {
      monthlyIncome: Number(monthlyIncome),
      fixedExpenses: Number(fixedExpenses),
      variableExpenses: Number(variableExpenses)
    };

    if (!monthlyIncome || !fixedExpenses || !variableExpenses) {
      setIsLoading(false);
      return;
    }

    try {
      await wait(1000);

      const response = await createForecastRequest(goalId, budget);

      setReport({
        id: `backend-${Date.now()}`,
        goalId,
        successProbability: response.forecast.successProbability,
        riskLevel: response.forecast.riskLevel,
        recommendedMonthlyDeposit: response.forecast.recommendedMonthlyDeposit,
        recommendedWeeklyDeposit: response.forecast.recommendedWeeklyDeposit,
        forecastedCompletionDate: response.forecast.forecastedCompletionDate,
        budgetPressure: response.forecast.budgetPressure,
        summary: response.forecast.summary,
        recommendations: response.forecast.recommendations,
        createdAt: new Date().toISOString().slice(0, 10)
      });
    } catch {
      const localReport = generateForecast(goalId, budget);
      setReport(localReport);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-semibold">AI-прогноз бюджета</h2>
        <p className="mt-1 text-sm text-slate-500">
          Аналитический модуль оценивает вероятность достижения накопительной
          цели и формирует рекомендации по корректировке бюджета.
        </p>

        <div className="mt-5 rounded-xl bg-slate-50 p-4 text-sm">
          <div className="font-medium">{goal.title}</div>
          <div className="mt-1 text-slate-500">
            Накоплено {goal.currentAmount} из {goal.targetAmount} ETH
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="text-sm font-medium">Ежемесячный доход, ETH</label>
            <input
              type="number"
              required
              value={monthlyIncome}
              onChange={(event) => setMonthlyIncome(event.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Обязательные расходы, ETH</label>
            <input
              type="number"
              required
              value={fixedExpenses}
              onChange={(event) => setFixedExpenses(event.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Переменные расходы, ETH</label>
            <input
              type="number"
              required
              value={variableExpenses}
              onChange={(event) => setVariableExpenses(event.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2"
            />
          </div>

          <button
            disabled={isLoading}
            type="submit"
            className="w-full rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {isLoading ? "AI анализирует данные..." : "Сформировать прогноз"}
          </button>
        </form>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold">Результат прогноза</h3>

        {isLoading && (
          <div className="mt-6 rounded-2xl bg-slate-50 p-5 text-sm text-slate-600">
            <div className="font-medium text-slate-950">AI-модуль обрабатывает данные</div>
            <p className="mt-2 text-slate-500">
              Сопоставляем цель, текущий прогресс, дедлайн и структуру бюджета.
            </p>
          </div>
        )}

        {!report && !isLoading && (
          <div className="mt-6 rounded-2xl bg-slate-50 p-5 text-sm text-slate-500">
            Заполни бюджетные параметры и запусти анализ.
          </div>
        )}

        {report && !isLoading && (
          <>
            <div className="mt-6 rounded-2xl bg-slate-50 p-5">
              <div className="text-sm text-slate-500">
                Вероятность достижения цели
              </div>
              <div className="mt-2 text-4xl font-semibold">
                {report.successProbability}%
              </div>
              <div className="mt-2 text-sm font-medium text-slate-700">
                {riskLabels[report.riskLevel]}
              </div>
            </div>

            <div className="mt-5 grid gap-3 text-sm text-slate-600">
              <p>
                Рекомендуемый ежемесячный депозит:{" "}
                <span className="font-medium text-slate-950">
                  {report.recommendedMonthlyDeposit} ETH
                </span>
              </p>
              <p>
                Рекомендуемый еженедельный депозит:{" "}
                <span className="font-medium text-slate-950">
                  {report.recommendedWeeklyDeposit} ETH
                </span>
              </p>
              <p>
                Прогнозируемая дата достижения:{" "}
                <span className="font-medium text-slate-950">
                  {report.forecastedCompletionDate}
                </span>
              </p>
              <p>
                Финансовая нагрузка:{" "}
                <span className="font-medium text-slate-950">
                  {report.budgetPressure}
                </span>
              </p>
            </div>

            <div className="mt-6 rounded-xl border border-slate-100 p-4">
              <div className="font-medium">Вывод AI-модуля</div>
              <p className="mt-2 text-sm text-slate-600">{report.summary}</p>
            </div>

            <div className="mt-6">
              <div className="font-medium">Рекомендации</div>
              <ul className="mt-3 space-y-2 text-sm text-slate-600">
                {report.recommendations.map((item) => (
                  <li key={item} className="rounded-xl bg-slate-50 p-3">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
