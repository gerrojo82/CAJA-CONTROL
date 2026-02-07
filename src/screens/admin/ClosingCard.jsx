import { S } from "../../styles/styles";
import { fmt } from "../../utils/formatters";
import { regLabel } from "../../utils/constants";
import { getClosingAvailable } from "../../utils/helpers";

export default function ClosingCard({ c, onClick, showFormula, onWithdraw }) {
    const available = getClosingAvailable(c);

    return (
        <div style={{ ...S.card, cursor: "pointer" }} onClick={onClick}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <div><strong>{regLabel(c.storeId, c.registerId)}</strong> — <span style={{ textTransform: "capitalize" }}>{c.shift}</span> ({c.closedBy})</div>
                <span style={{ padding: "3px 8px", borderRadius: 6, fontWeight: 800, fontSize: 11, background: available > 0 ? "#dcfce7" : "#f1f5f9", color: available > 0 ? "#16a34a" : "#64748b" }}>
                    {available > 0 ? `Disp: ${fmt(available)}` : "Disp: $0"}
                </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span style={{ fontSize: 11, color: "#94a3b8" }}>Disp: {fmt(available)}</span>
                <button
                    style={{ padding: "4px 10px", borderRadius: 6, border: "none", background: available > 0 ? "#0f172a" : "#e2e8f0", color: available > 0 ? "#fff" : "#94a3b8", fontSize: 11, fontWeight: 700, cursor: available > 0 ? "pointer" : "not-allowed" }}
                    onClick={(e) => { e.stopPropagation(); if (available > 0) onWithdraw?.(c); }}
                >Retirar</button>
            </div>
            {showFormula && <div style={{ padding: 8, borderRadius: 6, background: "#f0f9ff", border: "1px solid #bae6fd", marginBottom: 8, fontSize: 11, fontFamily: "'JetBrains Mono', monospace" }}>
                {fmt(c.openingAmount)} + {fmt(c.ingresosEfectivo)} − {fmt(c.egresosEfectivo)} = <strong>{fmt(c.expectedCash)}</strong>
            </div>}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "4px 10px", fontSize: 12 }}>
                <div><span style={{ fontSize: 10, color: "#94a3b8" }}>Fondo</span><br />{fmt(c.openingAmount)}</div>
                <div><span style={{ fontSize: 10, color: "#94a3b8" }}>Contado</span><br /><strong>{fmt(c.countedCash)}</strong></div>
                <div><span style={{ fontSize: 10, color: "#94a3b8" }}>Retirado</span><br />{fmt(c.montoRetirado)}</div>
            </div>
        </div>
    );
}
