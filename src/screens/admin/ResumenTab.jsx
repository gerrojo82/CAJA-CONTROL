import StatCard from "../../components/StatCard";
import SimpleBarChart from "../../components/SimpleBarChart";
import { S } from "../../styles/styles";
import { STORES, REGISTERS_PER_STORE, regLabel } from "../../utils/constants";
import { fmt, fmtDate } from "../../utils/formatters";
import { getClosingAvailable } from "../../utils/helpers";

export default function ResumenTab({ dayCls, state, filterDate, storeFilter, getActiveShifts, openModal }) {
    const stores = storeFilter === "all" ? STORES : STORES.filter(s => s.id === storeFilter);

    const storeAnalysis = stores.map(store => {
        const regs = REGISTERS_PER_STORE.map(reg => {
            const cls = dayCls.filter(c => c.storeId === store.id && c.registerId === reg.id);
            const shifts = getActiveShifts(store.id, reg.id, filterDate);
            if (cls.length === 0 && shifts.length === 0) return null;

            const shiftData = cls.map(c => {
                const rendido = c.montoRetirado || 0;
                const ventasEfvo = Math.max(0, c.countedCash - c.openingAmount - c.ingresosEfectivo + c.egresosEfectivo);
                return { ...c, rendido, ventasEfvo };
            });

            const totalRendido = shiftData.reduce((s, c) => s + c.rendido, 0);
            const totalTransfOut = cls.reduce((s, c) => s + (c.transferredOut || 0), 0);
            const totalEgrEfvo = cls.reduce((s, c) => s + c.egresosEfectivo, 0);
            const totalAdminWithdrawn = cls.reduce((s, c) => s + (c.adminWithdrawn || 0), 0);
            const enMano = totalRendido - totalTransfOut - totalAdminWithdrawn;
            const totalVentas = shiftData.reduce((s, c) => s + c.ventasEfvo, 0);
            const faltantes = cls.filter(c => c.difference < 0);
            const totalFaltante = faltantes.reduce((s, c) => s + c.difference, 0);

            return { reg, cls, shifts, shiftData, totalRendido, totalTransfOut, totalEgrEfvo, enMano, totalVentas, faltantes, totalFaltante };
        }).filter(Boolean);

        return { store, regs };
    });

    const flat = storeAnalysis.flatMap(s => s.regs);
    const gVentas = flat.reduce((s, r) => s + r.totalVentas, 0);
    const gEgrEfvo = flat.reduce((s, r) => s + r.totalEgrEfvo, 0);
    const gRendido = flat.reduce((s, r) => s + r.totalRendido, 0);
    const gEnMano = flat.reduce((s, r) => s + r.enMano, 0);
    const gFaltante = flat.reduce((s, r) => s + r.totalFaltante, 0);
    const allFaltantes = flat.flatMap(r => r.faltantes.map(c => ({ ...c, label: regLabel(c.storeId, c.registerId) })));
    const gPendiente = dayCls.reduce((s, c) => s + getClosingAvailable(c), 0);
    const gDeberias = gVentas - gEgrEfvo + gFaltante;

    return (
        <>
            <div style={S.statCards}>
                <div style={{ ...S.statCard, background: "#0f172a", color: "#f8fafc" }}>
                    <div style={{ fontSize: 11, color: "#94a3b8" }}>💵 Ventas efvo</div>
                    <div style={{ fontSize: 22, fontWeight: 900, fontFamily: "'JetBrains Mono', monospace", color: "#60a5fa" }}>{fmt(gVentas)}</div>
                </div>
                <StatCard label="Pagos prov." value={fmt(gEgrEfvo)} color="#dc2626" sub="Salidas" />
                <StatCard label="Rendido" value={fmt(gRendido)} color="#3b82f6" sub="Cajeros" />
                <div style={S.statCard}>
                    <div style={{ fontSize: 11, color: "#64748b" }}>💰 En mano</div>
                    <div style={{ fontSize: 22, fontWeight: 900, fontFamily: "'JetBrains Mono', monospace", color: "#16a34a" }}>{fmt(gEnMano)}</div>
                </div>
            </div>

            {allFaltantes.length > 0 && (
                <div style={{ padding: 14, borderRadius: 11, background: "#fef2f2", border: "2px solid #fecaca", marginBottom: 14 }}>
                    <div style={{ fontWeight: 800, fontSize: 14, color: "#dc2626", marginBottom: 8 }}>🚨 FALTANTES</div>
                    {allFaltantes.map((c, i) => (
                        <div key={i} style={{ padding: "6px 10px", borderRadius: 7, background: "#fff", marginBottom: 3, cursor: "pointer", display: "flex", justifyContent: "space-between", fontSize: 13 }}
                            onClick={() => openModal("closingDetail", c)}>
                            <span><strong>{c.label}</strong> — <span style={{ textTransform: "capitalize" }}>{c.shift}</span> ({c.closedBy})</span>
                            <strong style={{ color: "#dc2626", fontFamily: "'JetBrains Mono', monospace" }}>{fmt(c.difference)}</strong>
                        </div>
                    ))}
                    <div style={{ marginTop: 6, padding: "6px 10px", borderRadius: 6, background: "#dc2626", color: "#fff", fontWeight: 800, fontSize: 13, display: "flex", justifyContent: "space-between" }}>
                        <span>TOTAL:</span><span>{fmt(Math.abs(gFaltante))}</span>
                    </div>
                </div>
            )}

            {gFaltante === 0 && dayCls.length > 0 && (
                <div style={{ padding: 10, borderRadius: 10, background: "#f0fdf4", border: "1px solid #bbf7d0", marginBottom: 14, textAlign: "center", fontWeight: 700, color: "#16a34a", fontSize: 13 }}>✓ Sin faltantes</div>
            )}

            {dayCls.length > 0 && (
                <>
                    <div style={S.sectionTitle}>💵 Balance</div>
                    <div style={{ ...S.card, padding: 0, overflow: "hidden" }}>
                        <div style={{ padding: "10px 14px", background: "#f0fdf4", borderBottom: "1px solid #bbf7d0" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}><span>Ventas efvo</span><strong style={{ color: "#16a34a" }}>+{fmt(gVentas)}</strong></div>
                        </div>
                        <div style={{ padding: "10px 14px", background: "#fef2f2", borderBottom: "1px solid #fecaca" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}><span>Pagos prov.</span><span style={{ color: "#dc2626" }}>−{fmt(gEgrEfvo)}</span></div>
                            {gFaltante < 0 && <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}><span>Faltantes</span><span style={{ color: "#dc2626" }}>−{fmt(Math.abs(gFaltante))}</span></div>}
                        </div>
                        <div style={{ padding: "12px 14px", background: "#0f172a", color: "#fff", display: "flex", justifyContent: "space-between", fontWeight: 900, fontSize: 16 }}>
                            <span>Deberías tener:</span><span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 22 }}>{fmt(gDeberias)}</span>
                        </div>
                        <div style={{ padding: "12px 14px", background: "#1e293b" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, padding: "3px 0", color: "#4ade80" }}>
                                <span>✓ En mano</span><strong style={{ fontFamily: "'JetBrains Mono', monospace" }}>{fmt(gEnMano)}</strong>
                            </div>
                            {gPendiente > 0 && <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, padding: "3px 0", color: "#fbbf24" }}>
                                <span>⏳ Pendiente</span><strong style={{ fontFamily: "'JetBrains Mono', monospace" }}>{fmt(gPendiente)}</strong>
                            </div>}
                            <div style={{
                                marginTop: 6, padding: "6px 10px", borderRadius: 6, fontSize: 12, fontWeight: 700,
                                background: Math.abs(gDeberias - gEnMano - gPendiente) < 1 ? "rgba(74,222,128,0.15)" : "rgba(248,113,113,0.2)",
                                color: Math.abs(gDeberias - gEnMano - gPendiente) < 1 ? "#4ade80" : "#f87171",
                                display: "flex", justifyContent: "space-between"
                            }}>
                                <span>{Math.abs(gDeberias - gEnMano - gPendiente) < 1 ? "✓ Cuadra" : "⚠ No cuadra"}</span>
                                <span>{fmt(gEnMano)} + {fmt(gPendiente)} = {fmt(gEnMano + gPendiente)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Gráfico de ventas por caja */}
                    {flat.length > 0 && (
                        <>
                            <div style={{ ...S.sectionTitle, marginTop: 20 }}>📊 Ventas por Caja</div>
                            <div style={S.card}>
                                <SimpleBarChart
                                    data={flat.map(r => ({
                                        label: regLabel(r.reg.storeId || r.cls[0]?.storeId, r.reg.id),
                                        value: r.totalVentas
                                    }))}
                                    height={200}
                                    color="#3b82f6"
                                />
                            </div>
                        </>
                    )}
                </>
            )}

            {/* Per store detail */}
            {storeAnalysis.map(({ store, regs }) => regs.length > 0 && (
                <div key={store.id}>
                    <div style={S.sectionTitle}>{store.icon} {store.name} — {fmtDate(filterDate)}</div>
                    {regs.map(({ reg, shiftData, enMano, totalVentas, totalEgrEfvo, faltantes, totalFaltante, totalRendido, shifts }) => (
                        <div key={reg.id} style={{ ...S.card, borderLeft: faltantes.length > 0 ? "4px solid #dc2626" : "4px solid #16a34a" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                                <strong>{reg.name}</strong>
                                {faltantes.length > 0 ? <span style={{ padding: "2px 8px", borderRadius: 5, background: "#fee2e2", color: "#dc2626", fontWeight: 800, fontSize: 11 }}>Faltante: {fmt(Math.abs(totalFaltante))}</span>
                                    : shiftData.length > 0 ? <span style={{ padding: "2px 8px", borderRadius: 5, background: "#dcfce7", color: "#16a34a", fontWeight: 700, fontSize: 11 }}>✓</span> : null}
                            </div>
                            {shiftData.map(c => (
                                <div key={c.id} style={{ padding: "8px 10px", borderRadius: 7, background: c.difference < 0 ? "#fef2f2" : "#f8fafc", marginBottom: 4, cursor: "pointer", fontSize: 12 }}
                                    onClick={() => openModal("closingDetail", c)}>
                                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                                        <span style={{ fontWeight: 700, textTransform: "capitalize" }}>{c.shift} — {c.closedBy}</span>
                                        <span style={{ fontWeight: 800, fontFamily: "'JetBrains Mono', monospace" }}>Rindió {fmt(c.rendido)}</span>
                                    </div>
                                    <div style={{ display: "flex", gap: 12, fontSize: 11, color: "#64748b" }}>
                                        <span>Fondo: {fmt(c.openingAmount)}</span>
                                        <span>Contó: {fmt(c.countedCash)}</span>
                                        <span>Ventas: <span style={{ color: "#3b82f6" }}>{fmt(c.ventasEfvo)}</span></span>
                                        {c.egresosEfectivo > 0 && <span>Pagos: <span style={{ color: "#dc2626" }}>−{fmt(c.egresosEfectivo)}</span></span>}
                                    </div>
                                    {c.difference < 0 && <div style={{ marginTop: 3, color: "#dc2626", fontWeight: 700, fontSize: 11 }}>⚠ Faltante: {fmt(Math.abs(c.difference))} (esperado {fmt(c.expectedCash)}, contó {fmt(c.countedCash)})</div>}
                                </div>
                            ))}
                            {shifts.filter(({ data }) => data.status === "open").map(({ shift, data }) => (
                                <div key={shift} style={{ padding: "4px 10px", borderRadius: 6, background: "#dcfce7", fontSize: 11, marginBottom: 3 }}>
                                    ● <span style={{ fontWeight: 700, textTransform: "capitalize" }}>{shift}</span> — {data.openedBy} — Fondo {fmt(data.openingAmount)}
                                </div>
                            ))}
                            {shiftData.length > 0 && (
                                <div style={{ padding: 8, borderRadius: 6, background: "#f0f9ff", border: "1px solid #bae6fd", marginTop: 4, fontSize: 11 }}>
                                    <div style={{ display: "flex", justifyContent: "space-between" }}><span>Ventas:</span><strong style={{ color: "#3b82f6" }}>{fmt(totalVentas)}</strong></div>
                                    <div style={{ display: "flex", justifyContent: "space-between" }}><span>Pagos:</span><span style={{ color: "#dc2626" }}>−{fmt(totalEgrEfvo)}</span></div>
                                    <div style={{ display: "flex", justifyContent: "space-between" }}><span>Rendido:</span><strong>{fmt(totalRendido)}</strong></div>
                                    <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 6px", borderRadius: 4, background: "#16a34a", color: "#fff", fontWeight: 800, marginTop: 3 }}>
                                        <span>En mano:</span><span style={{ fontFamily: "'JetBrains Mono', monospace" }}>{fmt(enMano)}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            ))}
        </>
    );
}
