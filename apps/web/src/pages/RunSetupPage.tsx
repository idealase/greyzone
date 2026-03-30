import { useState, FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { listScenarios } from "../api/scenarios";
import { createRun, quickStart } from "../api/runs";
import { useAuthStore } from "../stores/authStore";
import LoadingSpinner from "../components/common/LoadingSpinner";

export default function RunSetupPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedScenario = searchParams.get("scenarioId") ?? "";
  const user = useAuthStore((s) => s.user);

  const [scenarioId, setScenarioId] = useState(preselectedScenario);
  const [name, setName] = useState("");
  const [seed, setSeed] = useState("");

  const {
    data: scenarios,
    isLoading: scenariosLoading,
    error: scenariosError,
  } = useQuery({
    queryKey: ["scenarios"],
    queryFn: listScenarios,
  });

  const createRunMutation = useMutation({
    mutationFn: createRun,
    onSuccess: (run) => {
      navigate(`/runs/${run.id}/lobby`);
    },
  });

  const quickStartMutation = useMutation({
    mutationFn: quickStart,
    onSuccess: (run) => {
      navigate(`/runs/${run.id}`);
    },
  });

  const handleQuickStart = () => {
    if (!scenarioId || !user) return;

    quickStartMutation.mutate({
      scenario_id: scenarioId,
      user_id: user.id,
      name: name.trim() || "Quick Game",
      seed: seed ? parseInt(seed, 10) : undefined,
    });
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!scenarioId || !name.trim()) return;

    createRunMutation.mutate({
      name: name.trim(),
      scenario_id: scenarioId,
      seed: seed ? parseInt(seed, 10) : null,
    });
  };

  if (scenariosLoading) {
    return (
      <div className="loading-container">
        <LoadingSpinner />
        <span>Loading scenarios...</span>
      </div>
    );
  }

  if (scenariosError) {
    return (
      <div className="error-container">
        <div className="error-container__title">Failed to load scenarios</div>
        <div className="error-container__message">
          {scenariosError instanceof Error
            ? scenariosError.message
            : "Unknown error"}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-header__title">Create New Run</h1>
        <p className="page-header__subtitle">
          Configure and launch a new simulation
        </p>
      </div>

      <div className="card" style={{ maxWidth: 520 }}>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="scenario">
              Scenario
            </label>
            <select
              id="scenario"
              className="form-select"
              value={scenarioId}
              onChange={(e) => setScenarioId(e.target.value)}
              required
            >
              <option value="">Select a scenario...</option>
              {scenarios?.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="run-name">
              Run Name
            </label>
            <input
              id="run-name"
              className="form-input"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. South China Sea - Round 3"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="seed">
              Random Seed (optional)
            </label>
            <input
              id="seed"
              className="form-input"
              type="number"
              value={seed}
              onChange={(e) => setSeed(e.target.value)}
              placeholder="Leave blank for random"
            />
          </div>

          {(createRunMutation.error || quickStartMutation.error) && (
            <div className="error-container mb-2">
              <div className="error-container__message">
                {(createRunMutation.error ?? quickStartMutation.error) instanceof Error
                  ? (createRunMutation.error ?? quickStartMutation.error as Error).message
                  : "Failed to create run"}
              </div>
            </div>
          )}

          <button
            type="button"
            className="btn btn--primary btn--lg w-full"
            disabled={
              !scenarioId || !user || quickStartMutation.isPending
            }
            onClick={handleQuickStart}
            style={{ marginBottom: "0.75rem" }}
          >
            {quickStartMutation.isPending ? "Starting..." : "Quick Start vs AI"}
          </button>

          <button
            type="submit"
            className="btn btn--secondary btn--lg w-full"
            disabled={
              !scenarioId || !name.trim() || createRunMutation.isPending
            }
          >
            {createRunMutation.isPending ? "Creating..." : "Create Multiplayer Run"}
          </button>
        </form>
      </div>
    </div>
  );
}
