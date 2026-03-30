import { fireEvent, render, screen } from "@testing-library/react";
import InfoTooltip from "./InfoTooltip";

describe("InfoTooltip", () => {
  it("toggles visibility when clicked", () => {
    render(<InfoTooltip content="Tooltip body" />);

    const trigger = screen.getByLabelText("More information");
    const bubble = screen.getByRole("tooltip");

    expect(bubble.className).not.toContain("info-tooltip__bubble--visible");

    fireEvent.click(trigger);
    expect(bubble.className).toContain("info-tooltip__bubble--visible");
  });
});
