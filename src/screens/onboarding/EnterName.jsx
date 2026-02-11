import { STORES, REGISTERS_PER_STORE } from "../../utils/constants";
import { todayStr } from "../../utils/formatters";
import { S } from "../../styles/styles";
import { useAuth } from "../../contexts/AuthContext";

export default function EnterName({ selStore, selReg, selShift, setSelName, selName, setSession, setScreen, getShift }) {
    const { signOut } = useAuth();
    const storeName = STORES.find(s => s.id === selStore)?.name;
    const regName = REGISTERS_PER_STORE.find(r => r.id === selReg)?.name;
    const sd = getShift(selStore, selReg, todayStr(), selShift);
    const font = <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />;

    const handleLogout = async () => {
        await signOut();
    };

    return (
        <div style={S.onboardBg}>{font}
            <div style={S.onboardCard}>
                <button style={S.backBtn} onClick={() => setScreen("pickShift")}>← Volver</button>
                <div style={S.onboardIcon}>₡</div>
                <h2 style={S.onboardTitle}>{storeName} — {regName} — <span style={{ textTransform: "capitalize" }}>{selShift}</span></h2>
                <p style={S.onboardSub}>{sd ? `Turno abierto por ${sd.openedBy}` : "Turno nuevo"}</p>
                <label style={{ ...S.formLabel, color: "#94a3b8", textAlign: "left", width: "100%" }}>Tu nombre</label>
                <input style={{ ...S.formInput, background: "rgba(255,255,255,0.1)", color: "#fff", border: "1px solid rgba(255,255,255,0.2)", fontSize: 18, textAlign: "center" }}
                    placeholder="Ej: María, Carlos..."
                    value={selName} onChange={e => setSelName(e.target.value)}
                    onKeyDown={e => {
                        if (e.key === "Enter" && selName.trim()) {
                            setSession({ storeId: selStore, registerId: selReg, shift: selShift, name: selName.trim(), role: "cajero" });
                            setScreen("cajero");
                        }
                    }}
                    autoFocus />
                <button style={{ ...S.storeBtn, marginTop: 10, background: selName.trim() ? "linear-gradient(135deg,#16a34a,#15803d)" : "rgba(255,255,255,0.05)", cursor: selName.trim() ? "pointer" : "default" }}
                    disabled={!selName.trim()}
                    onClick={() => {
                        setSession({ storeId: selStore, registerId: selReg, shift: selShift, name: selName.trim(), role: "cajero" });
                        setScreen("cajero");
                    }}>
                    <span style={{ fontSize: 16, fontWeight: 800 }}>Entrar →</span>
                </button>
                <button
                    style={{
                        ...S.adminLink,
                        marginTop: 16,
                        background: "rgba(220, 38, 38, 0.15)",
                        borderColor: "rgba(220, 38, 38, 0.3)",
                        color: "#fca5a5"
                    }}
                    onClick={handleLogout}
                >
                    🚪 Cerrar sesión
                </button>
            </div>
        </div>
    );
}
