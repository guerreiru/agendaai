import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import type {
  BookingService,
  BookingProfessional,
} from "../../../types/booking";
import { FormField } from "../../../components/ui/formField";

interface Step5Props {
  selectedService: BookingService;
  selectedProfessional: BookingProfessional;
  selectedDate: string;
  isAuthenticated: boolean;
  onAuthSuccess: (accessToken: string, userId: string, name: string) => void;
  onBack: () => void;
  onSkip: () => void;
}

// Validation schemas
const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Senha é obrigatória"),
});

const registerSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
  phone: z
    .string()
    .optional()
    .refine((val) => {
      if (!val) return true;
      // E.164 format: +[country code][number]
      return /^\+\d{1,15}$/.test(val);
    }, "Telefone deve estar no formato E.164 (+5511999999999)"),
});

type LoginForm = z.infer<typeof loginSchema>;
type RegisterForm = z.infer<typeof registerSchema>;

export function Step5Authentication({
  selectedService,
  selectedProfessional,
  selectedDate,
  isAuthenticated,
  onAuthSuccess,
  onBack,
  onSkip,
}: Step5Props) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3001";

  // Login form
  const loginForm = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    mode: "onBlur",
  });

  // Register form
  const registerForm = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    mode: "onBlur",
  });

  const handleLogin = async (data: LoginForm) => {
    setGeneralError(null);
    setIsSubmitting(true);

    try {
      // Login
      const loginResponse = await axios.post(`${apiUrl}/auth/login`, {
        email: data.email,
        password: data.password,
      });

      const accessToken = loginResponse.data.accessToken;

      // Get user data
      const meResponse = await axios.get(`${apiUrl}/auth/me`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      onAuthSuccess(accessToken, meResponse.data.id, meResponse.data.name);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          setGeneralError("Email ou senha incorretos");
        } else {
          setGeneralError(
            error.response?.data?.message || "Erro ao fazer login",
          );
        }
      } else {
        setGeneralError("Erro ao fazer login");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = async (data: RegisterForm) => {
    setGeneralError(null);
    setIsSubmitting(true);

    try {
      // Register
      const registerResponse = await axios.post(`${apiUrl}/users`, {
        name: data.name,
        email: data.email,
        password: data.password,
        phone: data.phone || null,
        role: "CLIENT",
      });

      // Login after registration
      const loginResponse = await axios.post(`${apiUrl}/auth/login`, {
        email: data.email,
        password: data.password,
      });

      const accessToken = loginResponse.data.accessToken;

      onAuthSuccess(accessToken, registerResponse.data.id, data.name);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 409) {
          setGeneralError("Este email já está registrado");
        } else {
          setGeneralError(error.response?.data?.message || "Erro ao registrar");
        }
      } else {
        setGeneralError("Erro ao registrar");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // If already authenticated, skip this step
  if (isAuthenticated) {
    return (
      <div className="space-y-8">
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
          <p className="text-green-700 font-semibold mb-4">
            ✓ Você já está logado!
          </p>
          <p className="text-green-600 text-sm mb-6">
            Prossiga para confirmar seu agendamento.
          </p>
        </div>

        <div className="flex justify-between gap-4">
          <button
            onClick={onBack}
            className="px-6 py-3 rounded-lg font-semibold border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Voltar
          </button>
          <button
            onClick={onSkip}
            className="px-6 py-3 rounded-lg font-semibold bg-blue-600 text-white hover:bg-blue-700"
          >
            Próximo
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Summary */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
        <p className="text-sm text-gray-600">Resumo do agendamento:</p>
        <div className="text-gray-900">
          <p className="font-semibold">{selectedService.name}</p>
          <p className="text-sm">{selectedProfessional.displayName}</p>
          <p className="text-sm">
            {new Date(selectedDate).toLocaleDateString("pt-BR")}
          </p>
        </div>
      </div>

      {/* Mode Toggle */}
      <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
        <button
          onClick={() => {
            setMode("login");
            setGeneralError(null);
            registerForm.reset();
          }}
          className={`flex-1 py-2 rounded font-semibold transition-all ${
            mode === "login"
              ? "bg-white text-blue-600 shadow"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Login
        </button>
        <button
          onClick={() => {
            setMode("register");
            setGeneralError(null);
            loginForm.reset();
          }}
          className={`flex-1 py-2 rounded font-semibold transition-all ${
            mode === "register"
              ? "bg-white text-blue-600 shadow"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Cadastro
        </button>
      </div>

      {/* Error Message */}
      {generalError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700 text-sm">{generalError}</p>
        </div>
      )}

      {/* Login Form */}
      {mode === "login" && (
        <form
          onSubmit={loginForm.handleSubmit(handleLogin)}
          className="space-y-4"
        >
          <FormField
            label="Email"
            {...loginForm.register("email")}
            type="email"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            placeholder="seu@email.com"
            error={loginForm.formState.errors.email}
          />

          <FormField
            label="Senha"
            {...loginForm.register("password")}
            type="password"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            placeholder="••••••"
            error={loginForm.formState.errors.password}
          />

          <div className="flex justify-between gap-4 pt-4">
            <button
              type="button"
              onClick={onBack}
              className="px-6 py-3 rounded-lg font-semibold border border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Voltar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                isSubmitting
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              {isSubmitting ? "Entrando..." : "Entrar"}
            </button>
          </div>
        </form>
      )}

      {/* Register Form */}
      {mode === "register" && (
        <form
          onSubmit={registerForm.handleSubmit(handleRegister)}
          className="space-y-4"
        >
          <FormField
            label="Nome completo"
            {...registerForm.register("name")}
            type="text"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            placeholder="João Silva"
            error={registerForm.formState.errors.name}
          />

          <FormField
            label="E-mail"
            {...registerForm.register("email")}
            type="email"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            placeholder="seu@email.com"
            error={registerForm.formState.errors.email}
          />

          <FormField
            label="Senha"
            {...registerForm.register("password")}
            type="password"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            placeholder="••••••"
            error={registerForm.formState.errors.password}
          />

          <FormField
            label="Telefone (opcional)"
            {...registerForm.register("phone")}
            type="tel"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            placeholder="+5511999999999"
            error={registerForm.formState.errors.phone}
          />

          <div className="flex justify-between gap-4 pt-4">
            <button
              type="button"
              onClick={onBack}
              className="px-6 py-3 rounded-lg font-semibold border border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Voltar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                isSubmitting
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              {isSubmitting ? "Registrando..." : "Registrar e Continuar"}
            </button>
          </div>
        </form>
      )}

      {/* Skip option */}
      <div className="text-center">
        <button
          onClick={onSkip}
          className="text-blue-600 hover:text-blue-700 font-semibold text-sm"
        >
          Pular por agora
        </button>
      </div>
    </div>
  );
}
