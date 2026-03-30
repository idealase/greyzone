import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { vi } from "vitest";
import AfterActionReport from "./AfterActionReport";
import { Phase } from "../../types/phase";
import { DomainLayer } from "../../types/domain";

vi.mock("./TurnNarrativePanel", () => ({
  __esModule: true,
  default: () => <div data-testid="narrative-panel">Narrative</div>,
}));

describe("AfterActionReport", () => {
  it("shows contextual help links", () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <AfterActionReport
          runId="r-1"
          completedTurn={3}
          currentPhase={Phase.HybridCoercion}
          orderParameter={0.32}
          domainDeltas={[
            {
              domain: DomainLayer.Cyber,
              stressDelta: 0,
              resilienceDelta: 0,
              activityDelta: 0,
            },
          ]}
          phaseChanged={false}
          onDismiss={() => {}}
        />
      </QueryClientProvider>
    );

    expect(screen.getByText("↩ Return to tutorial")).toBeInTheDocument();
    expect(screen.getByText("What does this mean?")).toHaveAttribute(
      "href",
      expect.stringContaining("simulation-spec")
    );
    expect(screen.getByText("Help & docs")).toHaveAttribute("href", "/help");
  });
});
