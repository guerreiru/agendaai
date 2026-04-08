export type ProfessionalServiceLink = {
	id: string;
	professionalId: string;
	serviceId: string;
	price: number;
	isActive: boolean;
};

export type ProfessionalUser = {
	id: string;
	name: string;
	displayName: string;
	email: string;
	phone: string | null;
	role: "PROFESSIONAL";
	companyId: string;
	professionalServices?: ProfessionalServiceLink[];
};

export type CreateProfessionalPayload = {
	name: string;
	displayName: string;
	email: string;
	password: string;
	role: "PROFESSIONAL";
	companyId: string;
	phone?: string;
};

export type UpdateProfessionalPayload = {
	name?: string;
	displayName?: string;
	email?: string;
	phone?: string | null;
	password?: string;
};

export type CreateProfessionalServicePayload = {
	professionalId: string;
	serviceId: string;
	price: number;
	isActive?: boolean;
};

export type UpdateProfessionalServicePayload = {
	price?: number;
	isActive?: boolean;
	professionalId?: string;
	serviceId?: string;
};
