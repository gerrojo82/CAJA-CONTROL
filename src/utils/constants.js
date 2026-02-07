export const DENOMINATIONS = [20000, 10000, 5000, 2000, 1000, 500, 200, 100, 50, 20, 10];
export const COIN_DENOMS = [500, 200, 100, 50, 25, 10, 5, 2, 1];
export const METHODS = ["efectivo", "transferencia", "tarjeta", "cheque", "MercadoPago"];
export const EXPENSE_TYPES = ["Proveedor", "Ticket", "Otros"];

export const STORES = [
  { id: "callao", name: "Callao", icon: "🏪" },
  { id: "urquiza", name: "Urquiza", icon: "🏬" },
];

export const REGISTERS_PER_STORE = [
  { id: "caja1", name: "Caja 1" },
  { id: "caja2", name: "Caja 2" },
];

export const SHIFTS = ["mañana", "tarde"];

export const DEFAULT_PIN = "1234";

// Full register ID includes store
export const fullRegId = (storeId, regId) => `${storeId}_${regId}`;

export const regLabel = (storeId, regId) => {
  const store = STORES.find(s => s.id === storeId);
  const reg = REGISTERS_PER_STORE.find(r => r.id === regId);
  return `${store?.name || storeId} — ${reg?.name || regId}`;
};
