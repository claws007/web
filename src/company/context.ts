const activeCompanyStorageKey = "agents-studio.active-company-id";

export function readStoredActiveCompanyId() {
	if (!hasWindow()) {
		return null;
	}

	const rawValue = window.localStorage.getItem(activeCompanyStorageKey);
	if (!rawValue) {
		return null;
	}

	const companyId = Number(rawValue);
	if (!Number.isInteger(companyId) || companyId <= 0) {
		clearStoredActiveCompanyId();
		return null;
	}

	return companyId;
}

export function writeStoredActiveCompanyId(companyId: number) {
	if (!hasWindow()) {
		return;
	}

	window.localStorage.setItem(activeCompanyStorageKey, String(companyId));
}

export function clearStoredActiveCompanyId() {
	if (!hasWindow()) {
		return;
	}

	window.localStorage.removeItem(activeCompanyStorageKey);
}

function hasWindow() {
	return typeof window !== "undefined";
}
