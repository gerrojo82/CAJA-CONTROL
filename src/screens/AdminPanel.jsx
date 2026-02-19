import { useState } from "react";
import * as XLSX from "xlsx";
import ResumenTab from "./admin/ResumenTab";
import StatCard from "../components/StatCard";
import ClosingCard from "./admin/ClosingCard";
import ChangePinModal from "../modals/ChangePinModal";
import { S } from "../styles/styles";
import { STORES, REGISTERS_PER_STORE, EXPENSE_TYPES, regLabel } from "../utils/constants";
import { fmt, fmtDate, fmtTime, todayStr } from "../utils/formatters";
import { getClosingAvailable } from "../utils/helpers";

export default function AdminPanel({ state, adminTab, setAdminTab, filterDate, setFilterDate, storeFilter, getShift, getActiveShifts, getShiftMovements, openModal, resetData, setAdminStore, setScreen, save }) {
    const tabs = [
        { id: "resumen", label: "Resumen", icon: "◉" },
        { id: "cierres", label: "Cierres", icon: "✓" },
        { id: "movimientos", label: "Mov.", icon: "↕" },
        { id: "pagos", label: "Pagos", icon: "$" },
        { id: "transf", label: "Transf.", icon: "⇄" },
        { id: "audit", label: "Audit", icon: "⛊" },
    ];

    const [showPinModal, setShowPinModal] = useState(false);
    const [viewMode, setViewMode] = useState("day"); // day | range | month
    const [rangeStart, setRangeStart] = useState(filterDate);
    const [rangeEnd, setRangeEnd] = useState(filterDate);
    const [monthValue, setMonthValue] = useState(filterDate.slice(0, 7));
    const [payFilter, setPayFilter] = useState("all");

    // Filter closings by store
    const filterStore = (items) => storeFilter === "all" ? items : items.filter(x => x.storeId === storeFilter);
    const allCls = filterStore(state.closings);
    const allMoves = filterStore(state.movements);
    const allTrans = filterStore(state.transfers || []);

    const normalizeRange = () => {
        const start = rangeStart || filterDate;
        const end = rangeEnd || start;
        return start <= end ? { start, end } : { start: end, end: start };
    };

    const isInRange = (d) => {
        if (!d) return false;
        const { start, end } = normalizeRange();
        return d >= start && d <= end;
    };

    const isInMonth = (d) => d && monthValue && d.startsWith(monthValue);

    const dayCls = allCls.filter(c => c.date === filterDate);
    const dayMoves = allMoves.filter(m => m.date === filterDate);
    const dayTrans = allTrans.filter(t => t.toDate === filterDate);

    const periodCls = viewMode === "day" ? dayCls : viewMode === "range" ? allCls.filter(c => isInRange(c.date)) : allCls.filter(c => isInMonth(c.date));
    const periodMoves = viewMode === "day" ? dayMoves : viewMode === "range" ? allMoves.filter(m => isInRange(m.date)) : allMoves.filter(m => isInMonth(m.date));
    const periodTrans = viewMode === "day" ? dayTrans : viewMode === "range" ? allTrans.filter(t => isInRange(t.toDate)) : allTrans.filter(t => isInMonth(t.toDate));

    const periodEgresos = periodMoves.filter(m => m.type === "egreso");
    const payFilters = ["all", ...EXPENSE_TYPES, "Sin categoria"];
    const filteredEgresos = periodEgresos.filter(m => {
        if (payFilter === "all") return true;
        if (payFilter === "Sin categoria") return !m.category;
        return m.category === payFilter;
    });
    const totalPagos = periodEgresos.reduce((s, m) => s + m.amount, 0);
    const totalProveedor = periodEgresos.filter(m => m.category === "Proveedor").reduce((s, m) => s + m.amount, 0);
    const totalTicket = periodEgresos.filter(m => m.category === "Ticket").reduce((s, m) => s + m.amount, 0);
    const totalOtros = periodEgresos.filter(m => m.category === "Otros").reduce((s, m) => s + m.amount, 0);

    const storeNameById = (id) => STORES.find(s => s.id === id)?.name || id;
    const fmtXDate = (d) => d ? fmtDate(d) : "";
    const fmtXTime = (d) => d ? fmtTime(d) : "";

    const fmtMonth = (ym) => {
        if (!ym) return "";
        const d = new Date(`${ym}-01T00:00:00`);
        return d.toLocaleDateString("es-AR", { month: "long", year: "numeric" });
    };

    const periodLabel = viewMode === "day"
        ? fmtDate(filterDate)
        : viewMode === "range"
            ? `${fmtDate(normalizeRange().start)} – ${fmtDate(normalizeRange().end)}`
            : fmtMonth(monthValue);

    const periodTag = viewMode === "day"
        ? filterDate
        : viewMode === "range"
            ? `${normalizeRange().start}_a_${normalizeRange().end}`
            : monthValue;

    const exportExcel = (scope = "all") => {
        const stores = storeFilter === "all" ? STORES : STORES.filter(s => s.id === storeFilter);
        const regSummaries = [];

        stores.forEach(store => {
            REGISTERS_PER_STORE.forEach(reg => {
                const cls = periodCls.filter(c => c.storeId === store.id && c.registerId === reg.id);
                if (cls.length === 0) return;

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
                const pendiente = cls.reduce((s, c) => s + getClosingAvailable(c), 0);
                const retiroAdmin = cls.reduce((s, c) => s + (c.adminWithdrawn || 0), 0);

                regSummaries.push({
                    Fecha: viewMode === "day" ? filterDate : periodLabel,
                    Tienda: store.name,
                    Caja: reg.name,
                    VentasEfvo: totalVentas,
                    PagosProv: totalEgrEfvo,
                    Rendido: totalRendido,
                    EnMano: enMano,
                    Pendiente: pendiente,
                    RetiroAdmin: retiroAdmin,
                    Faltante: totalFaltante,
                    DeberiasTener: totalVentas - totalEgrEfvo + totalFaltante,
                });
            });
        });

        const gVentas = regSummaries.reduce((s, r) => s + r.VentasEfvo, 0);
        const gEgrEfvo = regSummaries.reduce((s, r) => s + r.PagosProv, 0);
        const gRendido = regSummaries.reduce((s, r) => s + r.Rendido, 0);
        const gEnMano = regSummaries.reduce((s, r) => s + r.EnMano, 0);
        const gPendiente = regSummaries.reduce((s, r) => s + r.Pendiente, 0);
        const gRetiroAdmin = regSummaries.reduce((s, r) => s + r.RetiroAdmin, 0);
        const gFaltante = regSummaries.reduce((s, r) => s + r.Faltante, 0);
        const gDeberias = gVentas - gEgrEfvo + gFaltante;

        const resumenRows = [
            ...regSummaries,
            {
                Fecha: viewMode === "day" ? fmtXDate(filterDate) : periodLabel,
                Tienda: "TOTAL",
                Caja: "",
                VentasEfvo: gVentas,
                PagosProv: gEgrEfvo,
                Rendido: gRendido,
                EnMano: gEnMano,
                Pendiente: gPendiente,
                RetiroAdmin: gRetiroAdmin,
                Faltante: gFaltante,
                DeberiasTener: gDeberias,
            },
        ];

        const cierreRows = periodCls.map(c => {
            const ventasEfvo = Math.max(0, c.countedCash - c.openingAmount - c.ingresosEfectivo + c.egresosEfectivo);
            const rendido = c.montoRetirado || 0;
            const transferido = c.transferredOut || 0;
            const enMano = rendido - transferido;
            const retiroAdmin = c.adminWithdrawn || 0;
            const disponible = getClosingAvailable(c);
            return {
                Fecha: fmtXDate(c.date),
                Tienda: storeNameById(c.storeId),
                Caja: regLabel(c.storeId, c.registerId),
                Turno: c.shift,
                CerradoPor: c.closedBy,
                Apertura: c.openingAmount,
                IngresosEfvo: c.ingresosEfectivo,
                EgresosEfvo: c.egresosEfectivo,
                Esperado: c.expectedCash,
                Contado: c.countedCash,
                Diferencia: c.difference,
                Retirado: rendido,
                Transferido: transferido,
                RetiroAdmin: retiroAdmin,
                VentasEfvo: ventasEfvo,
                EnMano: enMano,
                Disponible: disponible,
                CerradoEn: `${fmtXDate(c.closedAt)} ${fmtXTime(c.closedAt)}`.trim(),
            };
        });

        const movRows = periodMoves.map(m => ({
            Fecha: fmtXDate(m.date),
            Hora: fmtXTime(m.ts),
            Tienda: storeNameById(m.storeId),
            Caja: regLabel(m.storeId, m.registerId),
            Turno: m.shift,
            Tipo: m.type,
            Categoria: m.category || "",
            Metodo: m.method,
            Monto: m.amount,
            Descripcion: m.description,
            Usuario: m.registeredBy,
            EsTransfer: m.isTransfer ? "SI" : "NO",
        }));

        const transfRows = periodTrans.map(t => ({
            Fecha: fmtXDate(t.toDate),
            Hora: fmtXTime(t.ts),
            Monto: t.amount,
            DeTienda: storeNameById(t.fromStore),
            DeCaja: regLabel(t.fromStore, t.fromRegister),
            DeTurno: t.fromShift,
            DeFecha: fmtXDate(t.fromDate),
            ATienda: storeNameById(t.toStore),
            ACaja: regLabel(t.toStore, t.toRegister),
            ATurno: t.toShift,
            EjecutadoPor: t.executedBy,
            FromClosingId: t.fromClosingId,
        }));

        const wb = XLSX.utils.book_new();
        if (scope === "all" || scope === "resumen") {
            XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(resumenRows), "Resumen");
        }
        if (scope === "all" || scope === "cierres") {
            XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(cierreRows), "Cierres");
        }
        if (scope === "all" || scope === "movimientos") {
            XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(movRows), "Movimientos");
        }
        if (scope === "all" || scope === "transf") {
            XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(transfRows), "Transferencias");
        }

        if (scope === "audit") {
            const auditRows = [...state.auditLog].reverse().slice(0, 80).map(e => ({
                Fecha: `${fmtXDate(e.ts)} ${fmtXTime(e.ts)}`.trim(),
                Accion: e.action,
                Usuario: e.user,
                Detalle: e.detail,
            }));
            XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(auditRows), "Auditoria");
        }

        const storeTag = storeFilter === "all" ? "todas" : storeNameById(storeFilter).toLowerCase().replace(/\s+/g, "-");
        const tabTag = scope === "all" ? "todo" : scope;
        XLSX.writeFile(wb, `cajacontrol_${periodTag}_${storeTag}_${tabTag}.xlsx`);
    };

    const ResumenPeriodo = () => {
        const stores = storeFilter === "all" ? STORES : STORES.filter(s => s.id === storeFilter);
        const storeAnalysis = stores.map(store => {
            const regs = REGISTERS_PER_STORE.map(reg => {
                const cls = periodCls.filter(c => c.storeId === store.id && c.registerId === reg.id);
                if (cls.length === 0) return null;

                const shiftData = cls.map(c => {
                    const rendido = c.montoRetirado || 0;
                    const ventasEfvo = Math.max(0, c.countedCash - c.openingAmount - c.ingresosEfectivo + c.egresosEfectivo);
                    return { ...c, rendido, ventasEfvo };
                });

                const totalRendido = shiftData.reduce((s, c) => s + c.rendido, 0);
                const totalTransfOut = cls.reduce((s, c) => s + (c.transferredOut || 0), 0);
                const totalAdminWithdrawn = cls.reduce((s, c) => s + (c.adminWithdrawn || 0), 0);
                const totalEgrEfvo = cls.reduce((s, c) => s + c.egresosEfectivo, 0);
                const enMano = totalRendido - totalTransfOut - totalAdminWithdrawn;
                const totalVentas = shiftData.reduce((s, c) => s + c.ventasEfvo, 0);
                const faltantes = cls.filter(c => c.difference < 0);
                const totalFaltante = faltantes.reduce((s, c) => s + c.difference, 0);
                const pendiente = cls.reduce((s, c) => s + getClosingAvailable(c), 0);

                return { reg, totalVentas, totalEgrEfvo, totalRendido, enMano, pendiente, totalFaltante };
            }).filter(Boolean);

            return { store, regs };
        });

        const flat = storeAnalysis.flatMap(s => s.regs);
        const gVentas = flat.reduce((s, r) => s + r.totalVentas, 0);
        const gEgrEfvo = flat.reduce((s, r) => s + r.totalEgrEfvo, 0);
        const gRendido = flat.reduce((s, r) => s + r.totalRendido, 0);
        const gEnMano = flat.reduce((s, r) => s + r.enMano, 0);
        const gPendiente = flat.reduce((s, r) => s + r.pendiente, 0);
        const gFaltante = flat.reduce((s, r) => s + r.totalFaltante, 0);
        const gDeberias = gVentas - gEgrEfvo + gFaltante;

        return (
            <>
                <div style={S.sectionTitle}>Resumen — {periodLabel}</div>
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

                <div style={{ ...S.card, padding: 0, overflow: "hidden" }}>
                    <div style={{ padding: "12px 14px", background: "#0f172a", color: "#fff", display: "flex", justifyContent: "space-between", fontWeight: 900, fontSize: 15 }}>
                        <span>Deberías tener:</span><span style={{ fontFamily: "'JetBrains Mono', monospace" }}>{fmt(gDeberias)}</span>
                    </div>
                    <div style={{ padding: "10px 14px", background: "#1e293b", color: "#fff" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "3px 0", color: "#4ade80" }}>
                            <span>✓ En mano</span><strong>{fmt(gEnMano)}</strong>
                        </div>
                        {gPendiente > 0 && <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "3px 0", color: "#fbbf24" }}>
                            <span>⏳ Pendiente</span><strong>{fmt(gPendiente)}</strong>
                        </div>}
                    </div>
                </div>

                {storeAnalysis.map(({ store, regs }) => regs.length > 0 && (
                    <div key={store.id}>
                        <div style={S.sectionTitle}>{store.icon} {store.name} — {periodLabel}</div>
                        {regs.map(({ reg, totalVentas, totalEgrEfvo, totalRendido, enMano, pendiente, totalFaltante }) => (
                            <div key={reg.id} style={{ ...S.card, borderLeft: totalFaltante < 0 ? "4px solid #dc2626" : "4px solid #16a34a" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                                    <strong>{reg.name}</strong>
                                    <span style={{ fontSize: 11, color: "#64748b" }}>Faltante: {fmt(Math.abs(totalFaltante))}</span>
                                </div>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, fontSize: 12 }}>
                                    <div>Ventas: <strong style={{ color: "#3b82f6" }}>{fmt(totalVentas)}</strong></div>
                                    <div>Pagos: <span style={{ color: "#dc2626" }}>−{fmt(totalEgrEfvo)}</span></div>
                                    <div>Rendido: <strong>{fmt(totalRendido)}</strong></div>
                                    <div>En mano: <strong style={{ color: "#16a34a" }}>{fmt(enMano)}</strong></div>
                                    <div>Pendiente: <strong>{fmt(pendiente)}</strong></div>
                                </div>
                            </div>
                        ))}
                    </div>
                ))}
            </>
        );
    };

    return (
        <div>
            <div style={S.tabBar}>
                <button style={{ ...S.tab, color: "#8b5cf6", fontWeight: 700 }} onClick={() => setScreen("adminPickStore")}>
                    {storeFilter === "all" ? "📊 Todas" : STORES.find(s => s.id === storeFilter)?.icon + " " + STORES.find(s => s.id === storeFilter)?.name} ▾
                </button>
                {tabs.map(t => (
                    <button key={t.id} style={{ ...S.tab, ...(adminTab === t.id ? S.tabActive : {}) }} onClick={() => setAdminTab(t.id)}>
                        <span style={{ fontSize: 13 }}>{t.icon}</span> {t.label}
                    </button>
                ))}
            </div>
            <div style={S.adminContent}>
                <div style={S.dateFilter}>
                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                        <button style={{ ...S.segBtn, ...(viewMode === "day" ? S.segBtnActive : {}) }} onClick={() => setViewMode("day")}>Día</button>
                        <button style={{ ...S.segBtn, ...(viewMode === "range" ? S.segBtnActive : {}) }} onClick={() => setViewMode("range")}>Rango</button>
                        <button style={{ ...S.segBtn, ...(viewMode === "month" ? S.segBtnActive : {}) }} onClick={() => setViewMode("month")}>Mes</button>
                    </div>

                    {viewMode === "day" && <>
                        <button style={S.dateBtn} onClick={() => { const d = new Date(filterDate); d.setDate(d.getDate() - 1); setFilterDate(d.toISOString().split("T")[0]); }}>◂</button>
                        <input type="date" style={S.dateInput} value={filterDate} onChange={e => setFilterDate(e.target.value)} />
                        <button style={S.dateBtn} onClick={() => { const d = new Date(filterDate); d.setDate(d.getDate() + 1); setFilterDate(d.toISOString().split("T")[0]); }}>▸</button>
                        {filterDate !== todayStr() && <button style={S.todayBtn} onClick={() => setFilterDate(todayStr())}>Hoy</button>}
                    </>}

                    {viewMode === "range" && <>
                        <input type="date" style={S.dateInput} value={rangeStart} onChange={e => setRangeStart(e.target.value)} />
                        <span style={{ fontSize: 12, color: "#94a3b8" }}>a</span>
                        <input type="date" style={S.dateInput} value={rangeEnd} onChange={e => setRangeEnd(e.target.value)} />
                    </>}

                    {viewMode === "month" && (
                        <input type="month" style={S.dateInput} value={monthValue} onChange={e => setMonthValue(e.target.value)} />
                    )}

                    <div style={{ flex: 1, minWidth: 12 }} />
                    <button style={{ ...S.btnSmG, padding: "7px 12px" }} onClick={() => exportExcel("all")}>⬇ Exportar todo</button>
                    <button style={{ ...S.btnSmG, padding: "7px 12px", background: "#0f172a" }} onClick={() => exportExcel(adminTab)}>⬇ Exportar pestaña</button>
                </div>

                {adminTab === "resumen" && (
                    viewMode === "day"
                        ? <ResumenTab dayCls={dayCls} state={state} filterDate={filterDate} storeFilter={storeFilter} getActiveShifts={getActiveShifts} openModal={openModal} />
                        : <ResumenPeriodo />
                )}

                {adminTab === "cierres" && (
                    <>
                        <div style={S.sectionTitle}>Cierres — {periodLabel}</div>
                        {periodCls.length === 0 ? <div style={S.empty}>Sin cierres</div> : periodCls.map(c => (
                            <ClosingCard
                                key={c.id}
                                c={c}
                                onClick={() => openModal("closingDetail", c)}
                                onWithdraw={() => openModal("adminWithdraw", c)}
                                showFormula
                            />
                        ))}
                    </>
                )}

                {adminTab === "movimientos" && (
                    <>
                        <div style={S.sectionTitle}>Movimientos — {periodLabel}</div>
                        {periodMoves.length === 0 ? <div style={S.empty}>Sin movimientos</div> : <div style={S.card}>
                            {[...periodMoves].reverse().map(m => (
                                <div key={m.id} style={{ display: "flex", gap: 8, padding: "8px 0", borderBottom: "1px solid #f1f5f9", fontSize: 13, alignItems: "center" }}>
                                    <div style={{ width: 86, color: "#94a3b8", fontSize: 11, lineHeight: 1.1 }}>
                                        <div>{fmtDate(m.date)}</div>
                                        <div>{fmtTime(m.ts)}</div>
                                    </div>
                                    <span style={{ width: 80, fontSize: 11 }}>{regLabel(m.storeId, m.registerId)}</span>
                                    <span style={{ flex: 1, fontWeight: 500 }}>
                                        {m.isTransfer && <span style={S.tTag}>TRANSF</span>}
                                        {m.category && <span style={{ ...S.tTag, background: "#fee2e2", color: "#dc2626" }}>{m.category}</span>}
                                        {m.description}
                                    </span>
                                    <span style={{ fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: m.type === "ingreso" ? "#16a34a" : "#dc2626" }}>
                                        {m.type === "ingreso" ? "+" : "−"}{fmt(m.amount)}
                                    </span>
                                </div>
                            ))}
                        </div>}
                    </>
                )}

                {adminTab === "pagos" && (
                    <>
                        <div style={S.sectionTitle}>Pagos — {periodLabel}</div>
                        <div style={S.statCards}>
                            <StatCard label="Total" value={fmt(totalPagos)} color="#dc2626" sub="Egresos" />
                            <StatCard label="Proveedor" value={fmt(totalProveedor)} color="#b91c1c" sub="Pagos" />
                            <StatCard label="Ticket" value={fmt(totalTicket)} color="#ef4444" sub="Pendientes" />
                            <StatCard label="Otros" value={fmt(totalOtros)} color="#f97316" sub="Varios" />
                        </div>

                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
                            {payFilters.map(f => (
                                <button key={f} style={{ ...S.segBtn, ...(payFilter === f ? S.segBtnActive : {}) }} onClick={() => setPayFilter(f)}>
                                    {f}
                                </button>
                            ))}
                        </div>

                        {filteredEgresos.length === 0 ? <div style={S.empty}>Sin pagos</div> : (
                            <div style={S.card}>
                                {[...filteredEgresos].reverse().map(m => (
                                    <div key={m.id} style={{ display: "flex", gap: 8, padding: "8px 0", borderBottom: "1px solid #f1f5f9", fontSize: 13, alignItems: "center" }}>
                                        <div style={{ width: 86, color: "#94a3b8", fontSize: 11, lineHeight: 1.1 }}>
                                            <div>{fmtDate(m.date)}</div>
                                            <div>{fmtTime(m.ts)}</div>
                                        </div>
                                        <span style={{ width: 80, fontSize: 11 }}>{regLabel(m.storeId, m.registerId)}</span>
                                        <span style={{ flex: 1, fontWeight: 500 }}>
                                            {m.category && <span style={{ ...S.tTag, background: "#fee2e2", color: "#dc2626" }}>{m.category}</span>}
                                            {m.description}
                                        </span>
                                        <span style={{ fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: "#dc2626" }}>
                                            −{fmt(m.amount)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}

                {adminTab === "transf" && (
                    <>
                        <div style={S.sectionTitle}>Transferencias — {periodLabel}</div>
                        {periodTrans.length === 0 ? <div style={S.empty}>Sin transferencias</div> : periodTrans.map(t => (
                            <div key={t.id} style={S.card}>
                                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                                    <div style={{ flex: 1, padding: 8, borderRadius: 7, background: "#fef2f2", textAlign: "center" }}>
                                        <div style={{ fontSize: 10, color: "#94a3b8" }}>ORIGEN</div>
                                        <div style={{ fontWeight: 700, fontSize: 12 }}>{regLabel(t.fromStore, t.fromRegister)}</div>
                                        <div style={{ fontSize: 11, color: "#64748b", textTransform: "capitalize" }}>{t.fromShift}</div>
                                    </div>
                                    <div style={{ fontSize: 20, fontWeight: 900, color: "#8b5cf6" }}>→</div>
                                    <div style={{ flex: 1, padding: 8, borderRadius: 7, background: "#f0fdf4", textAlign: "center" }}>
                                        <div style={{ fontSize: 10, color: "#94a3b8" }}>DESTINO</div>
                                        <div style={{ fontWeight: 700, fontSize: 12 }}>{regLabel(t.toStore, t.toRegister)}</div>
                                        <div style={{ fontSize: 11, color: "#64748b", textTransform: "capitalize" }}>{t.toShift}</div>
                                    </div>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between" }}>
                                    <span style={{ fontSize: 18, fontWeight: 800, color: "#7c3aed", fontFamily: "'JetBrains Mono', monospace" }}>{fmt(t.amount)}</span>
                                    <span style={{ fontSize: 12, color: "#94a3b8" }}>{fmtDate(t.toDate || t.ts)} {fmtTime(t.ts)} • {t.executedBy}</span>
                                </div>
                            </div>
                        ))}
                    </>
                )}

                {adminTab === "audit" && (
                    <>
                        <div style={S.sectionTitle}>Auditoría</div>
                        {[...state.auditLog].reverse().slice(0, 80).map(e => (
                            <div key={e.id} style={{ display: "flex", gap: 6, padding: "6px 8px", borderRadius: 5, background: "#fff", fontSize: 11, flexWrap: "wrap", marginBottom: 1 }}>
                                <span style={{ color: "#94a3b8", fontFamily: "'JetBrains Mono', monospace", fontSize: 10, minWidth: 110 }}>{fmtDate(e.ts)} {fmtTime(e.ts)}</span>
                                <span style={{ padding: "1px 5px", borderRadius: 3, background: "#e2e8f0", fontWeight: 700, fontSize: 9 }}>{e.action}</span>
                                <span style={{ fontWeight: 600, color: "#475569" }}>{e.user}</span>
                                <span style={{ flex: 1, color: "#64748b" }}>{e.detail}</span>
                            </div>
                        ))}
                        <button style={{ ...S.btnSmR, marginTop: 16, padding: "8px 14px" }} onClick={resetData}>⚠ Reset</button>
                        <button style={{ padding: "8px 14px", borderRadius: 7, background: "#0f172a", color: "#fff", border: "none", fontSize: 11, fontWeight: 700, cursor: "pointer", marginTop: 8, marginLeft: 8 }}
                            onClick={() => setShowPinModal(true)}>🔑 Cambiar PIN</button>
                    </>
                )}
            </div>
            {showPinModal && (
                <ChangePinModal
                    currentPin={state.adminPin}
                    onSave={(newPin) => {
                        save({ ...state, adminPin: newPin });
                        setShowPinModal(false);
                        // alert? toast?
                    }}
                    onClose={() => setShowPinModal(false)}
                />
            )}
        </div>
    );
}
