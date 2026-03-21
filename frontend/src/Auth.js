import React, { useState } from "react";
import { auth, googleProvider } from "./firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
} from "firebase/auth";

export default function Auth({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState("");

  const handleEmailAuth = async () => {
    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      onLogin();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      onLogin();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center",
      justifyContent: "center", background: "#070b14", fontFamily: "Inter, sans-serif"
    }}>
      <div style={{
        background: "rgba(15,23,42,0.9)", padding: "50px", borderRadius: "24px",
        border: "1px solid rgba(255,255,255,0.1)", width: "400px", textAlign: "center"
      }}>
        <h1 style={{
          background: "linear-gradient(to right,#60a5fa,#a855f7)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          fontSize: "2.5rem", fontWeight: "900", marginBottom: "8px"
        }}>StudySphere AI</h1>
        <p style={{ color: "#475569", marginBottom: "30px" }}>Your AI-Powered Second Brain 🧠</p>

        {error && <p style={{ color: "#f87171", marginBottom: "15px", fontSize: "0.85rem" }}>{error}</p>}

        <input
          type="email" placeholder="Email"
          value={email} onChange={e => setEmail(e.target.value)}
          style={{
            width: "100%", padding: "14px", borderRadius: "12px", marginBottom: "12px",
            background: "#0f172a", border: "1px solid #1e293b", color: "#fff",
            outline: "none", fontSize: "0.95rem", boxSizing: "border-box"
          }}
        />
        <input
          type="password" placeholder="Password"
          value={password} onChange={e => setPassword(e.target.value)}
          style={{
            width: "100%", padding: "14px", borderRadius: "12px", marginBottom: "20px",
            background: "#0f172a", border: "1px solid #1e293b", color: "#fff",
            outline: "none", fontSize: "0.95rem", boxSizing: "border-box"
          }}
        />

        <button onClick={handleEmailAuth} style={{
          width: "100%", padding: "14px", borderRadius: "12px", marginBottom: "12px",
          background: "linear-gradient(135deg,#3b82f6,#8b5cf6)", color: "#fff",
          border: "none", fontWeight: "bold", fontSize: "1rem", cursor: "pointer"
        }}>
          {isSignUp ? "Create Account" : "Sign In"}
        </button>

        <button onClick={handleGoogle} style={{
          width: "100%", padding: "14px", borderRadius: "12px", marginBottom: "20px",
          background: "#fff", color: "#1e293b",
          border: "none", fontWeight: "bold", fontSize: "1rem", cursor: "pointer"
        }}>
          🔵 Continue with Google
        </button>

        <p style={{ color: "#475569", fontSize: "0.85rem", cursor: "pointer" }}
          onClick={() => setIsSignUp(!isSignUp)}>
          {isSignUp ? "Already have an account? Sign In" : "Don't have an account? Sign Up"}
        </p>
      </div>
    </div>
  );
}