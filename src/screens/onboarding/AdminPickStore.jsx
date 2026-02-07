import { STORES } from "../../utils/constants";
import { S } from "../../styles/styles";

export default function AdminPickStore({ setAdminStore, setScreen, setSession }) {
    const font = <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />;

    return (
        <div style={S.onboardBg}>{font}
            <div style={S.onboardCard}>
                <button style={S.backBtn} onClick={() => { setScreen("pickStore"); setSession(null); }}>← Salir</button>
                <div style={S.onboardIcon}>📊</div>
                <h2 style={S.onboardTitle}>Panel Admin</h2>
                <p style={S.onboardSub}>¿Qué tienda querés ver?</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%" }}>
                    {STORES.map(s => (
                        <button key={s.id} style={S.storeBtn} onClick={() => { setAdminStore(s.id); setScreen("admin"); }}>
                            <span style={{ fontSize: 28 }}>{s.icon}</span>
                            <span style={{ fontSize: 18, fontWeight: 800 }}>{s.name}</span>
                        </button>
                    ))}
                    <button style={{ ...S.storeBtn, background: "linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.2))" }}
                        onClick={() => { setAdminStore("all"); setScreen("admin"); }}>
                        <span style={{ fontSize: 28 }}>📊</span>
                        <span style={{ fontSize: 18, fontWeight: 800 }}>Todas las tiendas</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
