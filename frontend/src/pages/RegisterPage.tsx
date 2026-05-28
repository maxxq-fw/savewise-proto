import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { BarChart3 } from "lucide-react";
import { useAuth } from "../store/auth-context";

export function RegisterPage() {
  const { register } = useAuth();

  const [name, setName] = useState("Maxim");
  const [email, setEmail] = useState("maxim@example.com");
  const [password, setPassword] = useState("123456");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      await register({ name, email, password });
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Не удалось зарегистрироваться."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="grid min-h-screen bg-slate-50 lg:grid-cols-[1.1fr_0.9fr]">
      <section className="hidden bg-slate-950 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-slate-950">
            <BarChart3 size={22} />
          </div>
          <div>
            <div className="text-lg font-semibold">SaveWise Protocol</div>
            <div className="text-sm text-slate-300">
              Decentralized micro-savings
            </div>
          </div>
        </div>

        <div className="max-w-xl">
          <h1 className="text-4xl font-semibold tracking-tight">
            Создай аккаунт и начни управлять накопительными целями.
          </h1>
          <p className="mt-5 text-slate-300">
            Профиль используется для хранения целей, бюджетных параметров,
            AI-прогнозов и привязки кошелька.
          </p>
        </div>

        <div className="text-sm text-slate-400">
          Создание целей, накопления и SAVE-бонусы
        </div>
      </section>

      <section className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-semibold">Регистрация</h2>
          <p className="mt-2 text-sm text-slate-500">
            Создай аккаунт для работы с накопительными целями и аналитикой.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="text-sm font-medium">Имя</label>
              <input
                required
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2 outline-none focus:border-slate-950"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Email</label>
              <input
                required
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2 outline-none focus:border-slate-950"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Пароль</label>
              <input
                required
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2 outline-none focus:border-slate-950"
              />
            </div>

            {error && (
              <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              disabled={isSubmitting}
              type="submit"
              className="w-full rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {isSubmitting ? "Создание аккаунта..." : "Создать аккаунт"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            Уже есть аккаунт?{" "}
            <Link to="/login" className="font-medium text-slate-950">
              Войти
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}