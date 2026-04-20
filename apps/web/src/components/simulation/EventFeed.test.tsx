import { render, screen } from "@testing-library/react";
import EventFeed from "./EventFeed";
import { TurnEvent } from "../../types/run";
import { DomainLayer } from "../../types/domain";

describe("EventFeed", () => {
  const makeEvent = (overrides: Partial<TurnEvent> = {}): TurnEvent => ({
    id: "evt-1",
    type: "action",
    description: "Deployed forces to sector A",
    domain: DomainLayer.Kinetic,
    actor: "blue_commander",
    turn: 1,
    visibility: "all",
    ...overrides,
  });

  it("renders empty state when no events", () => {
    render(<EventFeed events={[]} />);
    expect(screen.getByText("No events yet.")).toBeInTheDocument();
  });

  it("renders title", () => {
    render(<EventFeed events={[]} />);
    expect(screen.getByText("Event Feed")).toBeInTheDocument();
  });

  it("renders event description and turn", () => {
    render(<EventFeed events={[makeEvent()]} />);
    expect(screen.getByText("Deployed forces to sector A")).toBeInTheDocument();
    expect(screen.getByText("T1")).toBeInTheDocument();
  });

  it("renders domain label for domain events", () => {
    render(<EventFeed events={[makeEvent({ domain: DomainLayer.Cyber })]} />);
    // "Cyber" appears as both a domain badge in the event and in the filter dropdown
    const items = screen.getAllByText("Cyber");
    // At least 2: one in dropdown, one as event badge
    expect(items.length).toBeGreaterThanOrEqual(2);
  });

  it("omits domain badge when domain is null", () => {
    const { container } = render(<EventFeed events={[makeEvent({ domain: null })]} />);
    // No event-item__domain badge should appear in the event items
    const domainBadges = container.querySelectorAll(".event-item__domain");
    expect(domainBadges.length).toBe(0);
  });

  it.each([
    ["action", "ACTION"],
    ["stochastic", "EVENT"],
    ["phase_transition", "PHASE"],
    ["coupling_effect", "COUPLING"],
    ["ai_action", "OPPONENT"],
    ["narrative", "SITREP"],
    ["intel", "INTEL"],
    ["threat", "THREAT"],
  ] as const)("renders %s type as %s badge", (type, label) => {
    render(<EventFeed events={[makeEvent({ type, id: `evt-${type}` })]} />);
    // Badge appears in both filter pills and event item; check at least one exists
    const matches = screen.getAllByText(label);
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });

  it("applies new animation class to first 3 events", () => {
    const events = Array.from({ length: 5 }, (_, i) =>
      makeEvent({ id: `evt-${i}`, turn: i })
    );
    const { container } = render(<EventFeed events={events} />);
    const items = container.querySelectorAll(".event-item");
    expect(items[0]).toHaveClass("event-item--new");
    expect(items[2]).toHaveClass("event-item--new");
    expect(items[3]).not.toHaveClass("event-item--new");
  });

  it("applies user-action class for executed actions", () => {
    const { container } = render(
      <EventFeed
        events={[makeEvent({ description: "Executed cyber operation" })]}
      />
    );
    const item = container.querySelector(".event-item--user-action");
    expect(item).toBeInTheDocument();
  });

  it("does not apply user-action class for non-executed descriptions", () => {
    const { container } = render(
      <EventFeed events={[makeEvent({ description: "Forces deployed" })]} />
    );
    expect(
      container.querySelector(".event-item--user-action")
    ).not.toBeInTheDocument();
  });

  it("renders multiple events in order", () => {
    const events = [
      makeEvent({ id: "evt-1", description: "First event", turn: 1 }),
      makeEvent({ id: "evt-2", description: "Second event", turn: 2 }),
    ];
    render(<EventFeed events={events} />);
    expect(screen.getByText("First event")).toBeInTheDocument();
    expect(screen.getByText("Second event")).toBeInTheDocument();
    expect(screen.getByText("T1")).toBeInTheDocument();
    expect(screen.getByText("T2")).toBeInTheDocument();
  });
});
