import { STORES, REGISTERS_PER_STORE } from "../utils/constants";
import { fmt, fmtTime, todayStr, fmtDate } from "../utils/formatters";
import { calcCashFlows, getClosingAvailable } from "../utils/helpers";
import { S } from "../styles/styles";

export default function CajeroPanel({ session, state, getShift, getShiftMovements, openModal }) {
    const { storeId, registerId, shift, name } = session;
    const sd = getShift(storeId, registerId, todayStr(), shift);
    const moves = sd ? getShiftMovements(storeId, registerId, todayStr(), shift) : [];
    const { ingEfvo, egrEfvo, ingTotal, egrTotal } = calcCashFlows(moves);
    const expected = sd ? sd.openingAmount + ingEfvo - egrEfvo : 0;
    const totalAvail = state.closings.filter(c => c.storeId === storeId).reduce((s, c) => s + getClosingAvailable(c), 0);

    // Total del día (#6)
    const netTotal = ingTotal - egrTotal;

    // Información de sucursal y caja
    const store = STORES.find(s => s.id === storeId);
    const register = REGISTERS_PER_STORE.find(r => r.id === registerId);
    const today = todayStr();

    if (!sd) {
        return (
            <div style={S.cajWrap}>
                <div style={{ textAlign: "center", padding: "36px 16px" }}>
                    <div style={{ fontSize: 44, marginBottom: 10 }}>📦</div>
                    <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>Turno sin abrir</div>

                    {/* Información de qué se va a abrir */}
                    <div style={{
                        padding: 12,
                        borderRadius: 10,
                        background: "#f8fafc",
                        border: "1px solid #e2e8f0",
                        marginBottom: 16,
                        maxWidth: 320,
                        margin: "0 auto 16px"
                    }}>
                        <div style={{ fontSize: 12, color: "#64748b", marginBottom: 6 }}>Vas a abrir:</div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", marginBottom: 2 }}>
                            {store?.icon} {store?.name} - {register?.name}
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#3b82f6", textTransform: "capitalize" }}>
                            Turno {shift}
                        </div>
                        <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
                            📅 {fmtDate(today)}
                        </div>
                    </div>

                    <div style={{ fontSize: 13, color: "#64748b", marginBottom: 16 }}>Contá el efectivo para abrir</div>
                    <button style={{ ...S.btnSubmit, maxWidth: 280, margin: "0 auto" }}
                        onClick={() => openModal("openShift", { storeId, registerId, shift, name })}>
                        Abrir Turno
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div style={S.cajWrap}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: 14, borderRadius: 12, background: "#fff", border: "1px solid #e2e8f0", marginBottom: 10 }}>
                <div>
                    <div style={{ fontWeight: 800, fontSize: 15 }}>{store?.icon} {store?.name} — {register?.name}</div>
                    <div style={{ fontSize: 11, color: "#64748b", textTransform: "capitalize" }}>{shift} • Abierto {fmtTime(sd.openedAt)} por {sd.openedBy}</div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                    <button style={S.btnSmR} onClick={() => openModal("closeShift", { storeId, registerId, shift })}>Cerrar turno/caja</button>
                    <span style={{ fontSize: 10, color: "#94a3b8" }}>Contar efectivo y confirmar</span>
                </div>
            </div>

            {/* Total del día (#6) */}
            <div style={{ padding: 14, borderRadius: 12, background: "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)", border: "1px solid #bae6fd", marginBottom: 10 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: "#0c4a6e", marginBottom: 6 }}>📊 Total del día</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, fontSize: 12 }}>
                    <div>
                        <div style={{ color: "#64748b", fontSize: 10 }}>Ventas</div>
                        <div style={{ fontWeight: 800, color: "#16a34a", fontFamily: "'JetBrains Mono', monospace" }}>+{fmt(ingTotal)}</div>
                    </div>
                    <div>
                        <div style={{ color: "#64748b", fontSize: 10 }}>Pagos</div>
                        <div style={{ fontWeight: 800, color: "#dc2626", fontFamily: "'JetBrains Mono', monospace" }}>-{fmt(egrTotal)}</div>
                    </div>
                    <div>
                        <div style={{ color: "#64748b", fontSize: 10 }}>Neto</div>
                        <div style={{ fontWeight: 800, color: netTotal >= 0 ? "#0369a1" : "#dc2626", fontFamily: "'JetBrains Mono', monospace" }}>
                            {netTotal >= 0 ? "+" : ""}{fmt(netTotal)}
                        </div>
                    </div>
                </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7, marginBottom: 10 }}>
                <div style={S.cajStat}><div style={S.cajStatL}>Fondo</div><div style={S.cajStatV}>{fmt(sd.openingAmount)}</div></div>
                <div style={S.cajStat}><div style={S.cajStatL}>Ing. efvo</div><div style={{ ...S.cajStatV, color: "#16a34a" }}>+{fmt(ingEfvo)}</div></div>
                <div style={S.cajStat}><div style={S.cajStatL}>Egr. efvo</div><div style={{ ...S.cajStatV, color: "#dc2626" }}>−{fmt(egrEfvo)}</div></div>
                <div style={{ ...S.cajStat, background: "#f5f3ff", borderColor: "#c4b5fd" }}>
                    <div style={S.cajStatL}>Esperado en caja</div><div style={{ ...S.cajStatV, color: "#7c3aed" }}>{fmt(expected)}</div>
                </div>
            </div>

            <div style={{ padding: "8px 10px", borderRadius: 8, background: "#f0f9ff", border: "1px solid #bae6fd", marginBottom: 10, fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: "#475569" }}>
                {fmt(sd.openingAmount)} + {fmt(ingEfvo)} − {fmt(egrEfvo)} = <strong>{fmt(expected)}</strong>
            </div>

            <div style={{ display: "flex", gap: 7, marginBottom: 12 }}>
                <button style={{ flex: 1, padding: 13, borderRadius: 10, background: "#dc2626", color: "#fff", border: "none", fontWeight: 800, fontSize: 13, cursor: "pointer" }}
                    onClick={() => openModal("egreso", { storeId, registerId, shift })}>↑ Pago / Extracción</button>
                <button style={{ flex: 1, padding: 13, borderRadius: 10, background: "linear-gradient(135deg,#7c3aed,#6d28d9)", color: "#fff", border: "none", fontWeight: 800, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}
                    onClick={() => openModal("fundTransfer", { storeId, registerId, shift })}>
                    💰 Fondos {totalAvail > 0 && <span style={{ padding: "1px 7px", borderRadius: 20, background: "rgba(255,255,255,0.25)", fontSize: 10 }}>{fmt(totalAvail)}</span>}
                </button>
            </div>

            <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 6 }}>Movimientos ({moves.length})</div>
            {moves.length === 0 ? <div style={S.empty}>Sin movimientos</div> : (
                <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                    {[...moves].reverse().map(m => (
                        <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 11px", borderRadius: 9, background: "#fff", border: "1px solid #f1f5f9", ...(m.isTransfer ? { borderLeft: "3px solid #8b5cf6" } : {}) }}>
                            <div style={{ width: 8, height: 8, borderRadius: "50%", background: m.type === "ingreso" ? "#16a34a" : "#dc2626", flexShrink: 0 }} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                    {m.isTransfer && <span style={S.tTag}>FONDOS</span>}
                                    {m.category && <span style={{ ...S.tTag, background: "#fee2e2", color: "#dc2626" }}>{m.category}</span>}
                                    {m.description}
                                </div>
                                <div style={{ fontSize: 10, color: "#94a3b8" }}>{fmtDate(m.date)} {fmtTime(m.ts)} • {m.method}</div>
                            </div>
                            <div style={{ fontWeight: 800, fontSize: 14, fontFamily: "'JetBrains Mono', monospace", color: m.type === "ingreso" ? "#16a34a" : "#dc2626", flexShrink: 0 }}>
                                {m.type === "ingreso" ? "+" : "−"}{fmt(m.amount)}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
