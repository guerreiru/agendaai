import { describe, expect, it } from "vitest";
import type { AppointmentStatus } from "../../../types/booking";
import { getSafeTransitions } from "./constants";

describe("owner appointment transitions", () => {
	it("returns expected transitions for each appointment status", () => {
		const cases: Record<AppointmentStatus, AppointmentStatus[]> = {
			SCHEDULED: ["CONFIRMED"],
			PENDING_CLIENT_CONFIRMATION: ["CONFIRMED", "REJECTED"],
			PENDING_PROFESSIONAL_CONFIRMATION: ["CONFIRMED", "REJECTED"],
			CONFIRMED: ["COMPLETED", "NO_SHOW"],
			CANCELLED: [],
			COMPLETED: [],
			NO_SHOW: [],
			REJECTED: [],
		};

		for (const [status, expected] of Object.entries(cases)) {
			expect(getSafeTransitions(status as AppointmentStatus)).toEqual(expected);
		}
	});
});
