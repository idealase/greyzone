import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { listScenarios } from "../api/scenarios";
import LoadingSpinner from "../components/common/LoadingSpinner";

export default function ScenariosPage() {
  const navigate = useNavigate();
  const { data: scenarios, isLoading, error } = useQuery({
    queryKey: ["scenarios"],
    queryFn: listScenarios,
  });

  if (isLoading) {
    return (
      <div className="loading-container">
        <LoadingSpinner />
        <span>Loading scenarios...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-container__title">Failed to load scenarios</div>
        <div className="error-container__message">
          {error instanceof Error ? error.message : "Unknown error"}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-header__title">Scenarios</h1>
        <p className="page-header__subtitle">
          Choose a conflict scenario to begin a new simulation run
        </p>
      </div>

      {scenarios && scenarios.length > 0 ? (
        <div className="grid grid--3">
          {scenarios.map((scenario) => (
            <div key={scenario.id} className="card">
              <div className="card__title">{scenario.name}</div>
              <div className="card__subtitle">by {scenario.author}</div>
              <div className="card__body" style={{ marginBottom: "1rem" }}>
                {scenario.description}
              </div>
              <button
                className="btn btn--primary"
                onClick={() =>
                  navigate(`/runs/new?scenarioId=${scenario.id}`)
                }
              >
                New Run
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="card">
          <div className="card__body text-center">
            No scenarios available yet.
          </div>
        </div>
      )}
    </div>
  );
}
