import { useState } from "react";
import Modal from "../components/Modal";
import { fmt, fmtDate, regLabel } from "../utils/formatters";
import { getClosingAvailable } from "../utils/helpers";
import { S } from "../styles/styles";

export default function AdminWithdrawModal({ data: closing, onConfirm, onClose }) {
    const [amount, setAmount] = useState("");
    const [note, setNote] = useState("");
    const [error, setError] = useState("");

    const available = getClosingAvailable(closing);
    const amt = Number(amount) || 0;

    return (
        <Modal title="Retiro Admin" onClose={onClose} wide>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, fontSize: 12 }}>
                <span style={{ fontWeight: 700 }}>{regLabel(closing.storeId, closing.registerId)} — <span style={{ textTransform: "capitalize" }}>{closing.shift}</span></span>
                <span style={{ color: "#94a3b8" }}>{fmtDate(closing.date)} • {closing.closedBy}</span>
            </div>
            <div style={{ padding: 10, borderRadius: 8, background: "#f0fdf4", border: "1px solid #bbf7d0", marginBottom: 10, fontSize: 12 }}>
                Disponible: <strong style={{ color: "#16a34a" }}>{fmt(available)}</strong>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <label style={S.formLabel}>Monto</label>
                <button style={S.fundMaxBtn} onClick={() => setAmount(String(available))}>Max {fmt(available)}</button>
            </div>
            <input style={S.formInput} type="number" placeholder="0" value={amount} onChange={e => { setAmount(e.target.value); setError(""); }} autoFocus />

            <label style={S.formLabel}>Nota (opcional)</label>
            <input style={S.formInput} placeholder="Ej: retiro diario" value={note} onChange={e => setNote(e.target.value)} />

            {error && <div style={S.errorMsg}>{error}</div>}

            <button style={{ ...S.btnSubmit, background: "#0f172a" }} disabled={!amt}
                onClick={() => {
                    if (!amt || amt <= 0) { setError("Monto invalido"); return; }
                    if (amt > available) { setError(`Max: ${fmt(available)}`); return; }
                    onConfirm(closing.id, amt, note);
                }}>Retirar {amt > 0 ? fmt(amt) : ""}</button>
        </Modal>
    );
}
