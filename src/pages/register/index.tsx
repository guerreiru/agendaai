import { zodResolver } from "@hookform/resolvers/zod";
import { Building2, UserRound } from "lucide-react";
import { useForm, useWatch } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import Fox from "../../assets/fox.svg";
import { FormField } from "../../components/ui/formField";
import { PhoneField } from "../../components/ui/phoneField";
import { api, toApiError } from "../../services/api";

const registerSchema = z
	.object({
		name: z.string().min(2, "Nome deve ter ao menos 2 caracteres"),
		phone: z
			.string()
			.min(14, "Telefone deve estar no formato (99) 99999-9999")
			.optional()
			.or(z.literal("")),
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
		setError,
		setValue,
		control,
		formState: { errors, isSubmitting },
	} = useForm<RegisterForm>({
		resolver: zodResolver(registerSchema),
		defaultValues: {
			name: "",
			email: "",
			password: "",
			confirmPassword: "",
			phone: "",
			accountType: "CLIENT",
		},
	});

	const selectedAccountType = useWatch({
		control,
		name: "accountType",
	});

	async function onSubmit(values: RegisterForm) {
		const { confirmPassword, accountType, ...rest } = values;
		void confirmPassword;

		try {
			await api.post("/users", {
				...rest,
				role: accountType,
			});
			navigate("/login", { replace: true });
		} catch (error) {
			const parsedError = toApiError(error);

			const serverMessage = parsedError.message.toLowerCase();
			const isDuplicateEmail =
				parsedError.statusCode === 409 ||
				serverMessage.includes("email already registered") ||
				serverMessage.includes("email already exists") ||
				serverMessage.includes("e-mail já cadastrado") ||
				serverMessage.includes("email já cadastrado");

			if (isDuplicateEmail) {
				setError("email", {
					type: "server",
					message: "Este email já está cadastrado.",
				});
				return;
			}

			setError("root", {
				type: "server",
				message:
					parsedError.message ||
					"Não foi possível criar sua conta. Tente novamente.",
			});
		}
	}

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

				<h1 className="font-jakarta text-white text-4xl leading-tight">
					<span className="text-orange-600">Gerencie</span>
					<span className="flex items-center flex-wrap gap-1">
						seus <span className="text-lime-300">agendamentos</span>
					</span>
					sem<span className="text-violet-400"> complicações</span>
				</h1>

				<p className="text-slate-500 text-xs">
					© 2024 PLANNIE. Todos os direitos reservados.
				</p>
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
							<legend className="text-sm font-medium text-gray-700">
								Tipo de conta
							</legend>
							<div className="grid grid-cols-2 gap-2">
								<label className="group relative flex cursor-pointer items-center justify-center gap-4 rounded-xl border border-gray-200 p-4 text-sm font-medium text-slate-500 transition-all hover:border-orange-600 hover:text-gray-500">
									<input
										type="radio"
										value="CLIENT"
										className="peer sr-only"
										checked={selectedAccountType === "CLIENT"}
										{...register("accountType")}
									/>
									<UserRound className="h-5 w-5 transition-colors peer-checked:text-orange-600" />
									<span className="transition-colors peer-checked:text-orange-600">
										Cliente
									</span>
									<span className="pointer-events-none absolute inset-0 rounded-xl border-2 border-transparent transition-colors peer-checked:border-orange-500" />
								</label>
								<label className="group relative flex cursor-pointer items-center justify-center gap-4 rounded-xl border border-gray-200 p-4 text-sm font-medium text-slate-500 transition-all hover:border-orange-600 hover:text-gray-500">
									<input
										type="radio"
										value="COMPANY_OWNER"
										className="peer sr-only"
										checked={selectedAccountType === "COMPANY_OWNER"}
										{...register("accountType")}
									/>
									<Building2 className="h-5 w-5 transition-colors peer-checked:text-orange-600" />
									<span className="transition-colors peer-checked:text-orange-600">
										Profissional
									</span>
									<span className="pointer-events-none absolute inset-0 rounded-xl border-2 border-transparent transition-colors peer-checked:border-orange-500" />
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

						<PhoneField
							label="Telefone"
							placeholder="(99) 99999-9999"
							error={errors.phone?.message}
							onChange={(value) => {
								if (typeof value === "string") {
									setValue("phone", value || "");
								}
							}}
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
