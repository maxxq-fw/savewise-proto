import Groq from "groq-sdk";
import { env } from "../config/env.js";

interface GenerateForecastInput {
  goal: {
    id: number;
    title: string;
    targetAmountEth: string;
    currentAmountEth: string;
    deadline: number;
  };
  budget: {
    monthlyIncome: number;
    fixedExpenses: number;
    variableExpenses: number;
  };
}

interface ForecastResult {
  successProbability: number;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  recommendedMonthlyDeposit: number;
  recommendedWeeklyDeposit: number;
  forecastedCompletionDate: string;
  budgetPressure: string;
  summary: string;
  recommendations: string[];
}

function addDays(date: Date, days: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function toDateString(date: Date) {
  return date.toISOString().slice(0, 10);
}

function fallbackForecast(input: GenerateForecastInput): ForecastResult {
  const currentAmount = Number(input.goal.currentAmountEth);
  const targetAmount = Number(input.goal.targetAmountEth);
  const remainingAmount = Math.max(0, targetAmount - currentAmount);

  const now = Date.now();
  const deadlineMs = input.goal.deadline * 1000;
  const remainingDays = Math.max(1, Math.ceil((deadlineMs - now) / 86_400_000));
  const monthsLeft = Math.max(1, remainingDays / 30);

  const freeCashFlow =
    input.budget.monthlyIncome -
    input.budget.fixedExpenses -
    input.budget.variableExpenses;

  const requiredMonthlyDeposit = remainingAmount / monthsLeft;
  const probability =
    requiredMonthlyDeposit === 0
      ? 95
      : Math.round(
          Math.max(5, Math.min(95, (freeCashFlow / requiredMonthlyDeposit) * 70))
        );

  const riskLevel =
    probability >= 75 ? "LOW" : probability >= 45 ? "MEDIUM" : "HIGH";

  const expectedMonths =
    freeCashFlow <= 0
      ? monthsLeft * 2
      : remainingAmount / Math.max(0.000001, freeCashFlow);

  return {
    successProbability: probability,
    riskLevel,
    recommendedMonthlyDeposit: Number(requiredMonthlyDeposit.toFixed(4)),
    recommendedWeeklyDeposit: Number((requiredMonthlyDeposit / 4.33).toFixed(4)),
    forecastedCompletionDate: toDateString(addDays(new Date(), Math.ceil(expectedMonths * 30))),
    budgetPressure:
      freeCashFlow < requiredMonthlyDeposit
        ? "Высокая нагрузка"
        : freeCashFlow < requiredMonthlyDeposit * 1.5
          ? "Средняя нагрузка"
          : "Низкая нагрузка",
    summary:
      riskLevel === "LOW"
        ? "Цель выглядит достижимой при сохранении текущего темпа накоплений и контроле расходов."
        : riskLevel === "MEDIUM"
          ? "Цель достижима, но требует регулярных пополнений и контроля переменных расходов."
          : "Риск невыполнения цели высокий. Рекомендуется увеличить регулярный депозит, сократить расходы или перенести дедлайн.",
    recommendations: [
      "Сохранять регулярность пополнений и не пропускать плановые депозиты.",
      "Контролировать переменные расходы, так как они сильнее всего влияют на свободный денежный поток.",
      freeCashFlow < requiredMonthlyDeposit
        ? "Скорректировать срок цели или увеличить размер регулярного депозита."
        : "Текущий бюджет позволяет двигаться к цели без критической нагрузки."
    ]
  };
}

function extractJsonFromText(text: string): ForecastResult {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");

  if (start === -1 || end === -1) {
    throw new Error("AI response does not contain JSON.");
  }

  return JSON.parse(text.slice(start, end + 1)) as ForecastResult;
}

function validateForecastResult(result: ForecastResult): ForecastResult {
  const allowedRiskLevels = new Set(["LOW", "MEDIUM", "HIGH"]);

  if (!allowedRiskLevels.has(result.riskLevel)) {
    throw new Error("AI response contains invalid riskLevel.");
  }

  if (!Array.isArray(result.recommendations)) {
    throw new Error("AI response recommendations must be an array.");
  }

  return {
    successProbability: Number(result.successProbability),
    riskLevel: result.riskLevel,
    recommendedMonthlyDeposit: Number(result.recommendedMonthlyDeposit),
    recommendedWeeklyDeposit: Number(result.recommendedWeeklyDeposit),
    forecastedCompletionDate: String(result.forecastedCompletionDate),
    budgetPressure: String(result.budgetPressure),
    summary: String(result.summary),
    recommendations: result.recommendations.map(String)
  };
}

class AiService {
  private createClient() {
    if (!env.groqApiKey) {
      return null;
    }

    return new Groq({
      apiKey: env.groqApiKey
    });
  }

  async generateForecast(input: GenerateForecastInput): Promise<ForecastResult> {
    const client = this.createClient();

    if (!client) {
      return fallbackForecast(input);
    }

    const prompt = `
Ты являешься AI-модулем финансового прогнозирования для Web3-протокола SaveWise Protocol.

Проанализируй накопительную цель и бюджет пользователя. Все денежные значения указаны в ETH.

Данные цели:
${JSON.stringify(input.goal, null, 2)}

Данные бюджета:
${JSON.stringify(input.budget, null, 2)}

Верни строго JSON без markdown и без пояснений вне JSON:
{
  "successProbability": number,
  "riskLevel": "LOW" | "MEDIUM" | "HIGH",
  "recommendedMonthlyDeposit": number,
  "recommendedWeeklyDeposit": number,
  "forecastedCompletionDate": "YYYY-MM-DD",
  "budgetPressure": string,
  "summary": string,
  "recommendations": string[]
}
`;

    try {
      const response = await client.chat.completions.create({
        model: env.groqModel,
        messages: [
          {
            role: "system",
            content:
              "Ты финансовый AI-аналитик. Отвечай только валидным JSON по заданной схеме."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.2,
        response_format: {
          type: "json_object"
        }
      });

      const content = response.choices[0]?.message?.content;

      if (!content) {
        return fallbackForecast(input);
      }

      return validateForecastResult(extractJsonFromText(content));
    } catch {
      return fallbackForecast(input);
    }
  }
}

export const aiService = new AiService();
