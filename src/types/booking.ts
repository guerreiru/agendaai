// Public booking types

export type BookingService = {
	id: string;
	name: string;
	description: string | null;
	duration: number; // minutes
};

export type BookingProfessional = {
	id: string;
	name: string;
	displayName: string;
};

export type CompanyPublicData = {
	id: string;
	name: string;
	slug: string;
	timezone: string;
	services: BookingService[];
	professionals: BookingProfessional[];
};

export type ProfessionalServiceLink = {
	id: string;
	professionalId: string;
	serviceId: string;
	price: number;
	isActive: boolean;
};

export type TimeSlot = {
	startTime: string; // HH:mm
	endTime: string; // HH:mm
};

export type AppointmentStatus =
	| "SCHEDULED"
	| "PENDING_CLIENT_CONFIRMATION"
	| "PENDING_PROFESSIONAL_CONFIRMATION"
	| "CONFIRMED"
	| "CANCELLED"
	| "COMPLETED"
	| "NO_SHOW"
	| "REJECTED";

export type Appointment = {
	id: string;
	companyId: string;
	clientId: string;
	professionalId: string;
	serviceId: string;
	date: string;
	startTime: string;
	endTime: string;
	price: number;
	status: AppointmentStatus;
	pendingApprovalFrom: "PROFESSIONAL" | "CLIENT" | null;
	createdByRole: "CLIENT" | "PROFESSIONAL" | "COMPANY_OWNER" | "ADMIN";
	createdByUserId: string;
	rejectionReason: string | null;
	rejectedByUserId: string | null;
	rejectedAt: string | null;
	confirmedAt: string | null;
	confirmedByUserId: string | null;
	completedAt: string | null;
	cancelledAt: string | null;
	cancelledByUserId: string | null;
	cancelReason: string | null;
	clientNotes: string | null;
	professionalNotes: string | null;
	createdAt: string;
	updatedAt: string;
	client: {
		id: string;
		name: string;
		email: string;
	};
	professional: {
		id: string;
		name: string;
		email: string;
	};
	company: {
		id: string;
		name: string;
	};
};

export type CreateAppointmentPayload = {
	companyId: string;
	clientId: string;
	professionalId: string;
	serviceId: string;
	date: string; // ISO date
	startTime: string;
	endTime: string;
};

// Wizard state
export type BookingWizardState = {
	// Step 1
	company: CompanyPublicData | null;

	// Step 2
	selectedService: BookingService | null;
	selectedServicePrice: number | null;

	// Step 3
	selectedProfessional: BookingProfessional | null;

	// Step 4
	selectedDate: string | null; // YYYY-MM-DD

	// Step 5
	selectedSlot: TimeSlot | null;

	// Step 6
	user: {
		id: string;
		name: string;
		email: string;
		accessToken: string;
	} | null;
};
