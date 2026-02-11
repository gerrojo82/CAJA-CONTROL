import { fmt } from "../utils/formatters";

export default function SimpleBarChart({ data, title, height = 200 }) {
    if (!data || data.length === 0) {
        return (
            <div style={{ padding: 20, textAlign: "center", color: "#94a3b8", fontSize: 13 }}>
                No hay datos para mostrar
            </div>
        );
    }

    const maxValue = Math.max(...data.map(d => d.value));
    const minValue = Math.min(0, ...data.map(d => d.value));
    const range = maxValue - minValue;

    return (
        <div style={{ padding: 16, borderRadius: 12, background: "#fff", border: "1px solid #e2e8f0" }}>
            {title && <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12, color: "#0f172a" }}>{title}</div>}
            <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height, padding: "10px 0" }}>
                {data.map((item, idx) => {
                    const barHeight = range > 0 ? ((item.value - minValue) / range) * 100 : 0;
                    const isNegative = item.value < 0;

                    return (
                        <div key={idx} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                            <div style={{ fontSize: 11, fontWeight: 600, fontFamily: "'JetBrains Mono', monospace", color: isNegative ? "#dc2626" : "#16a34a", height: 20 }}>
                                {item.value !== 0 && fmt(item.value)}
                            </div>
                            <div style={{
                                width: "100%",
                                height: `${Math.max(barHeight, 5)}%`,
                                background: isNegative ? "linear-gradient(180deg, #fca5a5, #dc2626)" : "linear-gradient(180deg, #86efac, #16a34a)",
                                borderRadius: 4,
                                transition: "all 0.3s ease",
                                boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                                position: "relative"
                            }}>
                                <div style={{
                                    position: "absolute",
                                    top: -4,
                                    left: 0,
                                    right: 0,
                                    height: 4,
                                    background: isNegative ? "#dc2626" : "#16a34a",
                                    borderRadius: "4px 4px 0 0",
                                    opacity: 0.5
                                }} />
                            </div>
                            <div style={{ fontSize: 10, color: "#64748b", fontWeight: 600, marginTop: 4, textAlign: "center", wordBreak: "break-word" }}>
                                {item.label}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
