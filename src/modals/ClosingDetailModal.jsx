import Modal from "../components/Modal";
import { fmt, fmtTime, regLabel } from "../utils/formatters";
import { getClosingAvailable } from "../utils/helpers";
import { S } from "../styles/styles";

export default function ClosingDetailModal({ data: c, onClose, onWithdraw }) {
    const available = getClosingAvailable(c);
    return (
        <Modal title="Detalle Cierre" onClose={onClose} wide>
            <div style={{ padding: 8, borderRadius: 6, background: "#f0f9ff", border: "1px solid #bae6fd", marginBottom: 12, fontSize: 11, fontFamily: "'JetBrains Mono', monospace" }}>
                {fmt(c.openingAmount)} + {fmt(c.ingresosEfectivo)} − {fmt(c.egresosEfectivo)} = <strong>{fmt(c.expectedCash)}</strong>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 14px", fontSize: 13 }}>
                <div><span style={{ fontSize: 10, color: "#94a3b8" }}>Caja</span><br />{regLabel(c.storeId, c.registerId)}</div>
                <div><span style={{ fontSize: 10, color: "#94a3b8" }}>Turno</span><br /><span style={{ textTransform: "capitalize" }}>{c.shift}</span></div>
                <div><span style={{ fontSize: 10, color: "#94a3b8" }}>Cerrado por</span><br />{c.closedBy} — {fmtTime(c.closedAt)}</div>
                <div><span style={{ fontSize: 10, color: "#94a3b8" }}>Fondo</span><br />{fmt(c.openingAmount)}</div>
                <div><span style={{ fontSize: 10, color: "#94a3b8" }}>Esperado</span><br /><strong>{fmt(c.expectedCash)}</strong></div>
                <div><span style={{ fontSize: 10, color: "#94a3b8" }}>Contado</span><br /><strong>{fmt(c.countedCash)}</strong></div>
                <div><span style={{ fontSize: 10, color: "#94a3b8" }}>Diferencia</span><br /><strong style={{ color: c.difference === 0 ? "#16a34a" : "#dc2626", fontSize: 16 }}>{c.difference === 0 ? "✓ $0" : fmt(c.difference)}</strong></div>
                <div><span style={{ fontSize: 10, color: "#94a3b8" }}>Retirado</span><br /><strong>{fmt(c.montoRetirado)}</strong></div>
                <div><span style={{ fontSize: 10, color: "#94a3b8" }}>Retiro admin</span><br /><strong>{fmt(c.adminWithdrawn || 0)}</strong></div>
                <div><span style={{ fontSize: 10, color: "#94a3b8" }}>Disponible</span><br /><strong style={{ color: available > 0 ? "#16a34a" : "#64748b" }}>{fmt(available)}</strong></div>
            </div>

            <button style={{ ...S.btnSubmit, background: available > 0 ? "#0f172a" : "#94a3b8" }} onClick={onWithdraw} disabled={available <= 0}>
                Retirar fondos
            </button>
            {available <= 0 && <div style={{ marginTop: 6, fontSize: 11, color: "#94a3b8" }}>Sin disponible para retirar</div>}

            {c.adminWithdrawals?.length > 0 && <>
                <div style={{ fontSize: 14, fontWeight: 800, margin: "14px 0 6px" }}>Retiros admin ({c.adminWithdrawals.length})</div>
                {c.adminWithdrawals.map(w => (
                    <div key={w.id} style={{ display: "flex", gap: 8, padding: "4px 0", borderBottom: "1px solid #f1f5f9", fontSize: 12 }}>
                        <span style={{ fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", minWidth: 80 }}>{fmt(w.amount)}</span>
                        <span style={{ flex: 1 }}>{w.note || "(sin nota)"}</span>
                        <span style={{ color: "#94a3b8" }}>{fmtTime(w.ts)} • {w.by}</span>
                    </div>
                ))}
            </>}
            {c.movements?.length > 0 && <>
                <div style={{ fontSize: 14, fontWeight: 800, margin: "14px 0 6px" }}>Movimientos ({c.movements.length})</div>
                {c.movements.map(m => (
                    <div key={m.id} style={{ display: "flex", gap: 8, padding: "4px 0", borderBottom: "1px solid #f1f5f9", fontSize: 12 }}>
                        <span style={{ color: m.type === "ingreso" ? "#16a34a" : "#dc2626", fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", minWidth: 80 }}>
                            {m.type === "ingreso" ? "+" : "−"}{fmt(m.amount)}
                        </span>
                        <span style={{ flex: 1 }}>{m.isTransfer && <span style={S.tTag}>FONDOS</span>}{m.description}</span>
                    </div>
                ))}
            </>}
        </Modal>
    );
}
