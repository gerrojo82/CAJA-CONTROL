import { STORES, REGISTERS_PER_STORE } from "../../utils/constants";
import { S } from "../../styles/styles";

export default function PickRegister({ selStore, setSelReg, setScreen }) {
    const storeName = STORES.find(s => s.id === selStore)?.name;
    const font = <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />;

    return (
        <div style={S.onboardBg}>{font}
            <div style={S.onboardCard}>
                <button style={S.backBtn} onClick={() => setScreen("pickStore")}>← Volver</button>
                <div style={S.onboardIcon}>₡</div>
                <h2 style={S.onboardTitle}>{storeName}</h2>
                <p style={S.onboardSub}>¿Qué caja vas a usar?</p>
                <div style={{ display: "flex", gap: 10, width: "100%" }}>
                    {REGISTERS_PER_STORE.map(r => (
                        <button key={r.id} style={{ ...S.storeBtn, flex: 1 }} onClick={() => { setSelReg(r.id); setScreen("pickShift"); }}>
                            <span style={{ fontSize: 24 }}>🖥️</span>
                            <span style={{ fontSize: 16, fontWeight: 800 }}>{r.name}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
