import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import Fox from "../../assets/fox.svg";
import { FormField } from "../../components/ui/formField";
import { useAuth } from "../../hooks/useAuth";
import { getRoleDashboardPath } from "../../routes/role-redirect";

const loginSchema = z.object({
  email: z.email("Email inválido"),
  password: z.string().min(6, "Senha deve ter ao menos 6 caracteres"),
});

type LoginForm = z.infer<typeof loginSchema>;

export function LoginPage() {
  const navigate = useNavigate();
  const { login, error, isAuthenticated, user, isLoading } = useAuth();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: LoginForm) {
    try {
      await login(values.email, values.password);
    } catch {
      setError("root", {
        message: "Credenciais inválidas. Tente novamente.",
      });
    }
  }

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (isAuthenticated && user) {
      navigate(getRoleDashboardPath(user.role), { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate, user]);

  return (
    <section className="flex min-h-dvh bg-white">
      <aside className="hidden flex-1 flex-col justify-between gap-8 bg-slate-950 p-10 md:flex md:max-w-1/3">
        <div className="">
          <img src={Fox} alt="Fox" />
          <div className="flex items-center text-lg font-bold">
            <p className="font-jamjuree text-orange-600">PLA</p>
            <p className="font-jamjuree text-white">NNIE</p>
          </div>
          <p className="text-slate-500 text-xs">Sistema de Agendamento</p>
        </div>

        <div>
          <h1 className="font-jakarta text-white text-4xl leading-tight">
            Bem-vindo de
          </h1>
          <span className="font-jakarta text-4xl leading-tight text-lime-300">
            volta
          </span>
          <p className="text-slate-500">
            Acesse sua conta e gerencie seus agendamentos
          </p>
        </div>

        <p className="text-slate-500 text-xs">
          © 2024 PLANNIE. Todos os direitos reservados.
        </p>
      </aside>

      <main className="grid flex-1 place-items-center px-6 py-10">
        <div className="w-full max-w-md">
          <h2 className="mb-6 text-3xl font-medium">Entrar</h2>
          <form
            className="space-y-4"
            onSubmit={handleSubmit(onSubmit)}
            noValidate
          >
            <FormField
              label="E-mail"
              id="email"
              autoComplete="email"
              type="email"
              {...register("email")}
              error={errors.email}
              placeholder="exemplo@gmail.com"
            />

            <FormField
              label="Senha"
              id="password"
              autoComplete="current-password"
              type="password"
              {...register("password")}
              error={errors.password}
              placeholder="*******************"
            />

            {errors.root?.message && (
              <p className="text-sm font-semibold text-red-600">
                {errors.root.message}
              </p>
            )}

            {!errors.root?.message && error?.message && (
              <p className="text-sm font-semibold text-red-600">
                {error.message}
              </p>
            )}

            <button
              className="inline-flex w-full items-center justify-center rounded-lg bg-lime-300 px-4 py-2.5 text-sm font-bold transition-colors hover:bg-lime-300/70 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isSubmitting}
              type="submit"
            >
              {isSubmitting ? "Entrando..." : "Entrar"}
            </button>
          </form>

          <p className="mt-4 text-center text-sm text-slate-600">
            Ainda não possui conta?{" "}
            <Link
              className="font-semibold text-orange-600 hover:underline"
              to="/register"
            >
              Cadastre-se
            </Link>
          </p>
        </div>
      </main>
    </section>
  );
}
