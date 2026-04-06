import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import { FormField } from "../../components/ui/formField";
import { api } from "../../services/api";
import Fox from "../../assets/fox.svg";

const registerSchema = z
  .object({
    name: z.string().min(2, "Nome deve ter ao menos 2 caracteres"),
    email: z.email("Email inválido"),
    password: z.string().min(6, "Senha deve ter ao menos 6 caracteres"),
    confirmPassword: z.string().min(6, "Confirme sua senha"),
    accountType: z.enum(["CLIENT", "COMPANY_OWNER"]),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não conferem",
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
      console.log(error);
    }
  }

  return (
    <section className="flex min-h-dvh bg-white">
      <aside className="hidden flex-1 flex-col items-center justify-center gap-8 bg-slate-950 p-10 md:flex md:max-w-[33.333333%]">
        <div className="grid place-items-center">
          <img src={Fox} alt="Fox" />
          <div className="flex items-center text-lg font-bold">
            <p className="font-jamjuree text-orange-600">PLA</p>
            <p className="font-jamjuree text-white">NNIE</p>
          </div>
        </div>

        <h1 className="font-jakarta text-white">
          Dê adeus às anotações no papel e descubra como é simples planejar com
          o Plannie!
        </h1>
      </aside>

      <main className="grid flex-1 place-items-center px-6 py-10">
        <div className="w-full max-w-md">
          <h2 className="mb-6 text-3xl font-medium">Cadastrar-se</h2>

          <form
            className="space-y-4"
            onSubmit={handleSubmit(onSubmit)}
            noValidate
          >
            <fieldset className="space-y-2">
              <legend className="text-sm font-semibold text-slate-700">
                Tipo de conta
              </legend>
              <div className="grid grid-cols-2 gap-2">
                <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-slate-400">
                  <input
                    type="radio"
                    value="CLIENT"
                    className="h-4 w-4 accent-orange-600"
                    {...register("accountType")}
                  />
                  Cliente
                </label>
                <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-slate-400">
                  <input
                    type="radio"
                    value="COMPANY_OWNER"
                    className="h-4 w-4 accent-orange-600"
                    {...register("accountType")}
                  />
                  Dona(o) de empresa
                </label>
              </div>
            </fieldset>

            <FormField
              label="Nome"
              id="name"
              autoComplete="name"
              type="text"
              {...register("name")}
              error={errors.name}
              placeholder="Seu nome"
            />

            <FormField
              label="Email"
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
              autoComplete="new-password"
              type="password"
              {...register("password")}
              error={errors.password}
              placeholder="*******************"
            />

            <FormField
              label="Confirmar senha"
              id="confirmPassword"
              autoComplete="new-password"
              type="password"
              {...register("confirmPassword")}
              error={errors.confirmPassword}
              placeholder="*******************"
            />

            {errors.root?.message && (
              <p className="text-sm font-semibold text-red-600">
                {errors.root.message}
              </p>
            )}

            <button
              className="inline-flex w-full items-center justify-center rounded-lg bg-lime-300 px-4 py-2.5 text-sm font-bold transition-colors hover:bg-lime-300/70 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isSubmitting}
              type="submit"
            >
              {isSubmitting ? "Cadastrando..." : "Criar conta"}
            </button>
          </form>

          <p className="mt-4 text-center text-sm text-slate-600">
            Já possui conta?{" "}
            <Link
              className="font-semibold text-orange-600 hover:underline"
              to="/login"
            >
              Entrar
            </Link>
          </p>
        </div>
      </main>
    </section>
  );
}
