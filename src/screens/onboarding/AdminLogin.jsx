import { useState } from "react";
import { S } from "../../styles/styles";
import { useAuth } from "../../contexts/AuthContext";

export default function AdminLogin({ checkPin, setScreen, showToast }) {
    const { signOut } = useAuth();
    const [adminPin, setAdminPin] = useState("");
    const font = <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />;

    const handleLogout = async () => {
        await signOut();
    };

    const pressKey = (k) => {
        if (k === "del") setAdminPin(p => p.slice(0, -1));
        else if (k === "ok") {
            if (checkPin(adminPin)) {
                // success handled by parent via callback or state change
            } else {
                showToast("PIN incorrecto", "error");
                setAdminPin("");
            }
        } else if (adminPin.length < 6) setAdminPin(p => p + k);
    };

    return (
        <div style={S.onboardBg}>{font}
            <div style={S.onboardCard}>
                <button style={S.backBtn} onClick={() => { setScreen("pickStore"); setAdminPin(""); }}>← Volver</button>
                <div style={{ width: 56, height: 56, borderRadius: 16, background: "linear-gradient(135deg,#dc2626,#991b1b)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 26, marginBottom: 14, boxShadow: "0 6px 20px rgba(220,38,38,0.3)" }}>🔒</div>
                <h2 style={{ ...S.onboardTitle, fontSize: 22, marginBottom: 2 }}>Administrador</h2>
                <p style={{ color: "#64748b", fontSize: 13, marginBottom: 20 }}>Ingresá el PIN</p>
                <div style={{ display: "flex", justifyContent: "center", gap: 10, marginBottom: 20 }}>
                    {[0, 1, 2, 3, 4, 5].map(i => (
                        <div key={i} style={{ width: 13, height: 13, borderRadius: "50%", background: i < adminPin.length ? "#fff" : "rgba(255,255,255,0.12)", border: i < adminPin.length ? "none" : "2px solid rgba(255,255,255,0.15)", transition: "all 0.15s", transform: i < adminPin.length ? "scale(1.2)" : "scale(1)" }} />
                    ))}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, width: "100%", maxWidth: 260, margin: "0 auto" }}>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, "del", 0, "ok"].map(k => (
                        <button key={k} onClick={() => pressKey(String(k))}
                            style={{
                                padding: "16px 0", borderRadius: 14, border: "none", cursor: "pointer",
                                fontSize: k === "del" || k === "ok" ? 16 : 22,
                                fontWeight: 700,
                                fontFamily: "'JetBrains Mono', monospace",
                                color: k === "ok" ? "#fff" : k === "del" ? "#f87171" : "#f1f5f9",
                                background: k === "ok" ? "linear-gradient(135deg,#16a34a,#15803d)"
                                    : k === "del" ? "rgba(220,38,38,0.12)"
                                        : "rgba(255,255,255,0.07)",
                                boxShadow: k === "ok" ? "0 4px 14px rgba(22,163,74,0.3)" : "none",
                                transition: "all 0.1s",
                            }}>
                            {k === "del" ? "⌫" : k === "ok" ? "✓" : k}
                        </button>
                    ))}
                </div>
                <button
                    style={{
                        ...S.adminLink,
                        marginTop: 24,
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
