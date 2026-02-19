import { useState } from "react";
import Modal from "../components/Modal";
import { METHODS, EXPENSE_TYPES } from "../utils/constants";
import { S } from "../styles/styles";

export default function MovementModal({ type, data, onConfirm, onClose }) {
    const [form, setForm] = useState({ amount: "", description: "", method: "efectivo", category: "" });
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const isEgreso = type === "egreso";
    const canEditDetails = !isEgreso || !!form.category;
    return (
        <Modal title={isEgreso ? "Extracción / Pago" : "Ingreso"} onClose={onClose}>
            {isEgreso && <>
                <label style={S.formLabel}>Tipo</label>
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                    {EXPENSE_TYPES.map(t => (
                        <button key={t} style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid #e2e8f0", background: form.category === t ? "#0f172a" : "#f8fafc", color: form.category === t ? "#fff" : "#0f172a", fontSize: 11, fontWeight: 600, cursor: "pointer" }}
                            onClick={() => setForm({ ...form, category: t })}>{t}</button>
                    ))}
                </div>
            </>}

            <label style={S.formLabel}>Monto ($)</label>
            <input style={S.formInput} type="number" placeholder="0" value={form.amount} onChange={e => { setForm({ ...form, amount: e.target.value }); setError(""); }} autoFocus={!isEgreso} disabled={!canEditDetails} />

            <label style={S.formLabel}>Comentario</label>
            <input style={S.formInput} placeholder={isEgreso ? "Detalle del pago o ticket..." : "Detalle del ingreso..."} value={form.description} onChange={e => { setForm({ ...form, description: e.target.value }); setError(""); }} disabled={!canEditDetails} />

            <label style={S.formLabel}>Método</label>
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                {METHODS.map(m => (
                    <button key={m} style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid #e2e8f0", background: form.method === m ? "#0f172a" : "#f8fafc", color: form.method === m ? "#fff" : "#0f172a", fontSize: 11, fontWeight: 600, cursor: "pointer" }}
                        onClick={() => setForm({ ...form, method: m })}>{m}</button>
                ))}
            </div>
            {error && <div style={S.errorMsg}>{error}</div>}
            <button style={{ ...S.btnSubmit, background: isEgreso ? "#dc2626" : "#0f172a", opacity: submitting ? 0.7 : 1 }} disabled={submitting || !form.amount || !form.description || (isEgreso && !form.category)}
                onClick={async () => {
                    const a = Number(form.amount);
                    if (!a || a <= 0) { setError("Monto inválido"); return; }
                    if (!form.description.trim()) { setError("Descripción requerida"); return; }
                    if (isEgreso && !form.category) { setError("Seleccioná un tipo"); return; }
                    setSubmitting(true);
                    try {
                        await onConfirm({ ...form, amount: a, type, storeId: data.storeId, registerId: data.registerId, shift: data.shift, date: data?.date });
                    } finally {
                        setSubmitting(false);
                    }
                }}>Registrar</button>
        </Modal>
    );
}
