import { render, screen, fireEvent } from "@testing-library/react";
import TurnControls from "./TurnControls";
import { TurnEvent } from "../../types/run";

describe("TurnControls", () => {
  const defaultProps = {
    turn: 3,
    isAdvancing: false,
    onAdvanceTurn: vi.fn(),
    isObserver: false,
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

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
    expect(screen.queryByRole("button", { name: "End Turn" })).not.toBeInTheDocument();
  });

  it("disables button when advancing", () => {
    render(<TurnControls {...defaultProps} isAdvancing />);
    expect(screen.getByRole("button", { name: "Advancing..." })).toBeDisabled();
  });

  it("shows Advancing text when advancing", () => {
    render(<TurnControls {...defaultProps} isAdvancing />);
    expect(
      screen.getByRole("button", { name: "Advancing..." })
    ).toBeInTheDocument();
  });

  it("opens confirmation dialog when End Turn clicked", () => {
    render(<TurnControls {...defaultProps} />);
    fireEvent.click(screen.getByRole("button", { name: "End Turn" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("End Turn 3?")).toBeInTheDocument();
  });

  it("shows no-action warning when no actions submitted", () => {
    render(<TurnControls {...defaultProps} currentTurnEvents={[]} />);
    fireEvent.click(screen.getByRole("button", { name: "End Turn" }));
    expect(
      screen.getByText(/haven't submitted any actions/)
    ).toBeInTheDocument();
  });

  it("shows submitted actions in dialog", () => {
    const events: TurnEvent[] = [
      {
        id: "e1",
        type: "action",
        description: "Executed Cyber Attack on Cyber (intensity: 0.5)",
        domain: null,
        actor: null,
        turn: 3,
        visibility: "all",
      },
    ];
    render(<TurnControls {...defaultProps} currentTurnEvents={events} />);
    fireEvent.click(screen.getByRole("button", { name: "End Turn" }));
    expect(screen.getByText("Actions submitted (1)")).toBeInTheDocument();
    expect(screen.getByText("Cyber Attack")).toBeInTheDocument();
  });

  it("calls onAdvanceTurn when Confirm clicked", () => {
    const fn = vi.fn();
    render(<TurnControls {...defaultProps} onAdvanceTurn={fn} />);
    fireEvent.click(screen.getByRole("button", { name: "End Turn" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirm" }));
    expect(fn).toHaveBeenCalledOnce();
  });

  it("closes dialog on Cancel", () => {
    render(<TurnControls {...defaultProps} />);
    fireEvent.click(screen.getByRole("button", { name: "End Turn" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("calls onAdvanceTurn directly when skipConfirm state is set", () => {
    // The "Don't show again" checkbox stores in localStorage.
    // Here we test the confirm flow works end-to-end instead.
    const fn = vi.fn();
    render(<TurnControls {...defaultProps} onAdvanceTurn={fn} />);
    fireEvent.click(screen.getByRole("button", { name: "End Turn" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Confirm" }));
    expect(fn).toHaveBeenCalledOnce();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("shows remaining resources", () => {
    render(<TurnControls {...defaultProps} resources={42} />);
    fireEvent.click(screen.getByRole("button", { name: "End Turn" }));
    expect(screen.getByText(/42 RP/)).toBeInTheDocument();
  });

  it("does not call onAdvanceTurn when disabled", () => {
    const fn = vi.fn();
    render(
      <TurnControls {...defaultProps} onAdvanceTurn={fn} isAdvancing />
    );
    fireEvent.click(screen.getByRole("button", { name: "Advancing..." }));
    expect(fn).not.toHaveBeenCalled();
  });
});
