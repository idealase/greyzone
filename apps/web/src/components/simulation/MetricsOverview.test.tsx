import { render, screen } from "@testing-library/react";
import MetricsOverview from "./MetricsOverview";
import { Phase } from "../../types/phase";
import { WorldState } from "../../types/run";
import { DomainLayer } from "../../types/domain";

// InfoTooltip renders a toggle — mock for simplicity
vi.mock("../common/InfoTooltip", () => ({
  __esModule: true,
  default: ({ label }: { label: string }) => <span>{label}</span>,
}));

describe("MetricsOverview", () => {
  const baseProps = {
    orderParameter: 0.42,
    phase: Phase.HybridCoercion,
    turn: 5,
    eventCount: 12,
    worldState: null as WorldState | null,
    side: undefined as "blue" | "red" | undefined,
  };

  it("renders order parameter", () => {
    render(<MetricsOverview {...baseProps} />);
    expect(screen.getByText("Ψ = 0.420")).toBeInTheDocument();
  });

  it("renders phase label", () => {
    render(<MetricsOverview {...baseProps} />);
    expect(screen.getByText(/Hybrid Coercion/)).toBeInTheDocument();
  });

  it("renders turn number", () => {
    render(<MetricsOverview {...baseProps} />);
    expect(screen.getByText("5")).toBeInTheDocument();
  });

  it("renders event count", () => {
    render(<MetricsOverview {...baseProps} />);
    expect(screen.getByText("12")).toBeInTheDocument();
  });

  it("shows -- for dominant domain when no world state", () => {
    render(<MetricsOverview {...baseProps} />);
    expect(screen.getByText("--")).toBeInTheDocument();
  });

  it("computes dominant domain from world state", () => {
    const worldState: WorldState = {
      turn: 5,
      phase: Phase.HybridCoercion,
      order_parameter: 0.42,
      coupling_matrix: {},
      layers: {
        [DomainLayer.Kinetic]: {
          stress: 0.3,
          resilience: 0.5,
          friction: 0.1,
          activity_level: 0,
          variables: {},
        },
        [DomainLayer.Cyber]: {
          stress: 0.8,
          resilience: 0.4,
          friction: 0.2,
          activity_level: 0,
          variables: {},
        },
      } as WorldState["layers"],
    };
    render(<MetricsOverview {...baseProps} worldState={worldState} />);
    expect(screen.getByText("Cyber")).toBeInTheDocument();
  });

  it("computes average resilience from world state", () => {
    const worldState: WorldState = {
      turn: 5,
      phase: Phase.HybridCoercion,
      order_parameter: 0.42,
      coupling_matrix: {},
      layers: {
        [DomainLayer.Kinetic]: {
          stress: 0.2,
          resilience: 0.6,
          friction: 0.1,
          activity_level: 0,
          variables: {},
        },
        [DomainLayer.Cyber]: {
          stress: 0.4,
          resilience: 0.4,
          friction: 0.2,
          activity_level: 0,
          variables: {},
        },
      } as WorldState["layers"],
    };
    render(<MetricsOverview {...baseProps} worldState={worldState} />);
    // avg resilience = (0.6 + 0.4) / 2 = 0.5 → "50.0%"
    expect(screen.getByText("50.0%")).toBeInTheDocument();
  });

  it("shows resources when side and actor data available", () => {
    const worldState: WorldState = {
      turn: 5,
      phase: Phase.HybridCoercion,
      order_parameter: 0.42,
      coupling_matrix: {},
      layers: {} as WorldState["layers"],
      actors: [{ id: "blue_state", resources: 75.3 }],
      roles: [{ id: "blue_commander", controlled_actor_ids: ["blue_state"] }],
    };
    render(
      <MetricsOverview {...baseProps} worldState={worldState} side="blue" />
    );
    expect(screen.getByText("75 RP")).toBeInTheDocument();
  });

  it("hides resources card when no side provided", () => {
    render(<MetricsOverview {...baseProps} />);
    expect(screen.queryByText(/RP$/)).not.toBeInTheDocument();
  });

  it("renders tooltip labels", () => {
    render(<MetricsOverview {...baseProps} />);
    expect(
      screen.getByText("What is the order parameter?")
    ).toBeInTheDocument();
    expect(screen.getByText("What do phases mean?")).toBeInTheDocument();
    expect(screen.getByText("What is resilience?")).toBeInTheDocument();
  });
});
