export type DashboardAppointment = {
	id: string;
	date: string;
	startTime: string;
	endTime: string;
	status:
		| "SCHEDULED"
		| "PENDING_CLIENT_CONFIRMATION"
		| "PENDING_PROFESSIONAL_CONFIRMATION"
		| "CONFIRMED";
	service: {
		id: string;
		name: string;
	};
	professional: {
		id: string;
		name: string;
		displayName: string | null;
	};
	client: {
		id: string;
		name: string;
	};
	price: number;
};

export type CompanyDashboardResponse = {
	companyId: string;
	serviceCount: number;
	professionalCount: number;
	todayAppointmentsCount: number;
	monthRevenue: number;
	nextAppointments: DashboardAppointment[];
};

export type ProfessionalDashboardResponse = {
	professionalId: string;
	activeServiceCount: number;
	todayAppointmentsCount: number;
	monthRevenue: number;
};
