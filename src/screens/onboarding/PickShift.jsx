import { STORES, REGISTERS_PER_STORE, SHIFTS } from "../../utils/constants";
import { todayStr } from "../../utils/formatters";
import { S } from "../../styles/styles";

export default function PickShift({ selStore, selReg, setSelShift, setScreen, getShift }) {
    const storeName = STORES.find(s => s.id === selStore)?.name;
    const regName = REGISTERS_PER_STORE.find(r => r.id === selReg)?.name;
    const font = <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />;

    return (
        <div style={S.onboardBg}>{font}
            <div style={S.onboardCard}>
                <button style={S.backBtn} onClick={() => setScreen("pickRegister")}>← Volver</button>
                <div style={S.onboardIcon}>₡</div>
                <h2 style={S.onboardTitle}>{storeName} — {regName}</h2>
                <p style={S.onboardSub}>¿Qué turno?</p>
                <div style={{ display: "flex", gap: 10, width: "100%" }}>
                    {SHIFTS.map(shift => {
                        const sd = getShift(selStore, selReg, todayStr(), shift);
                        const isOpen = sd?.status === "open";
                        const isClosed = sd?.status === "closed";
                        return (
                            <button key={shift} style={{ ...S.storeBtn, flex: 1, opacity: isClosed ? 0.5 : 1 }}
                                disabled={isClosed}
                                onClick={() => { setSelShift(shift); setScreen("enterName"); }}>
                                <span style={{ fontSize: 22 }}>{shift === "mañana" ? "☀️" : "🌙"}</span>
                                <span style={{ fontSize: 15, fontWeight: 800, textTransform: "capitalize" }}>{shift}</span>
                                {isOpen && <span style={{ fontSize: 10, color: "#16a34a", fontWeight: 700 }}>● Abierto ({sd.openedBy})</span>}
                                {isClosed && <span style={{ fontSize: 10, color: "#94a3b8" }}>✓ Cerrado</span>}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
