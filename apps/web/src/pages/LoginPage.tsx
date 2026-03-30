import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { createUser, listUsers } from "../api/users";
import { useAuthStore } from "../stores/authStore";
import { UserRead } from "../types/user";

export default function LoginPage() {
  const [callsign, setCallsign] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const setUser = useAuthStore((s) => s.setUser);

  const { data: existingUsers, isLoading: usersLoading } = useQuery({
    queryKey: ["users"],
    queryFn: listUsers,
  });

  const createMutation = useMutation({
    mutationFn: createUser,
    onSuccess: (user: UserRead) => {
      setUser(user);
      navigate("/");
    },
    onError: (err: Error) => {
      setError(err.message || "Failed to create operator profile");
    },
  });

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = callsign.trim();
    if (!trimmed) {
      setError("Callsign is required");
      return;
    }
    setError("");
    createMutation.mutate({ username: trimmed, display_name: trimmed });
  }

  function handleSelectUser(user: UserRead) {
    setUser(user);
    navigate("/");
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
          <form onSubmit={handleCreate}>
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
              disabled={createMutation.isPending}
              style={{
                width: "100%",
                padding: "0.6rem",
                backgroundColor: "var(--accent-blue)",
                color: "#fff",
                border: "none",
                borderRadius: "var(--radius)",
                fontSize: "0.85rem",
                fontWeight: 600,
                cursor: createMutation.isPending ? "wait" : "pointer",
                letterSpacing: "0.04em",
                opacity: createMutation.isPending ? 0.7 : 1,
              }}
            >
              {createMutation.isPending ? "Deploying..." : "Enter Battlespace"}
            </button>
          </form>
        </div>

        {!usersLoading && existingUsers && existingUsers.length > 0 && (
          <div className="card" style={{ padding: "1.5rem" }}>
            <div
              className="card__title"
              style={{ marginBottom: "1rem", fontSize: "0.95rem" }}
            >
              Returning Operator
            </div>
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {existingUsers.map((u) => (
                <li key={u.id} style={{ marginBottom: "0.4rem" }}>
                  <button
                    onClick={() => handleSelectUser(u)}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      padding: "0.5rem 0.75rem",
                      backgroundColor: "var(--bg-tertiary)",
                      border: "1px solid var(--border)",
                      borderRadius: "var(--radius)",
                      color: "var(--text-primary)",
                      fontSize: "0.85rem",
                      cursor: "pointer",
                    }}
                  >
                    {u.display_name || u.username}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
