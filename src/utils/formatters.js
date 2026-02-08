import { DENOMINATIONS, COIN_DENOMS } from "./constants";
export { regLabel } from "./constants";

export const fmt = (n) => new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n || 0);
export const fmtDate = (d) => new Date(d).toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" });
export const fmtTime = (d) => new Date(d).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
export const uid = () => (crypto?.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2, 10));
export const todayStr = () => new Date().toISOString().split("T")[0];

export const calcBillTotal = (bills) => DENOMINATIONS.reduce((t, d) => t + (bills[d] || 0) * d, 0);
export const calcCoinTotal = (coins) => COIN_DENOMS.reduce((t, d) => t + (coins[d] || 0) * d, 0);
