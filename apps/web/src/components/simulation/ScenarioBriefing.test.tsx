import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ScenarioBriefing from "./ScenarioBriefing";
import { ScenarioRead } from "../../types/scenario";

vi.mock("../../api/scenarios", () => ({
  getScenario: vi.fn(),
}));

import { getScenario } from "../../api/scenarios";
const mockGetScenario = vi.mocked(getScenario);

function makeScenario(overrides: Partial<ScenarioRead> = {}): ScenarioRead {
  return {
    id: "scenario-1",
    name: "Baltic Flashpoint",
    description: "A crisis erupts in the Baltic region.",
    config: {
      roles: [
        {
          id: "blue_commander",
          name: "Blue Commander",
          description: "Commands NATO forces",
          controlled_actors: ["nato_alliance"],
        },
        {
          id: "red_commander",
          name: "Red Commander",
          description: "Commands Eastern Bloc forces",
          controlled_actors: ["eastern_bloc"],
        },
        {
          id: "observer",
          name: "Observer",
          description: "Read-only observer",
          controlled_actors: [],
        },
      ],
      actors: [
        {
          id: "nato_alliance",
          name: "NATO Alliance",
          kind: "State",
          capabilities: { Kinetic: 0.8, Cyber: 0.7, Energy: 0.5 },
          resources: 100,
          morale: 80,
          visibility: "Public",
        },
        {
          id: "eastern_bloc",
          name: "Eastern Bloc",
          kind: "State",
          capabilities: { Kinetic: 0.7, Cyber: 0.6, Energy: 0.8 },
          resources: 90,
          morale: 75,
          visibility: "Public",
        },
        {
          id: "un_observers",
          name: "UN Observers",
          kind: "Organization",
          capabilities: { InformationCognitive: 0.5 },
          resources: 30,
          morale: 90,
          visibility: "Public",
        },
      ],
    },
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2025-01-01T00:00:00Z",
    ...overrides,
  };
}

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

describe("ScenarioBriefing", () => {
  const defaultProps = {
    scenarioId: "scenario-1",
    scenarioName: "Baltic Flashpoint",
    side: "blue" as const,
    currentTurn: 1,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders briefing trigger button", () => {
    mockGetScenario.mockResolvedValue(makeScenario());
    render(<ScenarioBriefing {...defaultProps} />, { wrapper });
    expect(screen.getByTitle("View scenario briefing")).toBeInTheDocument();
    expect(screen.getByText(/Briefing/)).toBeInTheDocument();
  });

  it("auto-opens dialog on turn 1 when scenario loads", async () => {
    mockGetScenario.mockResolvedValue(makeScenario());
    render(<ScenarioBriefing {...defaultProps} currentTurn={1} />, { wrapper });
    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });
    expect(
      screen.getByText("SCENARIO BRIEFING: Baltic Flashpoint")
    ).toBeInTheDocument();
  });

  it("shows loading state before data arrives", () => {
    mockGetScenario.mockReturnValue(new Promise(() => {})); // never resolves
    render(<ScenarioBriefing {...defaultProps} />, { wrapper });
    fireEvent.click(screen.getByTitle("View scenario briefing"));
    expect(
      screen.getByText("Loading scenario data...")
    ).toBeInTheDocument();
  });

  it("shows scenario description when loaded", async () => {
    mockGetScenario.mockResolvedValue(makeScenario());
    render(<ScenarioBriefing {...defaultProps} />, { wrapper });
    await waitFor(() => {
      expect(
        screen.getByText("A crisis erupts in the Baltic region.")
      ).toBeInTheDocument();
    });
  });

  it("shows player actors under Your Assignment", async () => {
    mockGetScenario.mockResolvedValue(makeScenario());
    render(<ScenarioBriefing {...defaultProps} side="blue" />, { wrapper });
    await waitFor(() => {
      expect(screen.getByText("NATO Alliance")).toBeInTheDocument();
      expect(
        screen.getByText(/Your Assignment — Blue \(Defending\)/)
      ).toBeInTheDocument();
    });
  });

  it("shows role description for assignment", async () => {
    mockGetScenario.mockResolvedValue(makeScenario());
    render(<ScenarioBriefing {...defaultProps} side="blue" />, { wrapper });
    await waitFor(() => {
      expect(screen.getByText(/Commands NATO forces/)).toBeInTheDocument();
    });
  });

  it("shows opponent actors under Opposition Forces", async () => {
    mockGetScenario.mockResolvedValue(makeScenario());
    render(<ScenarioBriefing {...defaultProps} side="blue" />, { wrapper });
    await waitFor(() => {
      expect(screen.getByText("Eastern Bloc")).toBeInTheDocument();
      expect(screen.getByText("Opposition Forces")).toBeInTheDocument();
    });
  });

  it("shows neutral actors section", async () => {
    mockGetScenario.mockResolvedValue(makeScenario());
    render(<ScenarioBriefing {...defaultProps} />, { wrapper });
    await waitFor(() => {
      expect(screen.getByText("UN Observers")).toBeInTheDocument();
      expect(screen.getByText("Neutral Parties")).toBeInTheDocument();
    });
  });

  it("closes dialog on Understood button click", async () => {
    mockGetScenario.mockResolvedValue(makeScenario());
    render(<ScenarioBriefing {...defaultProps} />, { wrapper });
    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText("Understood"));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
