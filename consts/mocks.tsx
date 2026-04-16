import {
  Briefcase,
  ClipboardList,
  Clock3,
  UserSquare2
} from "lucide-react";

export const quickActions = [
  {
    title: "Gerenciar Serviços",
    description: "Adicionar ou editar serviços",
    to: "/owner/services",
    icon: <Briefcase className="size-5 text-orange-600" />,
    iconClassName: "bg-orange-500/10",
  },
  {
    title: "Gerenciar Profissionais",
    description: "Adicionar ou editar profissionais",
    to: "/owner/professionals",
    icon: <UserSquare2 className="size-5 text-emerald-600" />,
    iconClassName: "bg-emerald-500/10",
  },
  {
    title: "Definir Disponibilidade",
    description: "Configure horários de atendimento",
    to: "/owner/availabilities",
    icon: <Clock3 className="size-5 text-violet-600" />,
    iconClassName: "bg-violet-500/10",
  },
  {
    title: "Ver Agendamentos",
    description: "Visualizar e gerenciar agendamentos",
    to: "/owner/appointments",
    icon: <ClipboardList className="size-5 text-amber-600" />,
    iconClassName: "bg-amber-500/10",
  },
]
