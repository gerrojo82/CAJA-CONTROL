
import { useState, useEffect, useCallback } from "react";

// Auth
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import LoginPage from "./screens/LoginPage";

// Components
import PickStore from "./screens/onboarding/PickStore";
import PickRegister from "./screens/onboarding/PickRegister";
import PickShift from "./screens/onboarding/PickShift";
import EnterName from "./screens/onboarding/EnterName";
import AdminLogin from "./screens/onboarding/AdminLogin";
import AdminPickStore from "./screens/onboarding/AdminPickStore";
import CajeroPanel from "./screens/CajeroPanel";
import AdminPanel from "./screens/AdminPanel";

// Modals
import ShiftOpenModal from "./modals/ShiftOpenModal";
import ShiftCloseModal from "./modals/ShiftCloseModal";
import MovementModal from "./modals/MovementModal";
import FundTransferModal from "./modals/FundTransferModal";
import ClosingDetailModal from "./modals/ClosingDetailModal";
import AdminWithdrawModal from "./modals/AdminWithdrawModal";

// Utils
import { STORES, REGISTERS_PER_STORE, SHIFTS, DEFAULT_PIN, regLabel } from "./utils/constants";
import { uid, todayStr, fmt, fmtDate, fmtTime, nowISO } from "./utils/formatters";
import { calcCoinTotal, calcBillTotal, calcCashFlows, calcExpectedCash, getClosingAvailable } from "./utils/helpers";
import { storage } from "./utils/storage";
import { supabase, hasSupabase } from "./utils/supabase";
import { S } from "./styles/styles";

// ── STATE INIT ───────────────────────────────────────────────────
const initState = () => ({
  adminPin: DEFAULT_PIN,
  shifts: {},
  movements: [],
  closings: [],
  transfers: [],
  auditLog: [],
});

const fromDbShift = (r) => ({
  id: r.id,
  storeId: r.store_id,
  registerId: r.register_id,
  shift: r.shift,
  date: r.date,
  openedBy: r.opened_by,
  openedAt: r.opened_at,
  openingAmount: r.opening_amount,
  openingBills: r.opening_bills || {},
  openingCoins: r.opening_coins || {},
  status: r.status,
  closedBy: r.closed_by || null,
  closedAt: r.closed_at || null,
  closingAmount: r.closing_amount || null,
  difference: r.difference || null,
  montoRetirado: r.monto_retirado || null,
});

const toDbShift = (s) => ({
  id: s.id,
  store_id: s.storeId,
  register_id: s.registerId,
  shift: s.shift,
  date: s.date,
  opened_by: s.openedBy,
  opened_at: s.openedAt,
  opening_amount: s.openingAmount,
  opening_bills: s.openingBills,
  opening_coins: s.openingCoins,
  status: s.status,
  closed_by: s.closedBy || null,
  closed_at: s.closedAt || null,
  closing_amount: s.closingAmount || null,
  difference: s.difference || null,
  monto_retirado: s.montoRetirado || null,
});

const fromDbClosing = (r) => ({
  id: r.id,
  storeId: r.store_id,
  registerId: r.register_id,
  shift: r.shift,
  date: r.date,
  closedBy: r.closed_by,
  closedAt: r.closed_at,
  openingAmount: r.opening_amount,
  ingresosEfectivo: r.ingresos_efectivo,
  egresosEfectivo: r.egresos_efectivo,
  ingresosTotal: r.ingresos_total,
  egresosTotal: r.egresos_total,
  expectedCash: r.expected_cash,
  countedCash: r.counted_cash,
  difference: r.difference,
  montoRetirado: r.monto_retirado,
  transferredOut: r.transferred_out || 0,
  adminWithdrawn: r.admin_withdrawn || 0,
  adminWithdrawals: r.admin_withdrawals || [],
  closingBills: r.closing_bills || {},
  closingCoins: r.closing_coins || {},
  movements: [],
});

const toDbClosing = (c) => ({
  id: c.id,
  store_id: c.storeId,
  register_id: c.registerId,
  shift: c.shift,
  date: c.date,
  closed_by: c.closedBy,
  closed_at: c.closedAt,
  opening_amount: c.openingAmount,
  ingresos_efectivo: c.ingresosEfectivo,
  egresos_efectivo: c.egresosEfectivo,
  ingresos_total: c.ingresosTotal,
  egresos_total: c.egresosTotal,
  expected_cash: c.expectedCash,
  counted_cash: c.countedCash,
  difference: c.difference,
  monto_retirado: c.montoRetirado,
  transferred_out: c.transferredOut || 0,
  admin_withdrawn: c.adminWithdrawn || 0,
  admin_withdrawals: c.adminWithdrawals || [],
  closing_bills: c.closingBills,
  closing_coins: c.closingCoins,
});

const fromDbMovement = (r) => ({
  id: r.id,
  type: r.type,
  amount: r.amount,
  description: r.description,
  method: r.method,
  category: r.category || "",
  storeId: r.store_id,
  registerId: r.register_id,
  shift: r.shift,
  date: r.date,
  ts: r.ts,
  registeredBy: r.registered_by,
  isTransfer: r.is_transfer || false,
  fromClosingId: r.from_closing_id || null,
});

const toDbMovement = (m) => ({
  id: m.id,
  type: m.type,
  amount: m.amount,
  description: m.description,
  method: m.method,
  category: m.category || null,
  store_id: m.storeId,
  register_id: m.registerId,
  shift: m.shift,
  date: m.date,
  ts: m.ts,
  registered_by: m.registeredBy,
  is_transfer: Boolean(m.isTransfer),
  from_closing_id: m.fromClosingId || null,
});

const fromDbTransfer = (r) => ({
  id: r.id,
  fromClosingId: r.from_closing_id || null,
  fromStore: r.from_store,
  fromRegister: r.from_register,
  fromShift: r.from_shift,
  fromDate: r.from_date,
  toStore: r.to_store,
  toRegister: r.to_register,
  toShift: r.to_shift,
  toDate: r.to_date,
  amount: r.amount,
  executedBy: r.executed_by,
  ts: r.ts,
});

const toDbTransfer = (t) => ({
  id: t.id,
  from_closing_id: t.fromClosingId || null,
  from_store: t.fromStore,
  from_register: t.fromRegister,
  from_shift: t.fromShift,
  from_date: t.fromDate,
  to_store: t.toStore,
  to_register: t.toRegister,
  to_shift: t.toShift,
  to_date: t.toDate,
  amount: t.amount,
  executed_by: t.executedBy,
  ts: t.ts,
});

const fromDbAudit = (r) => ({
  id: r.id,
  user: r.user_name,
  action: r.action,
  detail: r.detail,
  ts: r.ts,
});

const toDbAudit = (e) => ({
  id: e.id,
  user_name: e.user,
  action: e.action,
  detail: e.detail,
  ts: e.ts,
});


// ── MAIN APP ─────────────────────────────────────────────────────
function App() {
  const { signOut } = useAuth();
  const [state, setState] = useState(initState);
  const [session, setSession] = useState(null); // { storeId, registerId, shift, name, role }
  const [screen, setScreen] = useState("pickStore"); // pickStore, pickRegister, pickShift, enterName, cajero, admin
  const [toast, setToast] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [modal, setModal] = useState(null);
  const [modalData, setModalData] = useState(null);

  // Admin state
  const [adminTab, setAdminTab] = useState("resumen");
  const [filterDate, setFilterDate] = useState(todayStr());
  const [adminStore, setAdminStore] = useState(null);

  // Onboarding state
  const [selStore, setSelStore] = useState(null);
  const [selReg, setSelReg] = useState(null);
  const [selShift, setSelShift] = useState(null);
  const [selName, setSelName] = useState("");

  const shiftKey = (storeId, regId, date, shift) => `${storeId}_${regId}_${date}_${shift}`;

  useEffect(() => {
    (async () => {
      try {
        if (hasSupabase) {
          const pinRes = await storage.get("admin_pin");
          const adminPin = pinRes?.value || DEFAULT_PIN;

          const [
            shiftsRes,
            closingsRes,
            movesRes,
            transfersRes,
            auditRes,
          ] = await Promise.all([
            supabase.from("shifts").select("*").order("opened_at", { ascending: true }),
            supabase.from("closings").select("*").order("closed_at", { ascending: true }),
            supabase.from("movements").select("*").order("ts", { ascending: true }),
            supabase.from("transfers").select("*").order("ts", { ascending: true }),
            supabase.from("audit_log").select("*").order("ts", { ascending: true }),
          ]);

          // Validar errores de Supabase
          if (shiftsRes.error) console.error("Error cargando shifts:", shiftsRes.error);
          if (closingsRes.error) console.error("Error cargando closings:", closingsRes.error);
          if (movesRes.error) console.error("Error cargando movements:", movesRes.error);
          if (transfersRes.error) console.error("Error cargando transfers:", transfersRes.error);
          if (auditRes.error) console.error("Error cargando audit_log:", auditRes.error);

          const shiftsMap = {};
          (shiftsRes.data || []).forEach(r => {
            const s = fromDbShift(r);
            shiftsMap[shiftKey(s.storeId, s.registerId, s.date, s.shift)] = s;
          });

          setState({
            ...initState(),
            adminPin,
            shifts: shiftsMap,
            closings: (closingsRes.data || []).map(fromDbClosing),
            movements: (movesRes.data || []).map(fromDbMovement),
            transfers: (transfersRes.data || []).map(fromDbTransfer),
            auditLog: (auditRes.data || []).map(fromDbAudit),
          });
        } else {
          const res = await storage.get("cajacontrol_v5");
          if (res?.value) setState(JSON.parse(res.value));
        }
      } catch (err) {
        console.error("Error crítico al cargar datos:", err);
        // Continuar con estado inicial en caso de error
      }
      setLoaded(true);
    })();
  }, []);

  const save = useCallback(async (ns) => {
    setState(ns);
    if (!hasSupabase) {
      try {
        await storage.set("cajacontrol_v5", JSON.stringify(ns));
      } catch (err) {
        console.error("Error guardando en localStorage:", err);
      }
    } else if (ns.adminPin !== state.adminPin) {
      try {
        await storage.set("admin_pin", ns.adminPin);
      } catch (err) {
        console.error("Error guardando PIN:", err);
      }
    }
  }, [state.adminPin]);

  const addLog = useCallback((action, detail) => ({
    id: uid(),
    user: session?.name || "sistema",
    action,
    detail,
    ts: nowISO(),
  }), [session]);

  const upsertShift = async (shift) => {
    if (!hasSupabase) return;
    try {
      const { error } = await supabase.from("shifts").upsert(toDbShift(shift), { onConflict: "store_id,register_id,date,shift" });
      if (error) {
        console.error("Error al guardar turno:", error);
        throw error;
      }
    } catch (err) {
      console.error("Error crítico en upsertShift:", err);
      throw err;
    }
  };

  const insertClosing = async (closing) => {
    if (!hasSupabase) return;
    const { error } = await supabase.from("closings").insert(toDbClosing(closing));
    if (error && error.code === "23505") return;
    if (error) throw error;
  };

  const upsertClosing = async (closing) => {
    if (!hasSupabase) return;
    try {
      const { error } = await supabase.from("closings").upsert(toDbClosing(closing));
      if (error) {
        console.error("Error al guardar cierre:", error);
        throw error;
      }
    } catch (err) {
      console.error("Error crítico en upsertClosing:", err);
      throw err;
    }
  };

  const insertMovement = async (movement) => {
    if (!hasSupabase) return;
    const { error } = await supabase.from("movements").insert(toDbMovement(movement));
    if (error && error.code === "23505") return;
    if (error) throw error;
  };

  const insertTransfer = async (transfer) => {
    if (!hasSupabase) return;
    const { error } = await supabase.from("transfers").insert(toDbTransfer(transfer));
    if (error && error.code === "23505") return;
    if (error) throw error;
  };

  const insertAudit = async (entry) => {
    if (!hasSupabase) return;
    try {
      const { error } = await supabase.from("audit_log").insert(toDbAudit(entry));
      if (error && error.code !== "23505") {
        console.error("Error al guardar log de auditoría:", error);
      }
    } catch (err) {
      console.error("Error crítico en insertAudit:", err);
      // No lanzar error para no bloquear la operación principal
    }
  };

  const showToast = (msg, type = "success") => { setToast({ msg, type }); setTimeout(() => setToast(null), 3500); };
  const openModal = (type, data) => { setModal(type); setModalData(data || null); };
  const closeModal = () => { setModal(null); setModalData(null); };

  const getShift = (storeId, regId, date, shift) => state.shifts[shiftKey(storeId, regId, date, shift)];
  const getActiveShifts = (storeId, regId, date) => SHIFTS.map(s => ({ shift: s, data: getShift(storeId, regId, date, s) })).filter(x => x.data);
  const getShiftMovements = (storeId, regId, date, shift) => state.movements.filter(m => m.storeId === storeId && m.registerId === regId && m.date === date && m.shift === shift);
  const getRegisterMovements = (storeId, regId, date) => state.movements.filter(m => m.storeId === storeId && m.registerId === regId && m.date === date);

  // ── LOGOUT ─────────────────────────────────────────────────────
  const logout = async () => {
    await signOut(); // Cerrar sesión de Supabase
    setSession(null);
    setScreen("pickStore");
    setSelStore(null); setSelReg(null); setSelShift(null); setSelName("");
    setAdminStore(null);
  };

  // ── OPERATIONS ────────────────────────────────────────────────
  const openShift = async (billCount, coinCount) => {
    try {
      const { storeId, registerId, shift, name } = modalData;
      const total = calcBillTotal(billCount) + calcCoinTotal(coinCount);
      const key = shiftKey(storeId, registerId, todayStr(), shift);
      const existing = state.shifts[key];
      if (existing?.status === "open") { showToast("Turno ya abierto", "error"); return; }
      if (existing?.status === "closed") { showToast("Turno ya cerrado", "error"); return; }
      const ns = {
        id: uid(),
        storeId, registerId, shift, date: todayStr(), openedBy: name,
        openedAt: nowISO(), openingAmount: total,
        openingBills: { ...billCount }, openingCoins: { ...coinCount },
        status: "open",
      };
      const entry = addLog("APERTURA", `${regLabel(storeId, registerId)} ${shift} con ${fmt(total)} por ${name}`);
      const auditLog = [...state.auditLog, entry];
      await upsertShift(ns);
      await insertAudit(entry);
      save({ ...state, shifts: { ...state.shifts, [key]: ns }, auditLog });
      closeModal();
      setSession({ storeId, registerId, shift, name, role: "cajero" });
      setScreen("cajero");
      showToast(`Turno abierto con ${fmt(total)}`);
    } catch (err) {
      console.error("Error al abrir turno:", err);
      showToast("Error al abrir turno. Intenta de nuevo.", "error");
    }
  };

  const closeShift = async (billCount, coinCount, notes = "") => {
    try {
      const { storeId, registerId, shift } = modalData;
      const key = shiftKey(storeId, registerId, todayStr(), shift);
      const sd = state.shifts[key];
      if (!sd) {
        showToast("Turno no encontrado", "error");
        return;
      }

      if (sd.status === "closed") {
        showToast("Este turno ya fue cerrado", "error");
        return;
      }

      const countedTotal = calcBillTotal(billCount) + calcCoinTotal(coinCount);
      const moves = getShiftMovements(storeId, registerId, todayStr(), shift);
      const { ingEfvo, egrEfvo, ingTotal, egrTotal } = calcCashFlows(moves);

      const expectedCash = sd.openingAmount + ingEfvo - egrEfvo;
      const diff = countedTotal - expectedCash;
      const montoRetirado = Math.max(0, countedTotal - sd.openingAmount);

      const closing = {
        id: uid(), storeId, registerId, shift, date: todayStr(), closedBy: session?.name || sd.openedBy,
        closedAt: nowISO(),
        openingAmount: sd.openingAmount, ingresosEfectivo: ingEfvo, egresosEfectivo: egrEfvo,
        ingresosTotal: ingTotal, egresosTotal: egrTotal,
        expectedCash, countedCash: countedTotal, difference: diff, montoRetirado,
        transferredOut: 0, adminWithdrawn: 0, adminWithdrawals: [],
        closingBills: { ...billCount }, closingCoins: { ...coinCount }, movements: moves,
        notes: notes || null,
      };

      const updatedShift = { ...sd, id: sd.id || uid(), status: "closed", closedAt: closing.closedAt, closedBy: closing.closedBy, closingAmount: countedTotal, difference: diff, montoRetirado };
      const entry = addLog("CIERRE", `${regLabel(storeId, registerId)} ${shift}: esperado ${fmt(expectedCash)} contado ${fmt(countedTotal)} dif ${fmt(diff)}`);
      const auditLog = [...state.auditLog, entry];

      await upsertShift(updatedShift);
      await insertClosing(closing);
      await insertAudit(entry);
      save({ ...state, shifts: { ...state.shifts, [key]: updatedShift }, closings: [...state.closings, closing], auditLog });
      closeModal();
      if (!session || session?.role !== "admin") logout();
      showToast(diff === 0 ? `✓ Cierre perfecto • Retirado: ${fmt(montoRetirado)}` : `Dif: ${fmt(diff)} • Retirado: ${fmt(montoRetirado)}`, diff === 0 ? "success" : "error");
    } catch (err) {
      console.error("Error al cerrar turno:", err);
      showToast("Error al cerrar turno. Intenta de nuevo.", "error");
    }
  };

  const transferFunds = async (fromClosingId, toStoreId, toRegId, toShift, amount, description) => {
    const fc = state.closings.find(c => c.id === fromClosingId);
    if (!fc) return;
    if (fc.storeId !== toStoreId) { showToast("Fondos solo dentro de la misma tienda", "error"); return; }
    if (amount > getClosingAvailable(fc)) { showToast("Mayor al disponible", "error"); return; }

    const updClosings = state.closings.map(c => c.id === fromClosingId ? { ...c, transferredOut: (c.transferredOut || 0) + amount } : c);
    const movement = {
      id: uid(), type: "ingreso", amount,
      description: description || `Fondos desde ${regLabel(fc.storeId, fc.registerId)} (${fc.shift})`,
      method: "efectivo", storeId: toStoreId, registerId: toRegId, shift: toShift,
      date: todayStr(), ts: nowISO(), registeredBy: session?.name || "admin",
      isTransfer: true, fromClosingId,
    };
    const transfer = {
      id: uid(), fromClosingId, fromStore: fc.storeId, fromRegister: fc.registerId, fromShift: fc.shift, fromDate: fc.date,
      toStore: toStoreId, toRegister: toRegId, toShift, toDate: todayStr(), amount, executedBy: session?.name || "admin", ts: nowISO(),
    };
    const entry = addLog("TRANSFERENCIA", `${fmt(amount)} de ${regLabel(fc.storeId, fc.registerId)} → ${regLabel(toStoreId, toRegId)}`);
    const auditLog = [...state.auditLog, entry];
    const updatedClosing = updClosings.find(c => c.id === fromClosingId);

    if (updatedClosing) await upsertClosing(updatedClosing);
    await insertMovement(movement);
    await insertTransfer(transfer);
    await insertAudit(entry);

    save({ ...state, closings: updClosings, movements: [...state.movements, movement], transfers: [...(state.transfers || []), transfer], auditLog });
    closeModal();
    showToast(`${fmt(amount)} transferidos`);
  };

  const withdrawFromClosing = async (closingId, amount, note) => {
    const fc = state.closings.find(c => c.id === closingId);
    if (!fc) return;
    const available = getClosingAvailable(fc);
    if (amount > available) { showToast("Mayor al disponible", "error"); return; }

    const withdrawal = {
      id: uid(), amount, note: note || "", ts: nowISO(),
      by: session?.name || "admin",
    };

    const updClosings = state.closings.map(c => c.id === closingId ? {
      ...c,
      adminWithdrawn: (c.adminWithdrawn || 0) + amount,
      adminWithdrawals: [...(c.adminWithdrawals || []), withdrawal],
    } : c);

    const detail = `${fmt(amount)} de ${regLabel(fc.storeId, fc.registerId)} (${fc.shift})${note ? ` • ${note}` : ""}`;
    const entry = addLog("RETIRO ADMIN", detail);
    const auditLog = [...state.auditLog, entry];
    const updatedClosing = updClosings.find(c => c.id === closingId);
    if (updatedClosing) await upsertClosing(updatedClosing);
    await insertAudit(entry);

    save({ ...state, closings: updClosings, auditLog });
    closeModal();
    showToast(`Retiro: ${fmt(amount)}`);
  };

  const addMovement = async (mov) => {
    try {
      const m = { ...mov, id: uid(), date: todayStr(), ts: nowISO(), registeredBy: session?.name || "admin" };
      const entry = addLog("MOVIMIENTO", `${mov.type === "ingreso" ? "+" : "−"}${fmt(mov.amount)} ${regLabel(mov.storeId, mov.registerId)} (${mov.shift})`);
      const auditLog = [...state.auditLog, entry];
      await insertMovement(m);
      await insertAudit(entry);
      save({ ...state, movements: [...state.movements, m], auditLog });
      closeModal();
      showToast(`${mov.type === "ingreso" ? "Ingreso" : "Egreso"} registrado`);
    } catch (err) {
      console.error("Error al registrar movimiento:", err);
      showToast("Error al registrar movimiento. Intenta de nuevo.", "error");
    }
  };

  const resetData = async () => {
    if (!confirm("¿Borrar TODOS los datos?")) return;
    if (hasSupabase) {
      await supabase.from("movements").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      await supabase.from("transfers").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      await supabase.from("closings").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      await supabase.from("shifts").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      await supabase.from("audit_log").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      try { await storage.set("admin_pin", DEFAULT_PIN); } catch { }
    }
    save(initState());
    showToast("Datos reiniciados");
  };

  const checkPin = (pin) => {
    if (pin === (state.adminPin || DEFAULT_PIN)) {
      setSession({ name: "Admin", role: "admin" });
      setScreen("adminPickStore");
      return true;
    }
    return false;
  };

  // ── RENDER ─────────────────────────────────────────────────────
  if (!loaded) return <div style={S.loading}>Cargando...</div>;

  const toastEl = toast && <div style={{ ...S.toast, ...(toast.type === "error" ? S.toastErr : {}) }}>{toast.msg}</div>;

  // Render onboarding
  if (screen === "pickStore") return <><PickStore setSelStore={setSelStore} setScreen={setScreen} setAdminPin={() => { }} />{toastEl}</>;
  if (screen === "pickRegister") return <><PickRegister selStore={selStore} setSelReg={setSelReg} setScreen={setScreen} />{toastEl}</>;
  if (screen === "pickShift") return <><PickShift selStore={selStore} selReg={selReg} setSelShift={setSelShift} setScreen={setScreen} getShift={getShift} />{toastEl}</>;
  if (screen === "enterName") return <><EnterName selStore={selStore} selReg={selReg} selShift={selShift} setSelName={setSelName} selName={selName} setSession={setSession} setScreen={setScreen} getShift={getShift} />{toastEl}</>;
  if (screen === "adminLogin") return <><AdminLogin checkPin={checkPin} setScreen={setScreen} showToast={showToast} />{toastEl}</>;
  if (screen === "adminPickStore") return <><AdminPickStore setAdminStore={setAdminStore} setScreen={setScreen} setSession={setSession} />{toastEl}</>;

  // Render Main App
  const isAdmin = screen === "admin";
  const curStore = isAdmin ? adminStore : session?.storeId;
  const curStoreName = curStore === "all" ? "Todas" : STORES.find(s => s.id === curStore)?.name;

  // Indicador de turno activo (#3)
  const currentShift = !isAdmin && session ? getShift(session.storeId, session.registerId, todayStr(), session.shift) : null;
  const shiftStatus = currentShift?.status === "open" ? "open" : "closed";

  return (
    <div style={{ ...S.app, minHeight: '100svh', display: 'flex', flexDirection: 'column', overflow: 'visible' }}>
      <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />

      {/* Header */}
      <header style={{ ...S.header, flexShrink: 0 }}>
        <div style={S.hLeft}>
          <div style={S.logo}>₡</div>
          <div>
            <div style={S.hTitle}>CajaControl</div>
            <div style={S.hSub}>
              {isAdmin ? `Admin • ${curStoreName}` : `${session?.name} • ${curStoreName} • ${REGISTERS_PER_STORE.find(r => r.id === session?.registerId)?.name} • ${session?.shift}`}
            </div>
          </div>
        </div>
        <div style={S.hRight}>
          {/* Indicador de estado del turno (#3) */}
          {!isAdmin && (
            <div style={{
              padding: '6px 12px',
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: shiftStatus === 'open' ? '#dcfce7' : '#fee2e2',
              color: shiftStatus === 'open' ? '#166534' : '#991b1b',
              border: `1px solid ${shiftStatus === 'open' ? '#bbf7d0' : '#fecaca'}`
            }}>
              <span style={{ fontSize: 10 }}>{shiftStatus === 'open' ? '🟢' : '🔴'}</span>
              {shiftStatus === 'open' ? 'Turno Abierto' : 'Turno Cerrado'}
            </div>
          )}
          <div style={S.dateBadge}>{fmtDate(new Date())}</div>
          <button style={S.logoutBtn} onClick={logout}>Salir</button>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: 'env(safe-area-inset-bottom)' }}>
        {toastEl}

        {isAdmin ? (
          <AdminPanel
            state={state}
            adminTab={adminTab}
            setAdminTab={setAdminTab}
            filterDate={filterDate}
            setFilterDate={setFilterDate}
            storeFilter={adminStore}
            getShift={getShift}
            getActiveShifts={getActiveShifts}
            getShiftMovements={getShiftMovements}
            openModal={openModal}
            resetData={resetData}
            setAdminStore={setAdminStore}
            setScreen={setScreen}
            save={save}
          />
        ) : (
          <CajeroPanel
            session={session}
            state={state}
            getShift={getShift}
            getShiftMovements={getShiftMovements}
            openModal={openModal}
          />
        )}
      </main>

      {/* Modals */}
      {modal === "openShift" && <ShiftOpenModal data={modalData} onConfirm={openShift} onClose={closeModal} />}
      {modal === "closeShift" && (
        <ShiftCloseModal
          data={modalData}
          shiftData={getShift(modalData.storeId, modalData.registerId, todayStr(), modalData.shift)}
          moves={getRegisterMovements(modalData.storeId, modalData.registerId, todayStr()).filter(m => m.shift === modalData.shift)}
          onConfirm={closeShift}
          onClose={closeModal}
        />
      )}
      {modal === "ingreso" && <MovementModal type="ingreso" data={modalData} onConfirm={addMovement} onClose={closeModal} />}
      {modal === "egreso" && <MovementModal type="egreso" data={modalData} onConfirm={addMovement} onClose={closeModal} />}
      {modal === "fundTransfer" && <FundTransferModal data={modalData} closings={state.closings} onConfirm={transferFunds} onClose={closeModal} />}
      {modal === "closingDetail" && (
        <ClosingDetailModal
          data={modalData}
          onClose={closeModal}
          onWithdraw={() => { closeModal(); openModal("adminWithdraw", modalData); }}
        />
      )}
      {modal === "adminWithdraw" && (
        <AdminWithdrawModal
          data={modalData}
          onConfirm={withdrawFromClosing}
          onClose={closeModal}
        />
      )}
    </div>
  );
}

// Componente principal con autenticación
function AppWithAuth() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f8fafc"
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>💰</div>
          <div style={{ fontSize: 16, color: "#64748b" }}>Cargando...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return <App />;
}

// Exportar con AuthProvider
export default function AppRoot() {
  return (
    <AuthProvider>
      <AppWithAuth />
    </AuthProvider>
  );
}