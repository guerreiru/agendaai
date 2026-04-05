import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import { FormField } from "../../components/ui/formField";
import { api } from "../../services/api";

const registerSchema = z
  .object({
    name: z.string().min(2, "Nome deve ter ao menos 2 caracteres"),
    email: z.email("Email invalido"),
    password: z.string().min(6, "Senha deve ter ao menos 6 caracteres"),
    confirmPassword: z.string().min(6, "Confirme sua senha"),
    accountType: z.enum(["CLIENT", "COMPANY_OWNER"]),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas nao conferem",
    path: ["confirmPassword"],
  });

type RegisterForm = z.infer<typeof registerSchema>;

export function RegisterPage() {
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      accountType: "CLIENT",
    },
  });

  async function onSubmit(values: RegisterForm) {
    try {
      await api.post("/users", {
        ...values,
        role:
          values.accountType === "COMPANY_OWNER" ? "COMPANY_OWNER" : "CLIENT",
      });
      alert("Registro bem sucedido! Redirecionando para login...");
      navigate("/login", { replace: true });
    } catch (error) {
      // Log silently in production
      console.log(error);
    }
  }

  return (
    <section className="w-full h-dvh grid place-items-center">
      <div className="max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="mb-1 text-2xl font-bold text-slate-900">Criar conta</h1>
        <p className="mb-6 text-sm text-slate-500">
          Escolha o tipo de conta e preencha os dados para cadastro.
        </p>

        <form
          className="space-y-4"
          onSubmit={handleSubmit(onSubmit)}
          noValidate
        >
          <div>
            <p className="mb-2 text-sm font-semibold text-slate-700">
              Tipo de conta
            </p>
            <div className="grid grid-cols-2 gap-2">
              <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700">
                <input
                  type="radio"
                  value="CLIENT"
                  {...register("accountType")}
                />
                Cliente
              </label>
              <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700">
                <input
                  type="radio"
                  value="COMPANY_OWNER"
                  {...register("accountType")}
                />
                Dona(o) de empresa
              </label>
            </div>
          </div>

          <FormField
            label="Nome"
            id="name"
            autoComplete="name"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            type="text"
            {...register("name")}
            error={errors.name}
          />

          <FormField
            label="Email"
            id="email"
            autoComplete="email"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            type="email"
            {...register("email")}
            error={errors.email}
          />

          <FormField
            label="Senha"
            id="password"
            autoComplete="new-password"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            type="password"
            {...register("password")}
            error={errors.password}
          />

          <FormField
            label="Confirmar senha"
            id="confirmPassword"
            autoComplete="new-password"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            type="password"
            {...register("confirmPassword")}
            error={errors.confirmPassword}
          />

          {errors.root?.message && (
            <p className="text-sm font-semibold text-red-600">
              {errors.root.message}
            </p>
          )}

          <button
            className="inline-flex w-full items-center justify-center rounded-lg bg-sky-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-sky-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? "Cadastrando..." : "Criar conta"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-slate-600">
          Ja possui conta?{" "}
          <Link
            className="font-semibold text-sky-700 hover:underline"
            to="/login"
          >
            Entrar
          </Link>
        </p>
      </div>
    </section>
  );
}
