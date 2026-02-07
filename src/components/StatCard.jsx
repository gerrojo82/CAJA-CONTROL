import { S } from "../styles/styles";

export default function StatCard({ label, value, color, sub }) {
    return (
        <div style={S.statCard}>
            <div style={{ fontSize: 12, color: "#64748b" }}>{label}</div>
            <div style={{ fontSize: 20, fontWeight: 800, color, fontFamily: "'JetBrains Mono', monospace" }}>{value}</div>
            {sub && <div style={{ fontSize: 10, color: "#94a3b8" }}>{sub}</div>}
        </div>
    );
}
