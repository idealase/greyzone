import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getScenario } from "../../api/scenarios";
import { ActorConfig, deriveActorConfigs } from "../../types/scenario";
import Dialog from "../common/Dialog";

interface ScenarioBriefingProps {
  scenarioId: string;
  scenarioName: string;
  side: "blue" | "red";
  currentTurn: number;
}

function getSideLabel(side: "blue" | "red"): string {
  return side === "blue" ? "Blue (Defending)" : "Red (Aggressor)";
}

function getSideEmoji(actorSide: "blue" | "red" | "neutral"): string {
  switch (actorSide) {
    case "blue":
      return "🔵";
    case "red":
      return "🔴";
    case "neutral":
      return "⚪";
  }
}

function ActorCard({ actor }: { actor: ActorConfig }) {
  return (
    <div className={`briefing-actor briefing-actor--${actor.side}`}>
      <div className="briefing-actor__header">
        <span className="briefing-actor__emoji">{getSideEmoji(actor.side)}</span>
        <span className="briefing-actor__name">{actor.name}</span>
        <span className={`badge badge--${actor.side === "blue" ? "blue" : actor.side === "red" ? "red" : "gray"}`}>
          {actor.side.toUpperCase()}
        </span>
      </div>
      <p className="briefing-actor__desc">{actor.description}</p>
      {actor.objectives.length > 0 && (
        <ul className="briefing-actor__objectives">
          {actor.objectives.map((obj, i) => (
            <li key={i}>🎯 {obj}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function ScenarioBriefing({
  scenarioId,
  scenarioName,
  side,
  currentTurn,
}: ScenarioBriefingProps) {
  const [isOpen, setIsOpen] = useState(false);

  const { data: scenario } = useQuery({
    queryKey: ["scenario", scenarioId],
    queryFn: () => getScenario(scenarioId),
    enabled: !!scenarioId,
    staleTime: Infinity,
  });

  // Auto-open on turn 1
  useEffect(() => {
    if (currentTurn <= 1 && scenario) {
      setIsOpen(true);
    }
  }, [currentTurn, scenario]);

  const actors = useMemo(
    () => (scenario?.config ? deriveActorConfigs(scenario.config) : []),
    [scenario],
  );
  const myActors = actors.filter((a) => a.side === side);
  const opponentActors = actors.filter((a) => a.side === (side === "blue" ? "red" : "blue"));
  const neutralActors = actors.filter((a) => a.side === "neutral");

  const myRole = scenario?.config?.roles.find(
    (r) => r.id === (side === "blue" ? "blue_commander" : "red_commander"),
  );

  return (
    <>
      <button
        className="btn btn--sm briefing-trigger"
        type="button"
        onClick={() => setIsOpen(true)}
        title="View scenario briefing"
      >
        📋 Briefing
      </button>

      <Dialog
        open={isOpen}
        onClose={() => setIsOpen(false)}
        title={`SCENARIO BRIEFING: ${scenarioName}`}
        actions={
          <button className="btn btn--primary btn--sm" onClick={() => setIsOpen(false)}>
            Understood
          </button>
        }
      >
        <div className="briefing-content">
          {scenario ? (
            <>
              <section className="briefing-section">
                <h4 className="briefing-section__title">Situation Overview</h4>
                <p className="briefing-section__body">{scenario.description}</p>
              </section>

              <section className="briefing-section">
                <h4 className="briefing-section__title">
                  Your Assignment — {getSideLabel(side)}
                </h4>
                {myRole && (
                  <p className="briefing-section__body">
                    <strong>{myRole.name}:</strong> {myRole.description}
                  </p>
                )}
                {myActors.length > 0 ? (
                  <div className="briefing-actors">
                    {myActors.map((actor) => (
                      <ActorCard key={actor.name} actor={actor} />
                    ))}
                  </div>
                ) : (
                  <p className="briefing-section__body">No actor data available.</p>
                )}
              </section>

              {opponentActors.length > 0 && (
                <section className="briefing-section">
                  <h4 className="briefing-section__title">Opposition Forces</h4>
                  <div className="briefing-actors">
                    {opponentActors.map((actor) => (
                      <ActorCard key={actor.name} actor={actor} />
                    ))}
                  </div>
                </section>
              )}

              {neutralActors.length > 0 && (
                <section className="briefing-section">
                  <h4 className="briefing-section__title">Neutral Parties</h4>
                  <div className="briefing-actors">
                    {neutralActors.map((actor) => (
                      <ActorCard key={actor.name} actor={actor} />
                    ))}
                  </div>
                </section>
              )}
            </>
          ) : (
            <p className="briefing-section__body">Loading scenario data...</p>
          )}
        </div>
      </Dialog>
    </>
  );
}
