export const calcCashFlows = (moves) => {
    const ingEfvo = moves.filter(m => m.type === "ingreso" && m.method === "efectivo").reduce((s, m) => s + m.amount, 0);
    const egrEfvo = moves.filter(m => m.type === "egreso" && m.method === "efectivo").reduce((s, m) => s + m.amount, 0);
    const ingTotal = moves.filter(m => m.type === "ingreso").reduce((s, m) => s + m.amount, 0);
    const egrTotal = moves.filter(m => m.type === "egreso").reduce((s, m) => s + m.amount, 0);
    return { ingEfvo, egrEfvo, ingTotal, egrTotal };
};

export { calcBillTotal, calcCoinTotal } from "./formatters";

export const calcExpectedCash = (openingAmount, moves) => {
    const { ingEfvo, egrEfvo } = calcCashFlows(moves);
    return openingAmount + ingEfvo - egrEfvo;
};

export const getClosingAvailable = (closing) => Math.max(0, (closing.montoRetirado || 0) - (closing.transferredOut || 0) - (closing.adminWithdrawn || 0));
