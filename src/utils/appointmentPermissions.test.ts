import { describe, expect, it } from "vitest";
import type { Appointment } from "../types/booking";
import {
	canConfirmAppointment,
	canRejectAppointment,
} from "./appointmentPermissions";

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

describe("appointment decision permissions", () => {
	it("blocks COMPANY_OWNER from confirming and rejecting pending appointments", () => {
		const pendingClient = makeAppointment({
			status: "PENDING_CLIENT_CONFIRMATION",
			pendingApprovalFrom: "CLIENT",
		});
		const pendingProfessional = makeAppointment({
			status: "PENDING_PROFESSIONAL_CONFIRMATION",
			pendingApprovalFrom: "PROFESSIONAL",
		});

		expect(canConfirmAppointment("COMPANY_OWNER", pendingClient)).toBe(false);
		expect(canRejectAppointment("COMPANY_OWNER", pendingClient)).toBe(false);
		expect(canConfirmAppointment("COMPANY_OWNER", pendingProfessional)).toBe(
			false,
		);
		expect(canRejectAppointment("COMPANY_OWNER", pendingProfessional)).toBe(
			false,
		);
	});

	it("allows CLIENT only when pendingApprovalFrom is CLIENT", () => {
		const pendingClient = makeAppointment({
			status: "PENDING_CLIENT_CONFIRMATION",
			pendingApprovalFrom: "CLIENT",
		});
		const pendingProfessional = makeAppointment({
			status: "PENDING_PROFESSIONAL_CONFIRMATION",
			pendingApprovalFrom: "PROFESSIONAL",
		});

		expect(canConfirmAppointment("CLIENT", pendingClient)).toBe(true);
		expect(canRejectAppointment("CLIENT", pendingClient)).toBe(true);
		expect(canConfirmAppointment("CLIENT", pendingProfessional)).toBe(false);
		expect(canRejectAppointment("CLIENT", pendingProfessional)).toBe(false);
	});

	it("allows PROFESSIONAL only when pendingApprovalFrom is PROFESSIONAL", () => {
		const pendingClient = makeAppointment({
			status: "PENDING_CLIENT_CONFIRMATION",
			pendingApprovalFrom: "CLIENT",
		});
		const pendingProfessional = makeAppointment({
			status: "PENDING_PROFESSIONAL_CONFIRMATION",
			pendingApprovalFrom: "PROFESSIONAL",
		});

		expect(canConfirmAppointment("PROFESSIONAL", pendingProfessional)).toBe(
			true,
		);
		expect(canRejectAppointment("PROFESSIONAL", pendingProfessional)).toBe(
			true,
		);
		expect(canConfirmAppointment("PROFESSIONAL", pendingClient)).toBe(false);
		expect(canRejectAppointment("PROFESSIONAL", pendingClient)).toBe(false);
	});

	it("does not allow confirm or reject in final statuses", () => {
		const finalStatuses: Appointment["status"][] = [
			"CONFIRMED",
			"REJECTED",
			"CANCELLED",
			"COMPLETED",
			"NO_SHOW",
		];

		for (const status of finalStatuses) {
			const appointment = makeAppointment({
				status,
				pendingApprovalFrom: null,
			});
			expect(canConfirmAppointment("CLIENT", appointment)).toBe(false);
			expect(canRejectAppointment("CLIENT", appointment)).toBe(false);
			expect(canConfirmAppointment("PROFESSIONAL", appointment)).toBe(false);
			expect(canRejectAppointment("PROFESSIONAL", appointment)).toBe(false);
		}
	});

	it("keeps admin behavior unchanged for pending confirmations", () => {
		const pendingClient = makeAppointment({
			status: "PENDING_CLIENT_CONFIRMATION",
			pendingApprovalFrom: "CLIENT",
		});
		const pendingProfessional = makeAppointment({
			status: "PENDING_PROFESSIONAL_CONFIRMATION",
			pendingApprovalFrom: "PROFESSIONAL",
		});

		expect(canConfirmAppointment("ADMIN", pendingClient)).toBe(true);
		expect(canRejectAppointment("ADMIN", pendingClient)).toBe(true);
		expect(canConfirmAppointment("SUPER_ADMIN", pendingProfessional)).toBe(
			true,
		);
		expect(canRejectAppointment("SUPER_ADMIN", pendingProfessional)).toBe(true);
	});
});
