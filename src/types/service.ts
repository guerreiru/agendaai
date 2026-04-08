export type Service = {
	id: string;
	companyId: string;
	name: string;
	duration: number;
	description: string | null;
	createdAt?: string;
	updatedAt?: string;
};

export type UpsertServicePayload = {
	companyId: string;
	name: string;
	duration: number;
	description: string | null;
};
