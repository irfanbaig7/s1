import { useState } from "react";
import axios from "axios";

const API = "http://localhost:5000/api/auth";

const AuthPage = ({ onAuth, onBack }) => {
  const [mode, setMode]         = useState("login"); // login | register
  const [name, setName]         = useState("");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  const handleSubmit = async () => {
    setError("");
    if (!email || !password || (mode === "register" && !name)) {
      setError("Sab fields bharo yaar");
      return;
    }
    setLoading(true);
    try {
      const url  = mode === "login" ? `${API}/login` : `${API}/register`;
      const body = mode === "login" ? { email, password } : { name, email, password };
      const res  = await axios.post(url, body);
      onAuth(res.data.user, res.data.token);
    } catch (err) {
      setError(err.response?.data?.message || "Kuch gadbad ho gayi");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#080810",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'Georgia', serif",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Background glow */}
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none",
        background: "radial-gradient(ellipse at 30% 50%, #9b5de520 0%, transparent 60%), radial-gradient(ellipse at 70% 50%, #e6394618 0%, transparent 60%)",
      }} />

      {/* Back button */}
      <button
        onClick={onBack}
        style={{
          position: "fixed", top: "28px", left: "32px",
          background: "transparent", border: "none",
          color: "#ffffff44", fontSize: "14px", cursor: "pointer",
          letterSpacing: "1px", fontFamily: "inherit",
          display: "flex", alignItems: "center", gap: "8px",
        }}
      >
        ← Wapas
      </button>

      {/* Card */}
      <div style={{
        position: "relative", zIndex: 5,
        width: "100%", maxWidth: "400px", margin: "24px",
        padding: "48px 40px",
        background: "#ffffff08",
        backdropFilter: "blur(20px)",
        border: "1px solid #ffffff15",
        borderRadius: "24px",
        boxShadow: "0 40px 80px #00000060",
      }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "36px" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            width: "52px", height: "52px", borderRadius: "14px",
            background: "linear-gradient(135deg, #e63946, #9b5de5)",
            fontSize: "24px", marginBottom: "16px",
          }}>🎙</div>
          <div style={{ fontSize: "24px", fontWeight: "bold" }}>StoryForge</div>
          <div style={{ fontSize: "13px", color: "#ffffff44", marginTop: "6px", fontStyle: "italic" }}>
            {mode === "login" ? "Wapas aa gaye?" : "Nayi kahani shuru karo"}
          </div>
        </div>

        {/* Toggle */}
        <div style={{
          display: "flex", background: "#ffffff08",
          borderRadius: "12px", padding: "4px",
          marginBottom: "28px",
        }}>
          {["login", "register"].map(m => (
            <button key={m}
              onClick={() => { setMode(m); setError(""); }}
              style={{
                flex: 1, padding: "10px",
                borderRadius: "9px", border: "none",
                background: mode === m ? "#ffffff15" : "transparent",
                color: mode === m ? "#fff" : "#ffffff44",
                fontSize: "13px", cursor: "pointer",
                fontFamily: "inherit", letterSpacing: "1px",
                transition: "all 0.2s ease",
              }}
            >
              {m === "login" ? "Login" : "Register"}
            </button>
          ))}
        </div>

        {/* Fields */}
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {mode === "register" && (
            <input
              placeholder="Tumhara naam"
              value={name}
              onChange={e => setName(e.target.value)}
              style={inputStyle}
            />
          )}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            style={inputStyle}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSubmit()}
            style={inputStyle}
          />
        </div>

        {/* Error */}
        {error && (
          <div style={{
            marginTop: "14px", padding: "12px 16px",
            background: "#e6394618", border: "1px solid #e6394633",
            borderRadius: "10px", fontSize: "13px", color: "#e63946",
          }}>
            ⚠️ {error}
          </div>
        )}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{
            width: "100%", marginTop: "24px",
            padding: "16px", borderRadius: "12px", border: "none",
            background: loading
              ? "#ffffff15"
              : "linear-gradient(135deg, #e63946, #9b5de5)",
            color: "#fff", fontSize: "15px", fontWeight: "bold",
            cursor: loading ? "not-allowed" : "pointer",
            letterSpacing: "1px", fontFamily: "inherit",
            transition: "all 0.3s ease",
            boxShadow: loading ? "none" : "0 8px 30px #e6394430",
          }}
        >
          {loading ? "..." : mode === "login" ? "Andar Aao" : "Shuru Karo"}
        </button>
      </div>
    </div>
  );
};

const inputStyle = {
  padding: "14px 16px",
  background: "#ffffff08",
  border: "1px solid #ffffff15",
  borderRadius: "10px",
  color: "#fff", fontSize: "14px",
  outline: "none", fontFamily: "Georgia, serif",
  transition: "border 0.2s ease",
  width: "100%", boxSizing: "border-box",
};

export default AuthPage;