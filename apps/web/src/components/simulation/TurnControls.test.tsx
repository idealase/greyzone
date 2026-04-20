import { render, screen, fireEvent } from "@testing-library/react";
import TurnControls from "./TurnControls";

describe("TurnControls", () => {
  const defaultProps = {
    turn: 3,
    isAdvancing: false,
    onAdvanceTurn: vi.fn(),
    isObserver: false,
  };

  it("displays the current turn number", () => {
    render(<TurnControls {...defaultProps} />);
    expect(screen.getByText("Turn 3")).toBeInTheDocument();
  });

  it("renders End Turn button for players", () => {
    render(<TurnControls {...defaultProps} />);
    expect(
      screen.getByRole("button", { name: "End Turn" })
    ).toBeInTheDocument();
  });

  it("hides button for observers", () => {
    render(<TurnControls {...defaultProps} isObserver />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("disables button when advancing", () => {
    render(<TurnControls {...defaultProps} isAdvancing />);
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("shows Advancing text when advancing", () => {
    render(<TurnControls {...defaultProps} isAdvancing />);
    expect(
      screen.getByRole("button", { name: "Advancing..." })
    ).toBeInTheDocument();
  });

  it("calls onAdvanceTurn when button clicked", () => {
    const fn = vi.fn();
    render(<TurnControls {...defaultProps} onAdvanceTurn={fn} />);
    fireEvent.click(screen.getByRole("button", { name: "End Turn" }));
    expect(fn).toHaveBeenCalledOnce();
  });

  it("does not call onAdvanceTurn when disabled", () => {
    const fn = vi.fn();
    render(
      <TurnControls {...defaultProps} onAdvanceTurn={fn} isAdvancing />
    );
    fireEvent.click(screen.getByRole("button"));
    expect(fn).not.toHaveBeenCalled();
  });
});
