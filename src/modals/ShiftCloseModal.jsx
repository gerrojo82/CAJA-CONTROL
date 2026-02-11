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
    const [showConfirm, setShowConfirm] = useState(false);
    const [confirmed, setConfirmed] = useState(false);
    const [notes, setNotes] = useState("");

    const total = calcBillTotal(bills) + calcCoinTotal(coins);
    const expected = shiftData ? calcExpectedCash(shiftData.openingAmount, moves) : 0;
    const { ingEfvo, egrEfvo, ingTotal, egrTotal } = calcCashFlows(moves);
    const diff = total - expected;
    const hasLargeDiff = Math.abs(diff) > 1000;

    const handleClose = async () => {
        if (!showConfirm) {
            setShowConfirm(true);
            return;
        }

        if (!confirmed) {
            alert("Por favor confirmá que contaste todo el efectivo");
            return;
        }

        setSubmitting(true);
        try {
            await onConfirm(bills, coins, notes);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Modal title="Cerrar Turno" onClose={onClose} wide>
            {/* Resumen rápido del turno (#4) */}
            <div style={{ padding: 12, borderRadius: 10, background: "#f8fafc", border: "1px solid #e2e8f0", marginBottom: 10 }}>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8 }}>📊 Resumen del turno:</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, fontSize: 12 }}>
                    <div>
                        <span style={{ color: "#64748b" }}>Apertura:</span>{" "}
                        <span style={{ fontWeight: 600 }}>{fmt(shiftData?.openingAmount || 0)}</span>
                    </div>
                    <div>
                        <span style={{ color: "#64748b" }}>Movimientos:</span>{" "}
                        <span style={{ fontWeight: 600 }}>{moves.length}</span>
                    </div>
                    <div>
                        <span style={{ color: "#64748b" }}>Ventas (efectivo):</span>{" "}
                        <span style={{ fontWeight: 600, color: "#16a34a" }}>+{fmt(ingEfvo)}</span>
                    </div>
                    <div>
                        <span style={{ color: "#64748b" }}>Ventas (total):</span>{" "}
                        <span style={{ fontWeight: 600, color: "#059669" }}>+{fmt(ingTotal)}</span>
                    </div>
                    <div>
                        <span style={{ color: "#64748b" }}>Pagos (efectivo):</span>{" "}
                        <span style={{ fontWeight: 600, color: "#dc2626" }}>-{fmt(egrEfvo)}</span>
                    </div>
                    <div>
                        <span style={{ color: "#64748b" }}>Pagos (total):</span>{" "}
                        <span style={{ fontWeight: 600, color: "#b91c1c" }}>-{fmt(egrTotal)}</span>
                    </div>
                </div>
            </div>

            <div style={{ padding: 12, borderRadius: 10, background: "#f0f9ff", border: "1px solid #bae6fd", marginBottom: 10, fontSize: 13 }}>
                <div style={{ fontWeight: 700, marginBottom: 4 }}>Esperado en caja:</div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>{fmt(shiftData?.openingAmount || 0)} + {fmt(ingEfvo)} − {fmt(egrEfvo)}</div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 20, fontWeight: 900, marginTop: 4 }}>{fmt(expected)}</div>
            </div>

            <p style={S.modalHint}>Contá todo el efectivo.</p>
            <BillCounter bills={bills} setBills={setBills} coins={coins} setCoins={setCoins} />

            {total > 0 && (
                <>
                    <div style={{
                        padding: 12, borderRadius: 10, fontWeight: 800, fontSize: 15, textAlign: "center", marginTop: 10, fontFamily: "'JetBrains Mono', monospace",
                        background: diff === 0 ? "#dcfce7" : diff > 0 ? "#dbeafe" : "#fee2e2", color: diff === 0 ? "#16a34a" : diff > 0 ? "#2563eb" : "#dc2626"
                    }}>
                        {diff === 0 ? "✓ Cuadra" : diff > 0 ? `+${fmt(diff)} sobrante` : `${fmt(diff)} FALTANTE`}
                        <div style={{ fontSize: 12, fontWeight: 600, marginTop: 4, opacity: 0.8 }}>Retiro: {fmt(Math.max(0, total - (shiftData?.openingAmount || 0)))}</div>
                    </div>

                    {/* Alerta de diferencia grande (#2) */}
                    {hasLargeDiff && (
                        <div style={{ padding: 10, borderRadius: 8, background: "#fef2f2", border: "1px solid #fecaca", marginTop: 10, fontSize: 13, color: "#991b1b" }}>
                            ⚠️ Diferencia mayor a $1,000. Verificá el conteo antes de confirmar.
                        </div>
                    )}

                    {/* Campo de notas (#8) */}
                    {showConfirm && (
                        <div style={{ marginTop: 12 }}>
                            <label style={{ ...S.formLabel, marginBottom: 6 }}>Comentarios (opcional)</label>
                            <textarea
                                style={{ ...S.formInput, minHeight: 60, fontFamily: "inherit", resize: "vertical" }}
                                placeholder="Agregá una nota sobre este cierre (ej: diferencia por ticket perdido)..."
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                            />
                        </div>
                    )}

                    {/* Confirmación (#2) */}
                    {showConfirm && (
                        <div style={{ marginTop: 12, padding: 12, borderRadius: 8, background: "#fefce8", border: "1px solid #fde047" }}>
                            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13 }}>
                                <input
                                    type="checkbox"
                                    checked={confirmed}
                                    onChange={(e) => setConfirmed(e.target.checked)}
                                    style={{ width: 18, height: 18, cursor: "pointer" }}
                                />
                                <span style={{ fontWeight: 600 }}>Confirmo que conté todo el efectivo y verifiqué el monto</span>
                            </label>
                        </div>
                    )}
                </>
            )}

            <button
                style={{ ...S.btnSubmit, background: diff < 0 ? "#dc2626" : "#0f172a", opacity: submitting ? 0.7 : 1 }}
                onClick={handleClose}
                disabled={submitting || total === 0 || (showConfirm && !confirmed)}
            >
                {showConfirm ? "✓ Confirmar Cierre" : "Continuar →"}
            </button>
        </Modal>
    );
}
