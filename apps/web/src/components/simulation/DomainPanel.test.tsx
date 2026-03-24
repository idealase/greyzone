import { render, screen } from "@testing-library/react";
import DomainPanel from "./DomainPanel";
import { DomainLayer } from "../../types/domain";

describe("DomainPanel", () => {
  const mockLayerState = {
    stress: 0.65,
    resilience: 0.4,
    friction: 0.2,
    activity_level: 0.3,
    variables: {},
  };

  it("renders domain name", () => {
    render(
      <DomainPanel domain={DomainLayer.Cyber} layerState={mockLayerState} />
    );

    expect(screen.getByText("Cyber")).toBeInTheDocument();
  });

  it("renders stress percentage", () => {
    render(
      <DomainPanel domain={DomainLayer.Cyber} layerState={mockLayerState} />
    );

    expect(screen.getByText("65.0%")).toBeInTheDocument();
  });

  it("renders activity level when > 0", () => {
    render(
      <DomainPanel domain={DomainLayer.Energy} layerState={mockLayerState} />
    );

    expect(screen.getByText(/Activity:/)).toBeInTheDocument();
    expect(screen.getByText(/30\.0%/)).toBeInTheDocument();
  });

  it("handles null layer state gracefully", () => {
    render(
      <DomainPanel domain={DomainLayer.Kinetic} layerState={null} />
    );

    expect(screen.getByText("Kinetic")).toBeInTheDocument();
    expect(screen.getByText("0.0%")).toBeInTheDocument();
  });

  it("applies correct stress level class for high stress", () => {
    const highStress = { ...mockLayerState, stress: 0.85 };
    const { container } = render(
      <DomainPanel domain={DomainLayer.Kinetic} layerState={highStress} />
    );

    const fill = container.querySelector(".stress-bar__fill--high");
    expect(fill).toBeInTheDocument();
  });

  it("applies correct stress level class for critical stress", () => {
    const criticalStress = { ...mockLayerState, stress: 0.96 };
    const { container } = render(
      <DomainPanel domain={DomainLayer.Kinetic} layerState={criticalStress} />
    );

    const fill = container.querySelector(".stress-bar__fill--critical");
    expect(fill).toBeInTheDocument();
  });
});
