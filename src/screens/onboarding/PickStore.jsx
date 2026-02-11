import { STORES } from "../../utils/constants";
import { S } from "../../styles/styles";
import { useAuth } from "../../contexts/AuthContext";

export default function PickStore({ setSelStore, setScreen, setAdminPin }) {
    const { signOut } = useAuth();
    const font = <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />;

    const handleLogout = async () => {
        await signOut();
    };

    return (
        <div style={S.onboardBg}>{font}
            <div style={S.onboardCard}>
                <div style={S.onboardIcon}>₡</div>
                <h1 style={S.onboardTitle}>CajaControl</h1>
                <p style={S.onboardSub}>Seleccioná la tienda</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%" }}>
                    {STORES.map(s => (
                        <button key={s.id} style={S.storeBtn} onClick={() => { setSelStore(s.id); setScreen("pickRegister"); }}>
                            <span style={{ fontSize: 28 }}>{s.icon}</span>
                            <span style={{ fontSize: 18, fontWeight: 800 }}>{s.name}</span>
                        </button>
                    ))}
                </div>
                <button style={S.adminLink} onClick={() => { setAdminPin(""); setScreen("adminLogin"); }}>🔒 Entrar como Admin</button>
                <button
                    style={{
                        ...S.adminLink,
                        marginTop: 8,
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
