import { useCallback, useEffect, useState } from "react";

const TOAST_DURATION_MS = 3500;

export function useToast() {
	const [toast, setToast] = useState<string | null>(null);

	useEffect(() => {
		if (!toast) {
			return;
		}
		const timeout = setTimeout(() => setToast(null), TOAST_DURATION_MS);
		return () => clearTimeout(timeout);
	}, [toast]);

	const showToast = useCallback((message: string) => {
		setToast(message);
	}, []);

	return { toast, showToast };
}
