import { useParams, useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRunState } from "../hooks/useRunState";
import { useWebSocket } from "../hooks/useWebSocket";
import { useAuthStore } from "../stores/authStore";
import { useRunStore } from "../stores/runStore";
import { joinRun, startRun } from "../api/runs";
import { Role } from "../types/run";
import PlayerList from "../components/multiplayer/PlayerList";
import RoleSelector from "../components/multiplayer/RoleSelector";
import LoadingSpinner from "../components/common/LoadingSpinner";
import ConnectionBanner from "../components/common/ConnectionBanner";

export default function LobbyPage() {
  const { runId } = useParams<{ runId: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const participants = useRunStore((s) => s.participants);
  const run = useRunStore((s) => s.run);
  const queryClient = useQueryClient();

  const { runQuery } = useRunState(runId);
  useWebSocket(runId);

  const joinMutation = useMutation({
    mutationFn: (role: Role) => {
      if (!runId || !user) throw new Error("Missing run ID or user");
      return joinRun(runId, { user_id: user.id, role_id: role });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["run", runId] });
    },
  });

  const startMutation = useMutation({
    mutationFn: () => {
      if (!runId) throw new Error("Missing run ID");
      return startRun(runId);
    },
    onSuccess: () => {
      navigate(`/runs/${runId}`);
    },
  });

  const myParticipant = participants.find((p) => p.user_id === user?.id);

  if (runQuery.isLoading) {
    return (
      <div className="loading-container">
        <LoadingSpinner />
        <span>Loading lobby...</span>
      </div>
    );
  }

  if (runQuery.error) {
    return (
      <div className="error-container">
        <div className="error-container__title">Failed to load run</div>
        <div className="error-container__message">
          {runQuery.error instanceof Error
            ? runQuery.error.message
            : "Unknown error"}
        </div>
      </div>
    );
  }

  if (run?.status === "in_progress" || run?.status === "running") {
    navigate(`/runs/${runId}`);
    return null;
  }

  return (
    <div>
      <ConnectionBanner />
      <div className="page-header">
        <h1 className="page-header__title">{run?.name ?? "Lobby"}</h1>
        <p className="page-header__subtitle">
          Scenario: {run?.scenario_name} -- Waiting for players
        </p>
      </div>

      <div className="grid grid--2">
        <div>
          <div className="card mb-2">
            <div className="card__title">Participants</div>
            <div className="mt-1">
              <PlayerList participants={participants} />
            </div>
          </div>

          {!myParticipant && user && (
            <div className="card">
              <div className="card__title">Join Run</div>
              <div className="mt-1">
                <RoleSelector
                  takenRoles={participants
                    .filter((p) => p.is_human)
                    .map((p) => p.role)}
                  onSelect={(role) => joinMutation.mutate(role)}
                  isLoading={joinMutation.isPending}
                />
              </div>
              {joinMutation.error && (
                <div className="error-container mt-1">
                  <div className="error-container__message">
                    {joinMutation.error instanceof Error
                      ? joinMutation.error.message
                      : "Failed to join"}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="card">
          <div className="card__title">Run Details</div>
          <div className="card__body">
            <div className="mb-1">
              <strong>Status:</strong>{" "}
              <span className="badge badge--yellow">{run?.status}</span>
            </div>
            <div className="mb-1">
              <strong>Seed:</strong>{" "}
              {run?.seed !== null ? run?.seed : "Random"}
            </div>
            <div className="mb-1">
              <strong>Players:</strong> {participants.length}
            </div>
          </div>

          <div className="mt-2" style={{ display: "flex", gap: "0.75rem" }}>
            <button
              className="btn btn--success btn--lg"
              onClick={() => startMutation.mutate()}
              disabled={startMutation.isPending || participants.length === 0}
            >
              {startMutation.isPending ? "Starting..." : "Start Game"}
            </button>
          </div>

          {startMutation.error && (
            <div className="error-container mt-1">
              <div className="error-container__message">
                {startMutation.error instanceof Error
                  ? startMutation.error.message
                  : "Failed to start"}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
