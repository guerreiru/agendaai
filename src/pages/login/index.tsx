import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import { FormField } from "../../components/ui/formField";
import { useAuth } from "../../hooks/useAuth";
import { getRoleDashboardPath } from "../../routes/role-redirect";

const loginSchema = z.object({
  email: z.email("Email invalido"),
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
        message: "Credenciais invalidas. Tente novamente.",
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
    <section className="w-full h-dvh grid place-items-center">
      <div className="max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="mb-6 text-2xl font-bold text-slate-900">Entrar</h1>
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
          />

          <FormField
            label="Senha"
            id="password"
            autoComplete="current-password"
            type="password"
            {...register("password")}
            error={errors.password}
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
            className="inline-flex w-full items-center justify-center rounded-lg bg-sky-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-sky-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-slate-600">
          Ainda nao possui conta?{" "}
          <Link
            className="font-semibold text-sky-700 hover:underline"
            to="/register"
          >
            Cadastre-se
          </Link>
        </p>
      </div>
    </section>
  );
}
