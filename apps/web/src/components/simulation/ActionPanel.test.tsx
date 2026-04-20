import { render, screen } from "@testing-library/react";
import ActionPanel from "./ActionPanel";
import { LegalAction } from "../../types/run";

// ActionCard is complex — mock it to isolate ActionPanel logic
vi.mock("./ActionCard", () => ({
  __esModule: true,
  default: ({ action }: { action: LegalAction }) => (
    <div data-testid="action-card">{action.description}</div>
  ),
}));

describe("ActionPanel", () => {
  const makeLegalAction = (
    overrides: Partial<LegalAction> = {}
  ): LegalAction => ({
    action_type: "diplomatic_engagement",
    actor_id: "blue_state",
    available_layers: ["diplomatic"],
    description: "Initiate diplomatic talks",
    parameter_ranges: { intensity: [0, 1] },
    resource_cost: 5,
    ...overrides,
  });

  const defaultProps = {
    legalActions: [] as LegalAction[],
    onSubmit: vi.fn(),
    isSubmitting: false,
    side: "blue" as const,
  };

  it("renders title", () => {
    render(<ActionPanel {...defaultProps} />);
    expect(screen.getByText("Available Actions")).toBeInTheDocument();
  });

  it("shows empty state when no actions", () => {
    render(<ActionPanel {...defaultProps} />);
    expect(
      screen.getByText("No actions available this turn.")
    ).toBeInTheDocument();
  });

  it("does not show badge when no actions", () => {
    const { container } = render(<ActionPanel {...defaultProps} />);
    expect(container.querySelector(".badge")).not.toBeInTheDocument();
  });

  it("shows badge with count when actions exist", () => {
    const actions = [makeLegalAction(), makeLegalAction({ action_type: "cyber_ops" })];
    render(<ActionPanel {...defaultProps} legalActions={actions} />);
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("renders one ActionCard per legal action", () => {
    const actions = [
      makeLegalAction({ description: "Alpha strike" }),
      makeLegalAction({ description: "Beta deploy" }),
      makeLegalAction({ description: "Gamma patrol" }),
    ];
    render(<ActionPanel {...defaultProps} legalActions={actions} />);
    expect(screen.getAllByTestId("action-card")).toHaveLength(3);
    expect(screen.getByText("Alpha strike")).toBeInTheDocument();
    expect(screen.getByText("Beta deploy")).toBeInTheDocument();
    expect(screen.getByText("Gamma patrol")).toBeInTheDocument();
  });

  it("hides empty state when actions provided", () => {
    render(
      <ActionPanel {...defaultProps} legalActions={[makeLegalAction()]} />
    );
    expect(
      screen.queryByText("No actions available this turn.")
    ).not.toBeInTheDocument();
  });
});
