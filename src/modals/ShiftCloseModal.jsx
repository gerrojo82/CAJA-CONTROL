import { useState } from "react";
import Modal from "../components/Modal";
import BillCounter from "../components/BillCounter";
import { calcBillTotal, calcCoinTotal, fmt } from "../utils/formatters";
import { calcExpectedCash, calcCashFlows } from "../utils/helpers";
import { S } from "../styles/styles";

export default function ShiftCloseModal({ data, shiftData, moves, onConfirm, onClose }) {
    const [bills, setBills] = useState({});
    const [coins, setCoins] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const total = calcBillTotal(bills) + calcCoinTotal(coins);
    const expected = shiftData ? calcExpectedCash(shiftData.openingAmount, moves) : 0;
    const { ingEfvo, egrEfvo } = calcCashFlows(moves);
    const diff = total - expected;

    return (
        <Modal title="Cerrar Turno" onClose={onClose} wide>
            <div style={{ padding: 12, borderRadius: 10, background: "#f0f9ff", border: "1px solid #bae6fd", marginBottom: 10, fontSize: 13 }}>
                <div style={{ fontWeight: 700, marginBottom: 4 }}>Esperado en caja:</div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>{fmt(shiftData?.openingAmount || 0)} + {fmt(ingEfvo)} − {fmt(egrEfvo)}</div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 20, fontWeight: 900, marginTop: 4 }}>{fmt(expected)}</div>
            </div>
            <p style={S.modalHint}>Contá todo el efectivo.</p>
            <BillCounter bills={bills} setBills={setBills} coins={coins} setCoins={setCoins} />
            {total > 0 && (
                <div style={{
                    padding: 12, borderRadius: 10, fontWeight: 800, fontSize: 15, textAlign: "center", marginTop: 10, fontFamily: "'JetBrains Mono', monospace",
                    background: diff === 0 ? "#dcfce7" : diff > 0 ? "#dbeafe" : "#fee2e2", color: diff === 0 ? "#16a34a" : diff > 0 ? "#2563eb" : "#dc2626"
                }}>
                    {diff === 0 ? "✓ Cuadra" : diff > 0 ? `+${fmt(diff)} sobrante` : `${fmt(diff)} FALTANTE`}
                    <div style={{ fontSize: 12, fontWeight: 600, marginTop: 4, opacity: 0.8 }}>Retiro: {fmt(Math.max(0, total - (shiftData?.openingAmount || 0)))}</div>
                </div>
            )}
            <button style={{ ...S.btnSubmit, background: diff < 0 ? "#dc2626" : "#0f172a", opacity: submitting ? 0.7 : 1 }}
                onClick={async () => { setSubmitting(true); try { await onConfirm(bills, coins); } finally { setSubmitting(false); } }}
                disabled={submitting || total === 0}>Confirmar Cierre</button>
        </Modal>
    );
}
