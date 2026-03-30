import { useState, useRef } from "react";
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
import DomainStressChart from "./DomainStressChart";
import AfterActionReport, { DomainDelta, computeDomainDeltas } from "./AfterActionReport";

interface AarData {
  completedTurn: number;
  currentPhase: Phase;
  orderParameter: number;
  domainDeltas: DomainDelta[];
  phaseChanged: boolean;
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

  const { submitAction, isSubmitting, advanceTurn, isAdvancing } =
    useActions(runId);

  const [showAAR, setShowAAR] = useState(false);
  const [aarData, setAarData] = useState<AarData | null>(null);
  const prevWorldStateRef = useRef<WorldState | null>(null);

  function handleAdvanceTurn() {
    prevWorldStateRef.current = worldState;
    advanceTurn(undefined, {
      onSuccess: (result: TurnResult) => {
        const prev = prevWorldStateRef.current;
        const deltas: DomainDelta[] =
          prev ? computeDomainDeltas(prev, result.world_state) : [];
        setAarData({
          completedTurn: result.turn,
          currentPhase: result.phase,
          orderParameter: result.order_parameter,
          domainDeltas: deltas,
          phaseChanged: result.phase_changed,
        });
        setShowAAR(true);
      },
    });
  }

  return (
    <div className="sim-layout">
      <div className="sim-layout__top">
        <PhaseIndicator
          phase={currentPhase}
          orderParameter={orderParameter}
        />
        <TurnControls
          turn={currentTurn}
          isAdvancing={isAdvancing || isAdvancingTurn}
          onAdvanceTurn={handleAdvanceTurn}
          isObserver={myRole === "observer"}
        />
      </div>

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
        <MetricsOverview
          orderParameter={orderParameter}
          phase={currentPhase}
          turn={currentTurn}
          eventCount={events.length}
          worldState={worldState}
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
    </div>
  );
}
