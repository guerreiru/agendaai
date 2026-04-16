import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { Appointment } from "../../../types/booking";
import { AgendaRow } from "./AgendaRow";

function makeAppointment(overrides: Partial<Appointment> = {}): Appointment {
  return {
    id: "apt-1",
    companyId: "cmp-1",
    clientId: "cli-1",
    professionalId: "pro-1",
    serviceId: "srv-1",
    date: "2099-12-12",
    startTime: "10:00",
    endTime: "11:00",
    price: 100,
    status: "PENDING_PROFESSIONAL_CONFIRMATION",
    pendingApprovalFrom: "PROFESSIONAL",
    createdByRole: "CLIENT",
    createdByUserId: "usr-1",
    rejectionReason: null,
    rejectedByUserId: null,
    rejectedAt: null,
    confirmedAt: null,
    confirmedByUserId: null,
    completedAt: null,
    cancelledAt: null,
    cancelledByUserId: null,
    cancelReason: null,
    clientNotes: null,
    professionalNotes: null,
    createdAt: "2099-12-01T00:00:00.000Z",
    updatedAt: "2099-12-01T00:00:00.000Z",
    client: { id: "cli-1", name: "Cliente", email: "c@test.com" },
    professional: { id: "pro-1", name: "Pro", email: "p@test.com" },
    company: { id: "cmp-1", name: "Empresa" },
    ...overrides,
  };
}

describe("AgendaRow professional permissions", () => {
  it("shows confirm and reject for pending professional approval", () => {
    render(
      <AgendaRow
        {...makeAppointment({
          status: "PENDING_PROFESSIONAL_CONFIRMATION",
          pendingApprovalFrom: "PROFESSIONAL",
        })}
        isMutating={false}
        serviceName="Consulta"
        onConfirm={vi.fn().mockResolvedValue(undefined)}
        onReject={vi.fn().mockResolvedValue(undefined)}
        onComplete={vi.fn().mockResolvedValue(undefined)}
        onNoShow={vi.fn().mockResolvedValue(undefined)}
      />,
    );

    expect(
      screen.getByRole("button", { name: "Confirmar" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Rejeitar" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Concluir" })).toBeNull();
  });

  it("shows complete only when confirmed and appointment already ended", () => {
    render(
      <AgendaRow
        {...makeAppointment({
          date: "2020-01-01",
          startTime: "08:00",
          endTime: "09:00",
          status: "CONFIRMED",
          pendingApprovalFrom: null,
        })}
        isMutating={false}
        serviceName="Consulta"
        onConfirm={vi.fn().mockResolvedValue(undefined)}
        onReject={vi.fn().mockResolvedValue(undefined)}
        onComplete={vi.fn().mockResolvedValue(undefined)}
        onNoShow={vi.fn().mockResolvedValue(undefined)}
      />,
    );

    expect(
      screen.getByRole("button", { name: "Concluir" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Não compareceu" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Confirmar" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Rejeitar" })).toBeNull();
  });

  it("hides actions when pending approval belongs to client", () => {
    render(
      <AgendaRow
        {...makeAppointment({
          status: "PENDING_CLIENT_CONFIRMATION",
          pendingApprovalFrom: "CLIENT",
        })}
        isMutating={false}
        serviceName="Consulta"
        onConfirm={vi.fn().mockResolvedValue(undefined)}
        onReject={vi.fn().mockResolvedValue(undefined)}
        onComplete={vi.fn().mockResolvedValue(undefined)}
        onNoShow={vi.fn().mockResolvedValue(undefined)}
      />,
    );

    expect(screen.queryByRole("button", { name: "Confirmar" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Rejeitar" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Concluir" })).toBeNull();
  });

  it("disables confirm and reject buttons while mutating", () => {
    render(
      <AgendaRow
        {...makeAppointment({
          status: "PENDING_PROFESSIONAL_CONFIRMATION",
          pendingApprovalFrom: "PROFESSIONAL",
        })}
        isMutating
        serviceName="Consulta"
        onConfirm={vi.fn().mockResolvedValue(undefined)}
        onReject={vi.fn().mockResolvedValue(undefined)}
        onComplete={vi.fn().mockResolvedValue(undefined)}
        onNoShow={vi.fn().mockResolvedValue(undefined)}
      />,
    );

    expect(screen.getByRole("button", { name: "Confirmar" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Rejeitar" })).toBeDisabled();
  });

  it("disables complete button while mutating", () => {
    render(
      <AgendaRow
        {...makeAppointment({
          date: "2020-01-01",
          startTime: "08:00",
          endTime: "09:00",
          status: "CONFIRMED",
          pendingApprovalFrom: null,
        })}
        isMutating
        serviceName="Consulta"
        onConfirm={vi.fn().mockResolvedValue(undefined)}
        onReject={vi.fn().mockResolvedValue(undefined)}
        onComplete={vi.fn().mockResolvedValue(undefined)}
        onNoShow={vi.fn().mockResolvedValue(undefined)}
      />,
    );

    expect(screen.getByRole("button", { name: "Concluir" })).toBeDisabled();
  });

  it("calls callbacks when professional clicks actions", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn().mockResolvedValue(undefined);
    const onReject = vi.fn().mockResolvedValue(undefined);

    render(
      <AgendaRow
        {...makeAppointment({
          status: "PENDING_PROFESSIONAL_CONFIRMATION",
          pendingApprovalFrom: "PROFESSIONAL",
        })}
        isMutating={false}
        serviceName="Consulta"
        onConfirm={onConfirm}
        onReject={onReject}
        onComplete={vi.fn().mockResolvedValue(undefined)}
        onNoShow={vi.fn().mockResolvedValue(undefined)}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Confirmar" }));
    await user.click(screen.getByRole("button", { name: "Rejeitar" }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onReject).toHaveBeenCalledTimes(1);
  });

  it("calls no-show callback when clicking não compareceu", async () => {
    const user = userEvent.setup();
    const onNoShow = vi.fn().mockResolvedValue(undefined);

    render(
      <AgendaRow
        {...makeAppointment({
          date: "2020-01-01",
          startTime: "08:00",
          endTime: "09:00",
          status: "CONFIRMED",
          pendingApprovalFrom: null,
        })}
        isMutating={false}
        serviceName="Consulta"
        onConfirm={vi.fn().mockResolvedValue(undefined)}
        onReject={vi.fn().mockResolvedValue(undefined)}
        onComplete={vi.fn().mockResolvedValue(undefined)}
        onNoShow={onNoShow}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Não compareceu" }));

    expect(onNoShow).toHaveBeenCalledTimes(1);
  });
});
