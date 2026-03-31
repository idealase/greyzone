import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { login, register } from "../api/auth";
import { useAuthStore } from "../stores/authStore";
import { AuthResponse } from "../types/auth";

export default function LoginPage() {
  const [callsign, setCallsign] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  const loginMutation = useMutation({
    mutationFn: login,
    onSuccess: (auth: AuthResponse) => {
      setAuth({
        user: auth.user,
        accessToken: auth.access_token,
        refreshToken: auth.refresh_token,
      });
      navigate("/");
    },
    onError: (err: Error) => {
      setError(err.message || "Failed to authenticate");
    },
  });

  const registerMutation = useMutation({
    mutationFn: register,
    onSuccess: (auth: AuthResponse) => {
      setAuth({
        user: auth.user,
        accessToken: auth.access_token,
        refreshToken: auth.refresh_token,
      });
      navigate("/");
    },
    onError: (err: Error) => {
      setError(err.message || "Failed to create operator profile");
    },
  });

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = callsign.trim();
    const trimmedPassword = password.trim();
    if (!trimmed || !trimmedPassword) {
      setError("Callsign and password are required");
      return;
    }
    setError("");
    loginMutation.mutate({ username: trimmed, password: trimmedPassword });
  }

  function handleRegister() {
    const trimmed = callsign.trim();
    const trimmedPassword = password.trim();
    if (!trimmed || !trimmedPassword) {
      setError("Callsign and password are required");
      return;
    }
    setError("");
    registerMutation.mutate({
      username: trimmed,
      display_name: trimmed,
      password: trimmedPassword,
    });
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "var(--bg-primary)",
        padding: "2rem",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "420px",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          <h1
            style={{
              fontSize: "2rem",
              fontWeight: 700,
              letterSpacing: "0.15em",
              color: "var(--text-primary)",
              marginBottom: "0.5rem",
            }}
          >
            GREYZONE
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
            Distributed Battlespace Simulation
          </p>
        </div>

        <div
          className="card"
          style={{ padding: "1.5rem", marginBottom: "1.5rem" }}
        >
          <div
            className="card__title"
            style={{ marginBottom: "1rem", fontSize: "0.95rem" }}
          >
            New Operator
          </div>
          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: "1rem" }}>
              <label
                htmlFor="callsign"
                style={{
                  display: "block",
                  marginBottom: "0.4rem",
                  fontSize: "0.8rem",
                  color: "var(--text-secondary)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Callsign
              </label>
              <input
                id="callsign"
                type="text"
                value={callsign}
                onChange={(e) => setCallsign(e.target.value)}
                placeholder="Enter your callsign"
                autoFocus
                style={{
                  width: "100%",
                  padding: "0.6rem 0.75rem",
                  backgroundColor: "var(--bg-primary)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius)",
                  color: "var(--text-primary)",
                  fontSize: "0.9rem",
                  outline: "none",
                }}
              />
            </div>
            <div style={{ marginBottom: "1rem" }}>
              <label
                htmlFor="password"
                style={{
                  display: "block",
                  marginBottom: "0.4rem",
                  fontSize: "0.8rem",
                  color: "var(--text-secondary)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                style={{
                  width: "100%",
                  padding: "0.6rem 0.75rem",
                  backgroundColor: "var(--bg-primary)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius)",
                  color: "var(--text-primary)",
                  fontSize: "0.9rem",
                  outline: "none",
                }}
              />
            </div>
            {error && (
              <p
                style={{
                  color: "var(--accent-red)",
                  fontSize: "0.8rem",
                  marginBottom: "0.75rem",
                }}
              >
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={loginMutation.isPending || registerMutation.isPending}
              style={{
                width: "100%",
                padding: "0.6rem",
                backgroundColor: "var(--accent-blue)",
                color: "#fff",
                border: "none",
                borderRadius: "var(--radius)",
                fontSize: "0.85rem",
                fontWeight: 600,
                cursor:
                  loginMutation.isPending || registerMutation.isPending
                    ? "wait"
                    : "pointer",
                letterSpacing: "0.04em",
                opacity:
                  loginMutation.isPending || registerMutation.isPending
                    ? 0.7
                    : 1,
              }}
            >
              {loginMutation.isPending ? "Signing in..." : "Sign In"}
            </button>
            <button
              type="button"
              onClick={handleRegister}
              disabled={loginMutation.isPending || registerMutation.isPending}
              style={{
                width: "100%",
                marginTop: "0.6rem",
                padding: "0.6rem",
                backgroundColor: "var(--bg-tertiary)",
                color: "var(--text-primary)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius)",
                fontSize: "0.85rem",
                fontWeight: 600,
                cursor:
                  loginMutation.isPending || registerMutation.isPending
                    ? "wait"
                    : "pointer",
              }}
            >
              {registerMutation.isPending ? "Registering..." : "Register"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
