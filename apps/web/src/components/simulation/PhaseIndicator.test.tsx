import { render, screen } from "@testing-library/react";
import PhaseIndicator from "./PhaseIndicator";
import { Phase } from "../../types/phase";

describe("PhaseIndicator", () => {
  it("renders phase label and psi value", () => {
    render(
      <PhaseIndicator
        phase={Phase.CompetitiveNormality}
        orderParameter={0.35}
      />
    );

    expect(screen.getByText("Phase 0: Competitive Normality")).toBeInTheDocument();
    expect(screen.getByText(/0\.350/)).toBeInTheDocument();
  });

  it("shows transition warning when psi is near threshold", () => {
    render(
      <PhaseIndicator
        phase={Phase.HybridCoercion}
        orderParameter={0.75}
      />
    );

    expect(screen.getByText(/TRANSITION WARNING/)).toBeInTheDocument();
  });

  it("does not show transition warning for low psi", () => {
    render(
      <PhaseIndicator
        phase={Phase.HybridCoercion}
        orderParameter={0.2}
      />
    );

    expect(screen.queryByText(/TRANSITION WARNING/)).not.toBeInTheDocument();
  });

  it("does not show transition warning for final phase even at high psi", () => {
    render(
      <PhaseIndicator
        phase={Phase.GeneralizedBlocWar}
        orderParameter={0.9}
      />
    );

    expect(screen.queryByText(/TRANSITION WARNING/)).not.toBeInTheDocument();
  });

  it("applies pulse class when near transition", () => {
    const { container } = render(
      <PhaseIndicator
        phase={Phase.AcutePolycrisis}
        orderParameter={0.8}
      />
    );

    const dot = container.querySelector(".phase-indicator__dot--pulse");
    expect(dot).toBeInTheDocument();
  });
});
