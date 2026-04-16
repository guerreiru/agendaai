import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Appointment } from "../../../types/booking";
import { AppointmentCard } from "./AppointmentCard";

const mocks = vi.hoisted(() => ({
	cancelAppointment: vi.fn(),
	confirmAppointment: vi.fn(),
	rejectAppointment: vi.fn(),
}));

vi.mock("../../../services/api/appointments", () => ({
	cancelAppointment: mocks.cancelAppointment,
	confirmAppointment: mocks.confirmAppointment,
	rejectAppointment: mocks.rejectAppointment,
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

describe("Client AppointmentCard permissions", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mocks.confirmAppointment.mockResolvedValue({});
		mocks.rejectAppointment.mockResolvedValue({});
		mocks.cancelAppointment.mockResolvedValue({});
	});

	it("shows confirm and reject only when pending approval is from client", () => {
		render(
			<AppointmentCard
				appointment={makeAppointment({
					status: "PENDING_CLIENT_CONFIRMATION",
					pendingApprovalFrom: "CLIENT",
				})}
				onAction={vi.fn()}
			/>,
		);

		expect(
			screen.getByRole("button", { name: "Confirmar" }),
		).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: "Rejeitar" }),
		).toBeInTheDocument();
	});

	it("hides confirm and reject when pending approval is from professional", () => {
		render(
			<AppointmentCard
				appointment={makeAppointment({
					status: "PENDING_PROFESSIONAL_CONFIRMATION",
					pendingApprovalFrom: "PROFESSIONAL",
				})}
				onAction={vi.fn()}
			/>,
		);

		expect(screen.queryByRole("button", { name: "Confirmar" })).toBeNull();
		expect(screen.queryByRole("button", { name: "Rejeitar" })).toBeNull();
	});

	it("does not render confirm and reject in final statuses", () => {
		render(
			<AppointmentCard
				appointment={makeAppointment({
					status: "COMPLETED",
					pendingApprovalFrom: null,
				})}
				onAction={vi.fn()}
			/>,
		);

		expect(screen.queryByRole("button", { name: "Confirmar" })).toBeNull();
		expect(screen.queryByRole("button", { name: "Rejeitar" })).toBeNull();
	});

	it("calls confirm API when allowed", async () => {
		const user = userEvent.setup();
		const onAction = vi.fn();

		render(
			<AppointmentCard
				appointment={makeAppointment({
					status: "PENDING_CLIENT_CONFIRMATION",
					pendingApprovalFrom: "CLIENT",
				})}
				onAction={onAction}
			/>,
		);

		await user.click(screen.getByRole("button", { name: "Confirmar" }));

		expect(mocks.confirmAppointment).toHaveBeenCalledWith("apt-1");
		expect(onAction).toHaveBeenCalled();
	});
});
