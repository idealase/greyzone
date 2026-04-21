import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useRunStore } from "../../stores/runStore";
import { useActions } from "../../hooks/useActions";
import { ALL_DOMAINS, DomainLayer } from "../../types/domain";
import { Role, TurnResult, WorldState } from "../../types/run";
import { Phase } from "../../types/phase";
import PhaseIndicator from "./PhaseIndicator";
import TurnControls from "./TurnControls";
import DomainPanel from "./DomainPanel";
import EventFeed from "./EventFeed";
import MetricsOverview from "./MetricsOverview";
import ObjectivesPanel from "./ObjectivesPanel";
import AiMovePanel from "../../components/ai/AiMovePanel";
import ActionModal from "./ActionModal";
import DomainActionBar from "./DomainActionBar";
import BattlespaceCanvas from "./BattlespaceCanvas";
import DomainStressChart from "./DomainStressChart";
import CouplingGraph from "./CouplingGraph";
import AfterActionReport, { DomainDelta, computeDomainDeltas } from "./AfterActionReport";
import ScenarioBriefing from "./ScenarioBriefing";
import AdvisorDialog from "./AdvisorDialog";
import Dialog from "../common/Dialog";
import Glossary from "../common/Glossary";
import { AdvisorSuggestedAction } from "../../types/advisor";

interface AarData {
  completedTurn: number;
  currentPhase: Phase;
  orderParameter: number;
  previousOrderParameter?: number;
  domainDeltas: DomainDelta[];
  phaseChanged: boolean;
  aiActionCount: number;
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
  const previousWorldState = useRunStore((s) => s.previousWorldState);
  const currentPhase = useRunStore((s) => s.currentPhase);
  const orderParameter = useRunStore((s) => s.orderParameter);
  const previousOrderParameter = useRunStore((s) => s.previousOrderParameter);
  const currentTurn = useRunStore((s) => s.currentTurn);
  const events = useRunStore((s) => s.events);
  const legalActions = useRunStore((s) => s.legalActions);
  const stressHistory = useRunStore((s) => s.stressHistory);
  const psiHistory = useRunStore((s) => s.psiHistory);
  const aiMoves = useRunStore((s) => s.aiMoves);
  const isAdvancingTurn = useRunStore((s) => s.isAdvancingTurn);
  const run = useRunStore((s) => s.run);

  const {
    submitAction,
    submitActionAsync,
    isSubmitting,
    advanceTurn,
    isAdvancing,
    advanceError,
  } =
    useActions(runId);

  // Derive phase transitions from Ψ history
  const phaseTransitions = useMemo(() => {
    const transitions: { turn: number; phase: Phase }[] = [];
    for (let i = 1; i < psiHistory.length; i++) {
      if (psiHistory[i].phase !== psiHistory[i - 1].phase) {
        transitions.push({ turn: psiHistory[i].turn, phase: psiHistory[i].phase });
      }
    }
    return transitions;
  }, [psiHistory]);

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

  // Find the domain with the largest absolute stress delta
  const mostChangedDomain = useMemo<DomainLayer | null>(() => {
    if (!worldState || !previousWorldState) return null;
    let maxDelta = 0;
    let result: DomainLayer | null = null;
    for (const domain of ALL_DOMAINS) {
      const curr = worldState.layers[domain]?.stress ?? 0;
      const prev = previousWorldState.layers[domain]?.stress ?? 0;
      const delta = Math.abs(curr - prev);
      if (delta > maxDelta) {
        maxDelta = delta;
        result = domain;
      }
    }
    return maxDelta > 0.005 ? result : null;
  }, [worldState, previousWorldState]);

  const isTablet = useMediaQuery("(max-width: 1024px)");
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [showAAR, setShowAAR] = useState(false);
  const [aarData, setAarData] = useState<AarData | null>(null);
  const [advanceErrorMessage, setAdvanceErrorMessage] = useState<string | null>(null);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showCouplingGraph, setShowCouplingGraph] = useState(false);
  const [showGlossary, setShowGlossary] = useState(false);
  const [actionModalDomain, setActionModalDomain] = useState<DomainLayer | null>(null);
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

  // Extract active coupling pairs from current turn events
  const activeCouplings = useMemo(() => {
    return events
      .filter((e) => e.type === "coupling_effect" && e.turn === currentTurn)
      .map((e) => {
        const match = e.description.match(/from\s+(\w+)\s+to\s+(\w+)/i)
          ?? e.description.match(/(\w+)\s+(?:stress\s+)?spill(?:ed)?\s+(?:over\s+)?to\s+(\w+)/i);
        if (match) return { source: match[1], target: match[2] };
        if (e.domain) return { source: "unknown", target: e.domain };
        return null;
      })
      .filter((c): c is { source: string; target: string } => c !== null);
  }, [events, currentTurn]);

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
          previousOrderParameter: previousOrderParameter ?? undefined,
          domainDeltas: deltas,
          phaseChanged: result.phase_changed,
          aiActionCount: result.ai_actions?.length ?? 0,
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

  async function handleApplyAdvisorSuggestion(action: AdvisorSuggestedAction) {
    await submitActionAsync({
      run_id: runId,
      action_type: action.action_type,
      target_domain: action.target_domain,
      target_actor: action.target_actor ?? null,
      intensity: action.intensity,
      user_id: "",
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
      if (!isFormElement && e.key === "c" && !e.ctrlKey && !e.metaKey) {
        setShowCouplingGraph((v) => !v);
      }
      if (!isFormElement && e.key === "g" && !e.ctrlKey && !e.metaKey) {
        setShowGlossary((v) => !v);
      }
      if (e.key === "Escape") {
        setShowShortcuts(false);
        setShowCouplingGraph(false);
        setShowGlossary(false);
        setActionModalDomain(null);
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
            phaseHistory={phaseTransitions}
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
              />
            )}
          </div>
        </div>
        <div className="sim-top__right">
          {myRole && myRole !== "observer" && (
            <AdvisorDialog
              runId={runId}
              roleId={myRole}
              canApply
              onApplySuggestion={handleApplyAdvisorSuggestion}
            />
          )}
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
                <ObjectivesPanel
                  side={side}
                  orderParameter={orderParameter}
                  currentTurn={currentTurn}
                  currentPhase={currentPhase}
                />
                <MetricsOverview
                  orderParameter={orderParameter}
                  phase={currentPhase}
                  turn={currentTurn}
                  eventCount={events.length}
                  worldState={worldState}
                  side={side}
                  previousOrderParameter={previousOrderParameter}
                  previousWorldState={previousWorldState}
                />
                <DomainStressChart stressHistory={stressHistory} psiHistory={psiHistory} />
              </>
            )}

            {activeMobileTab === "actions" && (
              <>
                {myRole !== "observer" && (
                  <DomainActionBar
                    legalActions={legalActions}
                    onDomainClick={(domain) => setActionModalDomain(domain)}
                  />
                )}
                <EventFeed events={events} couplingMatrix={worldState?.coupling_matrix} />
                {aiMoves.length > 0 && <AiMovePanel moves={aiMoves} />}
              </>
            )}

            {activeMobileTab === "domains" && (
              <div className="sim-mobile-stack">
                {ALL_DOMAINS.map((domain) => (
                  <DomainPanel
                    key={domain}
                    domain={domain}
                    layerState={worldState?.layers[domain] ?? null}
                    previousLayerState={previousWorldState?.layers[domain] ?? null}
                    isMostChanged={domain === mostChangedDomain}
                    couplingMatrix={worldState?.coupling_matrix}
                    recentEvents={events}
                  />
                ))}
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="sim-panel-container">
          {/* LEFT: Canvas + Domain Action Bar */}
          <div className="sim-panel--canvas">
            <div className="battlespace-canvas">
              <BattlespaceCanvas
                worldState={worldState}
                previousWorldState={prevWorldStateRef.current}
                onDomainClick={myRole !== "observer" ? (domain) => setActionModalDomain(domain) : undefined}
              />
            </div>
            {myRole !== "observer" && (
              <DomainActionBar
                legalActions={legalActions}
                onDomainClick={(domain) => setActionModalDomain(domain)}
              />
            )}
          </div>

          {/* RIGHT: Objectives, Metrics, Chart, Events */}
          <div className="sim-panel--info">
            <ObjectivesPanel
              side={side}
              orderParameter={orderParameter}
              currentTurn={currentTurn}
              currentPhase={currentPhase}
            />
            <MetricsOverview
              orderParameter={orderParameter}
              phase={currentPhase}
              turn={currentTurn}
              eventCount={events.length}
              worldState={worldState}
              side={side}
              previousOrderParameter={previousOrderParameter}
              previousWorldState={previousWorldState}
            />
            {aiMoves.length > 0 && <AiMovePanel moves={aiMoves} />}
            <DomainStressChart stressHistory={stressHistory} psiHistory={psiHistory} />
            <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center", flexShrink: 0 }}>
              <button
                className="btn btn--sm btn--ghost"
                onClick={() => setShowCouplingGraph(true)}
                title="View domain coupling map (C)"
              >
                🔗 View Couplings
              </button>
              <button
                className="btn btn--sm btn--ghost"
                onClick={() => setShowGlossary(true)}
                title="Open game glossary (G)"
              >
                📖 Glossary
              </button>
            </div>
            <EventFeed events={events} couplingMatrix={worldState?.coupling_matrix} />
          </div>
        </div>
      )}

      {actionModalDomain !== null && myRole !== "observer" && (
        <ActionModal
          open={actionModalDomain !== null}
          onClose={() => setActionModalDomain(null)}
          domain={actionModalDomain}
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

      {showAAR && aarData && (
        <AfterActionReport
          runId={runId}
          completedTurn={aarData.completedTurn}
          currentPhase={aarData.currentPhase}
          orderParameter={aarData.orderParameter}
          previousOrderParameter={aarData.previousOrderParameter}
          domainDeltas={aarData.domainDeltas}
          phaseChanged={aarData.phaseChanged}
          aiActionCount={aarData.aiActionCount}
          onDismiss={() => setShowAAR(false)}
        />
      )}

      <Dialog
        open={showCouplingGraph}
        onClose={() => setShowCouplingGraph(false)}
        title="Domain Coupling Map"
        actions={
          <button className="btn btn--primary btn--sm" onClick={() => setShowCouplingGraph(false)}>
            Close
          </button>
        }
      >
        {worldState?.coupling_matrix ? (
          <CouplingGraph
            couplingMatrix={worldState.coupling_matrix}
            layers={worldState.layers as any}
            activeCouplings={[]}
          />
        ) : (
          <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>
            No coupling data available yet. Advance a turn to see domain interactions.
          </div>
        )}
      </Dialog>

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
          <li className="shortcut-list__item">
            <span>Toggle coupling graph</span>
            <span className="shortcut-key">C</span>
          </li>
          <li className="shortcut-list__item">
            <span>Expand/collapse all action cards</span>
            <span className="shortcut-key">E</span>
          </li>
          <li className="shortcut-list__item">
            <span>Toggle glossary</span>
            <span className="shortcut-key">G</span>
          </li>
        </ul>
      </Dialog>

      <Dialog
        open={showGlossary}
        onClose={() => setShowGlossary(false)}
        title="📖 Game Glossary"
        actions={
          <button className="btn btn--primary btn--sm" onClick={() => setShowGlossary(false)}>
            Close
          </button>
        }
      >
        <Glossary />
      </Dialog>
    </div>
  );
}
