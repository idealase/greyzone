import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { listRuns } from "../api/runs";
import { useAuthStore } from "../stores/authStore";
import LoadingSpinner from "../components/common/LoadingSpinner";

export default function HomePage() {
  const user = useAuthStore((s) => s.user);
  const { data: runs, isLoading, error: runsError } = useQuery({
    queryKey: ["runs"],
    queryFn: listRuns,
  });

  const activeRuns = runs?.filter(
    (r) => r.status === "lobby" || r.status === "in_progress"
  );
  const completedRuns = runs?.filter((r) => r.status === "completed");

  return (
    <div>
      <div className="page-header">
        <h1 className="page-header__title">
          {user
            ? `Welcome, ${user.display_name || user.username}`
            : "Welcome to Greyzone"}
        </h1>
        <p className="page-header__subtitle">
          Distributed Battlespace Simulation -- Grey-Zone Conflict Modeling
        </p>
      </div>

      <div className="grid grid--3">
        <Link to="/scenarios" style={{ textDecoration: "none" }}>
          <div className="card card--hover">
            <div className="card__title">Browse Scenarios</div>
            <div className="card__body">
              Explore pre-built conflict scenarios across 8 domain layers
              including kinetic, cyber, energy, and information warfare.
            </div>
          </div>
        </Link>

        <Link to="/runs/new" style={{ textDecoration: "none" }}>
          <div className="card card--hover">
            <div className="card__title">Start a New Run</div>
            <div className="card__body">
              Select a scenario and configure a new simulation run. Invite
              players or assign AI commanders.
            </div>
          </div>
        </Link>

        <div className="card">
          <div className="card__title">Active Runs</div>
          <div className="card__body">
            {isLoading ? (
              <LoadingSpinner />
            ) : runsError ? (
              <span className="text-muted">Failed to load runs</span>
            ) : activeRuns && activeRuns.length > 0 ? (
              <ul style={{ listStyle: "none", padding: 0 }}>
                {activeRuns.slice(0, 5).map((run) => (
                  <li key={run.id} style={{ marginBottom: "0.5rem" }}>
                    <Link
                      to={
                        run.status === "lobby"
                          ? `/runs/${run.id}/lobby`
                          : `/runs/${run.id}`
                      }
                    >
                      {run.name}{" "}
                      <span className="badge badge--blue">
                        T{run.current_turn}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <span className="text-muted">No active runs</span>
            )}
          </div>
        </div>
      </div>

      {completedRuns && completedRuns.length > 0 && (
        <div className="mt-3">
          <h2 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "0.75rem" }}>
            Completed Runs
          </h2>
          <div className="grid grid--4">
            {completedRuns.slice(0, 8).map((run) => (
              <Link
                key={run.id}
                to={`/runs/${run.id}/replay`}
                style={{ textDecoration: "none" }}
              >
                <div className="card card--hover">
                  <div className="card__title">{run.name}</div>
                  <div className="card__subtitle">{run.scenario_name}</div>
                  <div className="card__body">
                    {run.current_turn} turns -- {run.participant_count} players
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
