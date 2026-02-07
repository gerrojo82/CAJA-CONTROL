import { S } from "../styles/styles";

export default function Modal({ title, children, onClose, wide }) {
    return (
        <div style={S.overlay} onClick={onClose}>
            <div style={{ ...S.modal, ...(wide ? { maxWidth: 600 } : {}) }} onClick={e => e.stopPropagation()}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px 0" }}>
                    <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0 }}>{title}</h3>
                    <button style={{ width: 28, height: 28, borderRadius: "50%", background: "#f1f5f9", border: "none", cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={onClose}>✕</button>
                </div>
                <div style={{ padding: "10px 16px 22px" }}>{children}</div>
            </div>
        </div>
    );
}
