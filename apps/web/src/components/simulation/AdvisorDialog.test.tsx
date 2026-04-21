import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import AdvisorDialog from "./AdvisorDialog";
import { AdvisorResponse } from "../../types/advisor";

vi.mock("../../api/advisor", () => ({
  requestAdvisorGuidance: vi.fn(),
}));

import { requestAdvisorGuidance } from "../../api/advisor";

const mockRequestAdvisorGuidance = vi.mocked(requestAdvisorGuidance);

function makeResponse(overrides: Partial<AdvisorResponse> = {}): AdvisorResponse {
  return {
    state_summary: "Blue side has initiative in cyber but logistics is strained.",
    strategic_outlook: "Prioritize resilience before escalating kinetic posture.",
    suggestions: [
      {
        rank: 1,
        action: {
          action_type: "Reinforce",
          target_domain: "Cyber",
          target_actor: "nato_alliance",
          intensity: 0.6,
        },
        rationale: "Reinforcement mitigates cascading cyber risk this turn.",
        confidence: 0.78,
        expected_local_effects: {
          summary: "Cyber resilience improves while stress dips.",
          stress_delta: -0.12,
          resilience_delta: 0.09,
        },
      },
    ],
    ...overrides,
  };
}

describe("AdvisorDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("requests advisor guidance when opened", async () => {
    mockRequestAdvisorGuidance.mockResolvedValue(makeResponse());

    render(
      <AdvisorDialog runId="run-123" roleId="blue_commander" canApply onApplySuggestion={vi.fn()} />
    );
    fireEvent.click(screen.getByRole("button", { name: "AI Advisor" }));

    await waitFor(() => {
      expect(mockRequestAdvisorGuidance).toHaveBeenCalledWith({
        run_id: "run-123",
        role_id: "blue_commander",
      });
    });
  });

  it("shows loading state while guidance is in-flight", () => {
    mockRequestAdvisorGuidance.mockReturnValue(new Promise(() => {}));

    render(
      <AdvisorDialog runId="run-123" roleId="blue_commander" canApply onApplySuggestion={vi.fn()} />
    );
    fireEvent.click(screen.getByRole("button", { name: "AI Advisor" }));

    expect(screen.getByText("Requesting advisor guidance...")).toBeInTheDocument();
  });

  it("renders summary, outlook, and ranked suggestions", async () => {
    mockRequestAdvisorGuidance.mockResolvedValue(makeResponse());

    render(
      <AdvisorDialog runId="run-123" roleId="blue_commander" canApply onApplySuggestion={vi.fn()} />
    );
    fireEvent.click(screen.getByRole("button", { name: "AI Advisor" }));

    await waitFor(() => {
      expect(screen.getByText("State Summary")).toBeInTheDocument();
    });
    expect(
      screen.getByText("Blue side has initiative in cyber but logistics is strained.")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Prioritize resilience before escalating kinetic posture.")
    ).toBeInTheDocument();
    expect(screen.getByText("Reinforce")).toBeInTheDocument();
    expect(screen.getByText("Cyber")).toBeInTheDocument();
    expect(screen.getByText("78% confidence")).toBeInTheDocument();
    expect(screen.getByText("Stress Δ: -0.12")).toBeInTheDocument();
  });

  it("shows clear error state when guidance request fails", async () => {
    mockRequestAdvisorGuidance.mockRejectedValue(new Error("Advisor unavailable"));

    render(
      <AdvisorDialog runId="run-123" roleId="blue_commander" canApply onApplySuggestion={vi.fn()} />
    );
    fireEvent.click(screen.getByRole("button", { name: "AI Advisor" }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("Advisor unavailable");
    });
  });

  it("applies a suggestion with one click and closes on success", async () => {
    const response = makeResponse();
    const onApplySuggestion = vi.fn().mockResolvedValue(undefined);
    mockRequestAdvisorGuidance.mockResolvedValue(response);

    render(
      <AdvisorDialog
        runId="run-123"
        roleId="blue_commander"
        canApply
        onApplySuggestion={onApplySuggestion}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "AI Advisor" }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Apply suggestion" })).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole("button", { name: "Apply suggestion" }));

    await waitFor(() => {
      expect(onApplySuggestion).toHaveBeenCalledWith(response.suggestions[0].action);
    });
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  it("hides apply controls when apply is not allowed", async () => {
    mockRequestAdvisorGuidance.mockResolvedValue(makeResponse());

    render(<AdvisorDialog runId="run-123" roleId="observer" canApply={false} />);
    fireEvent.click(screen.getByRole("button", { name: "AI Advisor" }));

    await waitFor(() => {
      expect(screen.getByText("Recommended Actions")).toBeInTheDocument();
    });
    expect(screen.queryByRole("button", { name: "Apply suggestion" })).not.toBeInTheDocument();
  });

  it("shows apply failure without closing the dialog", async () => {
    const onApplySuggestion = vi.fn().mockRejectedValue(new Error("Action rejected"));
    mockRequestAdvisorGuidance.mockResolvedValue(makeResponse());

    render(
      <AdvisorDialog
        runId="run-123"
        roleId="blue_commander"
        canApply
        onApplySuggestion={onApplySuggestion}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "AI Advisor" }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Apply suggestion" })).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole("button", { name: "Apply suggestion" }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Failed to apply suggestion: Action rejected"
      );
    });
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
});
