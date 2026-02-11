import { DENOMINATIONS, COIN_DENOMS } from "./constants";
export { regLabel } from "./constants";

export const fmt = (n) => new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n || 0);
const toDate = (d) => {
	if (!d) return null;
	// Especificar zona horaria de Argentina para consistencia
	if (typeof d === "string" && d.length === 10) {
		return new Date(`${d}T00:00:00-03:00`);
	}
	return new Date(d);
};

export const fmtDate = (d) => {
	const dt = toDate(d);
	if (!dt || Number.isNaN(dt.getTime())) return "";
	return dt.toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" });
};

export const fmtTime = (d) => {
	const dt = toDate(d);
	if (!dt || Number.isNaN(dt.getTime())) return "";
	return dt.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
};
export const uid = () => (crypto?.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2, 10));
export const todayStr = () => {
	// Usar zona horaria de Argentina (GMT-3) para evitar desfases
	const d = new Date();
	const argDate = new Date(d.toLocaleString("en-US", { timeZone: "America/Argentina/Buenos_Aires" }));
	const yyyy = argDate.getFullYear();
	const mm = String(argDate.getMonth() + 1).padStart(2, "0");
	const dd = String(argDate.getDate()).padStart(2, "0");
	return `${yyyy}-${mm}-${dd}`;
};

export const calcBillTotal = (bills) => DENOMINATIONS.reduce((t, d) => t + (bills[d] || 0) * d, 0);
export const calcCoinTotal = (coins) => COIN_DENOMS.reduce((t, d) => t + (coins[d] || 0) * d, 0);

// Genera timestamp ISO con zona horaria de Argentina
export const nowISO = () => {
	const d = new Date();
	const argDate = new Date(d.toLocaleString("en-US", { timeZone: "America/Argentina/Buenos_Aires" }));
	return argDate.toISOString();
};
