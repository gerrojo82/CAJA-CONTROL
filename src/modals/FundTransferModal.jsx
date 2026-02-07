import { useState, useMemo } from "react";
import Modal from "../components/Modal";
import { fmt, fmtDate, regLabel } from "../utils/formatters";
import { getClosingAvailable } from "../utils/helpers";
import { S } from "../styles/styles";

export default function FundTransferModal({ data, closings, onConfirm, onClose }) {
    const [selId, setSelId] = useState("");
    const [amount, setAmount] = useState("");
    const [desc, setDesc] = useState("");
    const [error, setError] = useState("");

    const available = useMemo(() =>
        (closings || [])
            .filter(c => c.storeId === data.storeId)
            .map(c => ({ ...c, avail: getClosingAvailable(c) }))
            .filter(c => c.avail > 0)
            .sort((a, b) => new Date(b.closedAt) - new Date(a.closedAt))
        , [closings, data.storeId]);

    const sel = available.find(c => c.id === selId);
    const max = sel?.avail || 0;
    const amt = Number(amount) || 0;

    return (
        <Modal title="💰 Solicitar Fondos" onClose={onClose} wide>
            <p style={S.modalHint}>Seleccioná de qué cierre tomar fondos.</p>
            {available.length === 0 ? <div style={S.empty}>Sin fondos disponibles en esta tienda</div> : <>
                <div style={{ display: "flex", flexDirection: "column", gap: 5, marginBottom: 12 }}>
                    {available.map(c => {
                        const isSel = selId === c.id;
                        return (
                            <div key={c.id} style={{ padding: 10, borderRadius: 8, border: isSel ? "2px solid #7c3aed" : "1px solid #e2e8f0", background: isSel ? "#faf5ff" : "#fff", cursor: "pointer" }}
                                onClick={() => { setSelId(c.id); setAmount(""); setError(""); }}>
                                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                                    <span style={{ fontWeight: 700 }}>{regLabel(c.storeId, c.registerId)} — <span style={{ textTransform: "capitalize" }}>{c.shift}</span></span>
                                    <strong style={{ color: "#16a34a", fontFamily: "'JetBrains Mono', monospace" }}>{fmt(c.avail)}</strong>
                                </div>
                                <div style={{ fontSize: 10, color: "#94a3b8" }}>{fmtDate(c.date)} • {c.closedBy}</div>
                            </div>
                        );
                    })}
                </div>
                {sel && <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <label style={S.formLabel}>Monto</label>
                        <button style={S.fundMaxBtn} onClick={() => setAmount(String(sel.avail))}>Máx {fmt(max)}</button>
                    </div>
                    <input style={S.formInput} type="number" placeholder="0" value={amount} onChange={e => { setAmount(e.target.value); setError(""); }} autoFocus />
                    <label style={S.formLabel}>Motivo (opcional)</label>
                    <input style={S.formInput} placeholder="Ej: pagar proveedor" value={desc} onChange={e => setDesc(e.target.value)} />
                </div>}
                {error && <div style={S.errorMsg}>{error}</div>}
                <button style={{ ...S.btnSubmit, background: "#7c3aed" }} disabled={!selId || !amt}
                    onClick={() => {
                        if (!amt || amt <= 0) { setError("Monto inválido"); return; }
                        if (amt > max) { setError(`Máx: ${fmt(max)}`); return; }
                        onConfirm(selId, data.storeId, data.registerId, data.shift, amt, desc);
                    }}>Transferir {amt > 0 ? fmt(amt) : ""}</button>
            </>}
        </Modal>
    );
}
