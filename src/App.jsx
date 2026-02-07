
import { useState, useEffect, useCallback } from "react";

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
import { uid, todayStr, fmt, fmtDate, fmtTime } from "./utils/formatters";
import { calcCoinTotal, calcBillTotal, calcCashFlows, calcExpectedCash, getClosingAvailable } from "./utils/helpers";
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

const storage = {
  async get(key) {
    if (window?.storage?.get) {
      try { return await window.storage.get(key); } catch { }
    }
    try {
      const value = localStorage.getItem(key);
      return value ? { value } : null;
    } catch {
      return null;
    }
  },
  async set(key, value) {
    if (window?.storage?.set) {
      try { await window.storage.set(key, value); return; } catch { }
    }
    try { localStorage.setItem(key, value); } catch { }
  },
};

// ── MAIN APP ─────────────────────────────────────────────────────
export default function CajaControl() {
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

  useEffect(() => {
    (async () => {
      try {
        const res = await storage.get("cajacontrol_v5");
        if (res?.value) setState(JSON.parse(res.value));
      } catch { }
      setLoaded(true);
    })();
  }, []);

  const save = useCallback(async (ns) => {
    setState(ns);
    try { await storage.set("cajacontrol_v5", JSON.stringify(ns)); } catch { }
  }, []);

  const addLog = useCallback((action, detail) => {
    const entry = { id: uid(), user: session?.name || "sistema", action, detail, ts: new Date().toISOString() };
    return [...state.auditLog, entry];
  }, [session, state]);

  const showToast = (msg, type = "success") => { setToast({ msg, type }); setTimeout(() => setToast(null), 3500); };
  const openModal = (type, data) => { setModal(type); setModalData(data || null); };
  const closeModal = () => { setModal(null); setModalData(null); };

  const shiftKey = (storeId, regId, date, shift) => `${storeId}_${regId}_${date}_${shift}`;
  const getShift = (storeId, regId, date, shift) => state.shifts[shiftKey(storeId, regId, date, shift)];
  const getActiveShifts = (storeId, regId, date) => SHIFTS.map(s => ({ shift: s, data: getShift(storeId, regId, date, s) })).filter(x => x.data);
  const getShiftMovements = (storeId, regId, date, shift) => state.movements.filter(m => m.storeId === storeId && m.registerId === regId && m.date === date && m.shift === shift);
  const getRegisterMovements = (storeId, regId, date) => state.movements.filter(m => m.storeId === storeId && m.registerId === regId && m.date === date);

  // ── LOGOUT ─────────────────────────────────────────────────────
  const logout = () => {
    setSession(null);
    setScreen("pickStore");
    setSelStore(null); setSelReg(null); setSelShift(null); setSelName("");
    setAdminStore(null);
  };

  // ── OPERATIONS ────────────────────────────────────────────────
  const openShift = (billCount, coinCount) => {
    const { storeId, registerId, shift, name } = modalData;
    const total = calcBillTotal(billCount) + calcCoinTotal(coinCount);
    const key = shiftKey(storeId, registerId, todayStr(), shift);
    const ns = {
      storeId, registerId, shift, date: todayStr(), openedBy: name,
      openedAt: new Date().toISOString(), openingAmount: total,
      openingBills: { ...billCount }, openingCoins: { ...coinCount },
      status: "open",
    };
    const al = addLog("APERTURA", `${regLabel(storeId, registerId)} ${shift} con ${fmt(total)} por ${name}`);
    save({ ...state, shifts: { ...state.shifts, [key]: ns }, auditLog: al });
    closeModal();
    setSession({ storeId, registerId, shift, name, role: "cajero" });
    setScreen("cajero");
    showToast(`Turno abierto con ${fmt(total)}`);
  };

  const closeShift = (billCount, coinCount) => {
    const { storeId, registerId, shift } = modalData;
    const key = shiftKey(storeId, registerId, todayStr(), shift);
    const sd = state.shifts[key];
    if (!sd) return;

    const countedTotal = calcBillTotal(billCount) + calcCoinTotal(coinCount);
    const moves = getShiftMovements(storeId, registerId, todayStr(), shift);
    const { ingEfvo, egrEfvo, ingTotal, egrTotal } = calcCashFlows(moves);

    const expectedCash = sd.openingAmount + ingEfvo - egrEfvo;
    const diff = countedTotal - expectedCash;
    const montoRetirado = Math.max(0, countedTotal - sd.openingAmount);

    const closing = {
      id: uid(), storeId, registerId, shift, date: todayStr(), closedBy: session?.name || sd.openedBy,
      closedAt: new Date().toISOString(),
      openingAmount: sd.openingAmount, ingresosEfectivo: ingEfvo, egresosEfectivo: egrEfvo,
      ingresosTotal: ingTotal, egresosTotal: egrTotal,
      expectedCash, countedCash: countedTotal, difference: diff, montoRetirado,
      transferredOut: 0, adminWithdrawn: 0, adminWithdrawals: [],
      closingBills: { ...billCount }, closingCoins: { ...coinCount }, movements: moves,
    };

    const updatedShift = { ...sd, status: "closed", closedAt: closing.closedAt, closedBy: closing.closedBy, closingAmount: countedTotal, difference: diff, montoRetirado };
    const al = addLog("CIERRE", `${regLabel(storeId, registerId)} ${shift}: esperado ${fmt(expectedCash)} contado ${fmt(countedTotal)} dif ${fmt(diff)}`);

    save({ ...state, shifts: { ...state.shifts, [key]: updatedShift }, closings: [...state.closings, closing], auditLog: al });
    closeModal();
    if (!session || session?.role !== "admin") logout();
    showToast(diff === 0 ? `✓ Cierre perfecto • Retirado: ${fmt(montoRetirado)}` : `Dif: ${fmt(diff)} • Retirado: ${fmt(montoRetirado)}`, diff === 0 ? "success" : "error");
  };

  const transferFunds = (fromClosingId, toStoreId, toRegId, toShift, amount, description) => {
    const fc = state.closings.find(c => c.id === fromClosingId);
    if (!fc) return;
    if (fc.storeId !== toStoreId) { showToast("Fondos solo dentro de la misma tienda", "error"); return; }
    if (amount > getClosingAvailable(fc)) { showToast("Mayor al disponible", "error"); return; }

    const updClosings = state.closings.map(c => c.id === fromClosingId ? { ...c, transferredOut: (c.transferredOut || 0) + amount } : c);
    const movement = {
      id: uid(), type: "ingreso", amount,
      description: description || `Fondos desde ${regLabel(fc.storeId, fc.registerId)} (${fc.shift})`,
      method: "efectivo", storeId: toStoreId, registerId: toRegId, shift: toShift,
      date: todayStr(), ts: new Date().toISOString(), registeredBy: session?.name || "admin",
      isTransfer: true, fromClosingId,
    };
    const transfer = {
      id: uid(), fromClosingId, fromStore: fc.storeId, fromRegister: fc.registerId, fromShift: fc.shift, fromDate: fc.date,
      toStore: toStoreId, toRegister: toRegId, toShift, toDate: todayStr(), amount, executedBy: session?.name || "admin", ts: new Date().toISOString(),
    };
    const al = addLog("TRANSFERENCIA", `${fmt(amount)} de ${regLabel(fc.storeId, fc.registerId)} → ${regLabel(toStoreId, toRegId)}`);
    save({ ...state, closings: updClosings, movements: [...state.movements, movement], transfers: [...(state.transfers || []), transfer], auditLog: al });
    closeModal();
    showToast(`${fmt(amount)} transferidos`);
  };

  const withdrawFromClosing = (closingId, amount, note) => {
    const fc = state.closings.find(c => c.id === closingId);
    if (!fc) return;
    const available = getClosingAvailable(fc);
    if (amount > available) { showToast("Mayor al disponible", "error"); return; }

    const withdrawal = {
      id: uid(), amount, note: note || "", ts: new Date().toISOString(),
      by: session?.name || "admin",
    };

    const updClosings = state.closings.map(c => c.id === closingId ? {
      ...c,
      adminWithdrawn: (c.adminWithdrawn || 0) + amount,
      adminWithdrawals: [...(c.adminWithdrawals || []), withdrawal],
    } : c);

    const detail = `${fmt(amount)} de ${regLabel(fc.storeId, fc.registerId)} (${fc.shift})${note ? ` • ${note}` : ""}`;
    const al = addLog("RETIRO ADMIN", detail);

    save({ ...state, closings: updClosings, auditLog: al });
    closeModal();
    showToast(`Retiro: ${fmt(amount)}`);
  };

  const addMovement = (mov) => {
    const m = { ...mov, id: uid(), date: todayStr(), ts: new Date().toISOString(), registeredBy: session?.name || "admin" };
    const al = addLog("MOVIMIENTO", `${mov.type === "ingreso" ? "+" : "−"}${fmt(mov.amount)} ${regLabel(mov.storeId, mov.registerId)} (${mov.shift})`);
    save({ ...state, movements: [...state.movements, m], auditLog: al });
    closeModal();
    showToast(`${mov.type === "ingreso" ? "Ingreso" : "Egreso"} registrado`);
  };

  const resetData = () => { if (confirm("¿Borrar TODOS los datos?")) { save(initState()); showToast("Datos reiniciados"); } };

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