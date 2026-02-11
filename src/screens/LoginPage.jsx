import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { S } from "../styles/styles";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { signIn } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { success, error: authError } = await signIn(email, password);

    if (!success) {
      setError(authError || "Error al iniciar sesión");
      setLoading(false);
    }
    // Si es exitoso, AuthContext se encargará de actualizar el estado
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      padding: 16
    }}>
      <div style={{
        width: "100%",
        maxWidth: 400,
        background: "#fff",
        borderRadius: 16,
        padding: 32,
        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
      }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>💰</div>
          <h1 style={{ fontSize: 28, fontWeight: 900, color: "#0f172a", marginBottom: 8 }}>
            CajaControl
          </h1>
          <p style={{ fontSize: 14, color: "#64748b" }}>
            Sistema de gestión de cajas
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 20 }}>
            <label style={{
              display: "block",
              fontSize: 13,
              fontWeight: 600,
              color: "#334155",
              marginBottom: 6
            }}>
              Usuario (email)
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="control-cajas@gmail.com"
              required
              autoFocus
              style={{
                width: "100%",
                padding: 12,
                fontSize: 14,
                border: "1px solid #e2e8f0",
                borderRadius: 8,
                outline: "none",
                transition: "border-color 0.2s",
                fontFamily: "inherit"
              }}
              onFocus={(e) => e.target.style.borderColor = "#667eea"}
              onBlur={(e) => e.target.style.borderColor = "#e2e8f0"}
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{
              display: "block",
              fontSize: 13,
              fontWeight: 600,
              color: "#334155",
              marginBottom: 6
            }}>
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              style={{
                width: "100%",
                padding: 12,
                fontSize: 14,
                border: "1px solid #e2e8f0",
                borderRadius: 8,
                outline: "none",
                transition: "border-color 0.2s",
                fontFamily: "inherit"
              }}
              onFocus={(e) => e.target.style.borderColor = "#667eea"}
              onBlur={(e) => e.target.style.borderColor = "#e2e8f0"}
            />
          </div>

          {error && (
            <div style={{
              padding: 12,
              borderRadius: 8,
              background: "#fef2f2",
              border: "1px solid #fecaca",
              marginBottom: 20
            }}>
              <p style={{ fontSize: 13, color: "#dc2626", margin: 0 }}>
                ⚠️ {error}
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: 14,
              fontSize: 15,
              fontWeight: 700,
              color: "#fff",
              background: loading ? "#94a3b8" : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              border: "none",
              borderRadius: 10,
              cursor: loading ? "not-allowed" : "pointer",
              transition: "transform 0.2s",
              fontFamily: "inherit"
            }}
            onMouseOver={(e) => !loading && (e.target.style.transform = "translateY(-1px)")}
            onMouseOut={(e) => e.target.style.transform = "translateY(0)"}
          >
            {loading ? "Ingresando..." : "Ingresar"}
          </button>
        </form>

        <div style={{
          marginTop: 24,
          paddingTop: 24,
          borderTop: "1px solid #e2e8f0",
          textAlign: "center",
          fontSize: 12,
          color: "#94a3b8"
        }}>
          Sistema de control de cajas v1.0
        </div>
      </div>
    </div>
  );
}
