import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useRunStore } from "../../stores/runStore";
import { useActions } from "../../hooks/useActions";
import { ALL_DOMAINS } from "../../types/domain";
import { Role, TurnResult, WorldState } from "../../types/run";
import { Phase } from "../../types/phase";
import PhaseIndicator from "./PhaseIndicator";
import TurnControls from "./TurnControls";
import DomainPanel from "./DomainPanel";
import EventFeed from "./EventFeed";
import MetricsOverview from "./MetricsOverview";
import ActionPanel from "./ActionPanel";
import AiMovePanel from "../../components/ai/AiMovePanel";
import BattlespaceCanvas from "./BattlespaceCanvas";
import DomainStressChart from "./DomainStressChart";
import AfterActionReport, { DomainDelta, computeDomainDeltas } from "./AfterActionReport";
import ScenarioBriefing from "./ScenarioBriefing";
import Dialog from "../common/Dialog";

interface AarData {
  completedTurn: number;
  currentPhase: Phase;
  orderParameter: number;
  domainDeltas: DomainDelta[];
  phaseChanged: boolean;
}

type MobileTab = "overview" | "actions" | "domains";

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia(query).matches : false
  );

  useEffect(() => {
    const media = window.matchMedia(query);
    const handleChange = () => setMatches(media.matches);
    handleChange();
    media.addEventListener("change", handleChange);
    return () => media.removeEventListener("change", handleChange);
  }, [query]);

  return matches;
}

interface SimulationDashboardProps {
  runId: string;
  myRole: Role | undefined;
  side: "blue" | "red";
}

export default function SimulationDashboard({
  runId,
  myRole,
  side,
}: SimulationDashboardProps) {
  const worldState = useRunStore((s) => s.worldState);
  const currentPhase = useRunStore((s) => s.currentPhase);
  const orderParameter = useRunStore((s) => s.orderParameter);
  const currentTurn = useRunStore((s) => s.currentTurn);
  const events = useRunStore((s) => s.events);
  const legalActions = useRunStore((s) => s.legalActions);
  const stressHistory = useRunStore((s) => s.stressHistory);
  const aiMoves = useRunStore((s) => s.aiMoves);
  const isAdvancingTurn = useRunStore((s) => s.isAdvancingTurn);
  const run = useRunStore((s) => s.run);

  const { submitAction, isSubmitting, advanceTurn, isAdvancing, advanceError } =
    useActions(runId);

  // Compute player resources for turn confirmation dialog
  const playerResources = (() => {
    if (!worldState?.actors || !worldState?.roles) return null;
    const roleId = side === "blue" ? "blue_commander" : "red_commander";
    const role = worldState.roles.find((r) => r.id === roleId);
    if (!role || role.controlled_actor_ids.length === 0) return null;
    const actor = worldState.actors.find(
      (a) => a.id === role.controlled_actor_ids[0]
    );
    return actor?.resources ?? null;
  })();

  const isTablet = useMediaQuery("(max-width: 1024px)");
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [showAAR, setShowAAR] = useState(false);
  const [aarData, setAarData] = useState<AarData | null>(null);
  const [advanceErrorMessage, setAdvanceErrorMessage] = useState<string | null>(null);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const prevWorldStateRef = useRef<WorldState | null>(null);
  const isMountedRef = useRef(true);
  const [activeMobileTab, setActiveMobileTab] =
    useState<MobileTab>("overview");

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (advanceError) {
      setAdvanceErrorMessage(
        advanceError instanceof Error
          ? advanceError.message
          : "Failed to advance turn"
      );
    }
  }, [advanceError]);

  useEffect(() => {
    if (!isMobile) {
      setActiveMobileTab("overview");
    }
  }, [isMobile]);

  function handleAdvanceTurn() {
    prevWorldStateRef.current = worldState;
    setAdvanceErrorMessage(null);
    advanceTurn(undefined, {
      onSuccess: (result: TurnResult) => {
        if (!isMountedRef.current) {
          return;
        }
        const prev = prevWorldStateRef.current;
        const deltas: DomainDelta[] =
          prev && result.world_state ? computeDomainDeltas(prev, result.world_state) : [];
        setAarData({
          completedTurn: result.turn,
          currentPhase: result.phase,
          orderParameter: result.order_parameter,
          domainDeltas: deltas,
          phaseChanged: result.phase_changed,
        });
        setShowAAR(true);
      },
      onError: (error) => {
        if (!isMountedRef.current) {
          return;
        }
        setAdvanceErrorMessage(
          error instanceof Error ? error.message : "Failed to advance turn"
        );
      },
    });
  }

  const mobileTabs: { id: MobileTab; label: string }[] = [
    { id: "overview", label: "Overview" },
    {
      id: "actions",
      label: myRole === "observer" ? "Events" : "Actions",
    },
    { id: "domains", label: "Domains" },
  ];

  const layoutClasses = [
    "sim-layout",
    isTablet ? "sim-layout--tablet" : "",
    isMobile ? "sim-layout--mobile" : "",
  ]
    .filter(Boolean)
    .join(" ");

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isFormElement =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable);

      if (!isFormElement && (e.key === "?" || (e.key === "/" && e.shiftKey))) {
        e.preventDefault();
        setShowShortcuts(true);
      }
      if (e.key === "Escape") {
        setShowShortcuts(false);
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  return (
    <div className={layoutClasses}>
      <div className="sim-layout__top">
        <div className="sim-top__left">
          <PhaseIndicator
            phase={currentPhase}
            orderParameter={orderParameter}
          />
          <div className="sim-top__links">
            <Link to="/tutorial">↩ Return to tutorial</Link>
            <Link to="/help">Help & docs</Link>
            <button
              className="btn btn--sm"
              type="button"
              onClick={() => setShowShortcuts(true)}
              aria-keyshortcuts="?"
            >
              ? Shortcuts
            </button>
            {run?.scenario_id && (
              <ScenarioBriefing
                scenarioId={run.scenario_id}
                scenarioName={run.scenario_name ?? run.name}
                side={side}
                currentTurn={currentTurn}
              />
            )}
          </div>
        </div>
        <div className="sim-top__right">
          <TurnControls
            turn={currentTurn}
            isAdvancing={isAdvancing || isAdvancingTurn}
            onAdvanceTurn={handleAdvanceTurn}
            isObserver={myRole === "observer"}
            currentTurnEvents={events}
            resources={playerResources}
          />
        </div>
        {advanceErrorMessage && (
          <div className="error-container">
            <div className="error-container__title">Advance failed</div>
            <div className="error-container__message">
              {advanceErrorMessage}
            </div>
          </div>
        )}
      </div>

      {isMobile ? (
        <>
          <div className="sim-mobile-tabs" role="tablist" aria-label="Simulation sections">
            {mobileTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`sim-mobile-tab${activeMobileTab === tab.id ? " sim-mobile-tab--active" : ""}`}
                onClick={() => setActiveMobileTab(tab.id)}
                role="tab"
                aria-selected={activeMobileTab === tab.id}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="sim-mobile-panel">
            {activeMobileTab === "overview" && (
              <>
                <MetricsOverview
                  orderParameter={orderParameter}
                  phase={currentPhase}
                  turn={currentTurn}
                  eventCount={events.length}
                  worldState={worldState}
                  side={side}
                />
                <DomainStressChart stressHistory={stressHistory} />
              </>
            )}

            {activeMobileTab === "actions" && (
              <>
                {myRole !== "observer" && (
                  <ActionPanel
                    legalActions={legalActions}
                    onSubmit={(action) =>
                      submitAction({
                        ...action,
                        run_id: runId,
                      })
                    }
                    isSubmitting={isSubmitting}
                    side={side}
                  />
                )}
                <EventFeed events={events} />
                {aiMoves.length > 0 && <AiMovePanel latestMove={aiMoves[0]} />}
              </>
            )}

            {activeMobileTab === "domains" && (
              <div className="sim-mobile-stack">
                {ALL_DOMAINS.map((domain) => (
                  <DomainPanel
                    key={domain}
                    domain={domain}
                    layerState={worldState?.layers[domain] ?? null}
                  />
                ))}
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          <div className="sim-layout__left">
            {ALL_DOMAINS.map((domain) => (
              <DomainPanel
                key={domain}
                domain={domain}
                layerState={worldState?.layers[domain] ?? null}
              />
            ))}
          </div>

          <div className="sim-layout__center">
            <div className="battlespace-canvas">
              <BattlespaceCanvas
                worldState={worldState}
                previousWorldState={prevWorldStateRef.current}
              />
            </div>
            <MetricsOverview
              orderParameter={orderParameter}
              phase={currentPhase}
              turn={currentTurn}
              eventCount={events.length}
              worldState={worldState}
              side={side}
            />
            <DomainStressChart stressHistory={stressHistory} />
            <EventFeed events={events} />
          </div>

          <div className="sim-layout__right">
            {myRole !== "observer" && (
              <ActionPanel
                legalActions={legalActions}
                onSubmit={(action) =>
                  submitAction({
                    ...action,
                    run_id: runId,
                  })
                }
                isSubmitting={isSubmitting}
                side={side}
              />
            )}
            {aiMoves.length > 0 && <AiMovePanel latestMove={aiMoves[0]} />}
          </div>
        </>
      )}

      {showAAR && aarData && (
        <AfterActionReport
          runId={runId}
          completedTurn={aarData.completedTurn}
          currentPhase={aarData.currentPhase}
          orderParameter={aarData.orderParameter}
          domainDeltas={aarData.domainDeltas}
          phaseChanged={aarData.phaseChanged}
          onDismiss={() => setShowAAR(false)}
        />
      )}

      <Dialog
        open={showShortcuts}
        onClose={() => setShowShortcuts(false)}
        title="Keyboard Shortcuts"
        actions={
          <button className="btn btn--primary btn--sm" onClick={() => setShowShortcuts(false)}>
            Close
          </button>
        }
      >
        <p style={{ color: "var(--text-secondary)", marginBottom: "0.5rem" }}>
          Quick references for navigating the simulation.
        </p>
        <ul className="shortcut-list">
          <li className="shortcut-list__item">
            <span>Open this panel</span>
            <span className="shortcut-key">?</span>
          </li>
          <li className="shortcut-list__item">
            <span>Close modals/panels</span>
            <span className="shortcut-key">Esc</span>
          </li>
          <li className="shortcut-list__item">
            <span>Move focus between controls</span>
            <span className="shortcut-key">Tab</span>
          </li>
          <li className="shortcut-list__item">
            <span>Advance turn (when button focused)</span>
            <span className="shortcut-key">Enter</span>
          </li>
          <li className="shortcut-list__item">
            <span>Navigate tutorial steps</span>
            <span className="shortcut-key">↑ ↓</span>
          </li>
        </ul>
      </Dialog>
    </div>
  );
}
