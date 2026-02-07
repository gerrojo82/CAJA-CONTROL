import { useState } from "react";
import Modal from "../components/Modal";
import { S } from "../styles/styles";

export default function ChangePinModal({ currentPin, onSave, onClose }) {
    const [step, setStep] = useState("current"); // current, new, confirm
    const [pin, setPin] = useState("");
    const [newPin, setNewPin] = useState("");
    const [error, setError] = useState("");

    const title = step === "current" ? "PIN actual" : step === "new" ? "Nuevo PIN" : "Confirmar nuevo PIN";
    const maxLen = 6;

    const handleKey = (k) => {
        if (k === "del") { setPin(p => p.slice(0, -1)); setError(""); }
        else if (k === "ok") {
            if (step === "current") {
                if (pin === currentPin) { setStep("new"); setPin(""); setError(""); }
                else { setError("PIN incorrecto"); setPin(""); }
            } else if (step === "new") {
                if (pin.length < 4) { setError("Mínimo 4 dígitos"); return; }
                setNewPin(pin); setStep("confirm"); setPin(""); setError("");
            } else {
                if (pin === newPin) { onSave(pin); }
                else { setError("No coinciden"); setPin(""); }
            }
        } else if (pin.length < maxLen) { setPin(p => p + k); setError(""); }
    };

    return (
        <Modal title="🔑 Cambiar PIN" onClose={onClose}>
            <p style={{ fontSize: 13, fontWeight: 700, color: "#475569", textAlign: "center", marginBottom: 12 }}>{title}</p>
            <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 14 }}>
                {[0, 1, 2, 3, 4, 5].map(i => (
                    <div key={i} style={{ width: 12, height: 12, borderRadius: "50%", background: i < pin.length ? "#0f172a" : "#e2e8f0", transition: "all 0.15s" }} />
                ))}
            </div>
            {error && <div style={{ ...S.errorMsg, textAlign: "center", marginBottom: 8 }}>{error}</div>}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, maxWidth: 240, margin: "0 auto" }}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, "del", 0, "ok"].map(k => (
                    <button key={k} onClick={() => handleKey(String(k))}
                        style={{
                            padding: "14px 0", borderRadius: 12, border: "1px solid #e2e8f0", cursor: "pointer", fontSize: k === "del" || k === "ok" ? 14 : 20, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace",
                            color: k === "ok" ? "#fff" : k === "del" ? "#dc2626" : "#0f172a",
                            background: k === "ok" ? "#16a34a" : k === "del" ? "#fef2f2" : "#f8fafc"
                        }}>
                        {k === "del" ? "⌫" : k === "ok" ? "✓" : k}
                    </button>
                ))}
            </div>
            <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 14 }}>
                {["current", "new", "confirm"].map((s, i) => (
                    <div key={s} style={{ width: 8, height: 8, borderRadius: "50%", background: step === s ? "#3b82f6" : "#e2e8f0" }} />
                ))}
            </div>
            <p style={{ fontSize: 11, color: "#94a3b8", textAlign: "center", marginTop: 6 }}>Paso {step === "current" ? "1/3" : step === "new" ? "2/3" : "3/3"}</p>
        </Modal>
    );
}
