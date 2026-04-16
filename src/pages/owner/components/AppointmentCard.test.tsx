import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Appointment } from "../../../types/booking";
import { AppointmentCard } from "./AppointmentCard";

const mocks = vi.hoisted(() => ({
	cancelAppointment: vi.fn(),
	rejectAppointment: vi.fn(),
	updateAppointmentStatus: vi.fn(),
	handleApiError: vi.fn(() => ({ type: "serverError", message: "erro" })),
}));

vi.mock("../../../services/api/appointments", () => ({
	cancelAppointment: mocks.cancelAppointment,
	rejectAppointment: mocks.rejectAppointment,
	updateAppointmentStatus: mocks.updateAppointmentStatus,
}));

vi.mock("../../../hooks/useApiError", () => ({
	useApiError: () => mocks.handleApiError,
}));

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
		status: "PENDING_CLIENT_CONFIRMATION",
		pendingApprovalFrom: "CLIENT",
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

describe("AppointmentCard owner actions", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mocks.cancelAppointment.mockResolvedValue({});
		mocks.rejectAppointment.mockResolvedValue({});
		mocks.updateAppointmentStatus.mockResolvedValue({});
	});

	it("shows owner transitions for pending approvals", () => {
		render(
			<AppointmentCard
				appointment={makeAppointment({ status: "PENDING_CLIENT_CONFIRMATION" })}
				serviceName="Consulta"
				onRefresh={vi.fn()}
			/>,
		);

		expect(
			screen.getByRole("button", { name: "Confirmar" }),
		).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: "Rejeitar" }),
		).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: "Cancelar agendamento" }),
		).toBeInTheDocument();
	});

	it("calls status patch when confirming transition", async () => {
		const onRefresh = vi.fn();
		const user = userEvent.setup();

		render(
			<AppointmentCard
				appointment={makeAppointment({
					status: "PENDING_PROFESSIONAL_CONFIRMATION",
				})}
				serviceName="Consulta"
				onRefresh={onRefresh}
			/>,
		);

		await user.click(screen.getByRole("button", { name: "Confirmar" }));

		expect(mocks.updateAppointmentStatus).toHaveBeenCalledWith(
			"apt-1",
			"CONFIRMED",
		);
		expect(onRefresh).toHaveBeenCalled();
	});

	it("calls reject endpoint with optional reason", async () => {
		const onRefresh = vi.fn();
		const user = userEvent.setup();
		vi.spyOn(window, "prompt").mockReturnValue("Motivo teste");

		render(
			<AppointmentCard
				appointment={makeAppointment({ status: "PENDING_CLIENT_CONFIRMATION" })}
				serviceName="Consulta"
				onRefresh={onRefresh}
			/>,
		);

		await user.click(screen.getByRole("button", { name: "Rejeitar" }));

		expect(mocks.rejectAppointment).toHaveBeenCalledWith(
			"apt-1",
			"Motivo teste",
		);
		expect(onRefresh).toHaveBeenCalled();
	});

	it("cancels after confirmation prompt step", async () => {
		const onRefresh = vi.fn();
		const user = userEvent.setup();

		render(
			<AppointmentCard
				appointment={makeAppointment({
					status: "CONFIRMED",
					pendingApprovalFrom: null,
				})}
				serviceName="Consulta"
				onRefresh={onRefresh}
			/>,
		);

		await user.click(
			screen.getByRole("button", { name: "Cancelar agendamento" }),
		);
		await user.click(screen.getByRole("button", { name: "Sim, cancelar" }));

		expect(mocks.cancelAppointment).toHaveBeenCalledWith("apt-1");
		expect(onRefresh).toHaveBeenCalled();
	});

	it("hides action buttons for terminal statuses", () => {
		render(
			<AppointmentCard
				appointment={makeAppointment({
					status: "COMPLETED",
					pendingApprovalFrom: null,
				})}
				serviceName="Consulta"
				onRefresh={vi.fn()}
			/>,
		);

		expect(screen.queryByRole("button", { name: "Confirmar" })).toBeNull();
		expect(screen.queryByRole("button", { name: "Rejeitar" })).toBeNull();
		expect(
			screen.queryByRole("button", { name: "Cancelar agendamento" }),
		).toBeNull();
	});

	it("shows API error message when confirm transition fails", async () => {
		const user = userEvent.setup();
		mocks.updateAppointmentStatus.mockRejectedValue(new Error("Falha"));
		mocks.handleApiError.mockReturnValueOnce({
			type: "serverError",
			message: "Não foi possível confirmar",
		});

		render(
			<AppointmentCard
				appointment={makeAppointment({ status: "PENDING_CLIENT_CONFIRMATION" })}
				serviceName="Consulta"
				onRefresh={vi.fn()}
			/>,
		);

		await user.click(screen.getByRole("button", { name: "Confirmar" }));

		expect(screen.getByText("Não foi possível confirmar")).toBeInTheDocument();
	});

	it("keeps action buttons disabled while transition is in progress", async () => {
		let resolveAction!: () => void;
		const pendingAction = new Promise<void>((resolve) => {
			resolveAction = resolve;
		});

		mocks.updateAppointmentStatus.mockReturnValueOnce(pendingAction);

		const user = userEvent.setup();

		render(
			<AppointmentCard
				appointment={makeAppointment({ status: "PENDING_CLIENT_CONFIRMATION" })}
				serviceName="Consulta"
				onRefresh={vi.fn()}
			/>,
		);

		const confirmButton = screen.getByRole("button", { name: "Confirmar" });
		const rejectButton = screen.getByRole("button", { name: "Rejeitar" });
		const cancelButton = screen.getByRole("button", {
			name: "Cancelar agendamento",
		});

		await user.click(confirmButton);

		expect(confirmButton).toBeDisabled();
		expect(rejectButton).toBeDisabled();
		expect(cancelButton).toBeDisabled();

		resolveAction();
	});

	it("sends undefined rejection reason when prompt is cancelled", async () => {
		const onRefresh = vi.fn();
		const user = userEvent.setup();
		vi.spyOn(window, "prompt").mockReturnValue(null);

		render(
			<AppointmentCard
				appointment={makeAppointment({ status: "PENDING_CLIENT_CONFIRMATION" })}
				serviceName="Consulta"
				onRefresh={onRefresh}
			/>,
		);

		await user.click(screen.getByRole("button", { name: "Rejeitar" }));

		expect(mocks.rejectAppointment).toHaveBeenCalledWith("apt-1", undefined);
		expect(onRefresh).toHaveBeenCalled();
	});
});
