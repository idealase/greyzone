import { useRunStore } from "./runStore";
import { Phase } from "../types/phase";
import { DomainLayer } from "../types/domain";
import { RunRead, WorldState, TurnEvent, RunParticipant } from "../types/run";

function makeWorldState(overrides: Partial<WorldState> = {}): WorldState {
  return {
    layers: {
      [DomainLayer.Kinetic]: {
        stress: 0.1,
        resilience: 0.9,
        friction: 0,
        activity_level: 0,
        variables: {},
      },
      [DomainLayer.MaritimeLogistics]: {
        stress: 0.2,
        resilience: 0.8,
        friction: 0,
        activity_level: 0,
        variables: {},
      },
      [DomainLayer.Energy]: {
        stress: 0.15,
        resilience: 0.85,
        friction: 0,
        activity_level: 0,
        variables: {},
      },
      [DomainLayer.GeoeconomicIndustrial]: {
        stress: 0.1,
        resilience: 0.9,
        friction: 0,
        activity_level: 0,
        variables: {},
      },
      [DomainLayer.Cyber]: {
        stress: 0.3,
        resilience: 0.7,
        friction: 0,
        activity_level: 0.1,
        variables: {},
      },
      [DomainLayer.SpacePnt]: {
        stress: 0.05,
        resilience: 0.95,
        friction: 0,
        activity_level: 0,
        variables: {},
      },
      [DomainLayer.InformationCognitive]: {
        stress: 0.25,
        resilience: 0.75,
        friction: 0,
        activity_level: 0,
        variables: {},
      },
      [DomainLayer.DomesticPoliticalFiscal]: {
        stress: 0.12,
        resilience: 0.88,
        friction: 0,
        activity_level: 0,
        variables: {},
      },
    },
    phase: Phase.CompetitiveNormality,
    order_parameter: 0.2,
    turn: 1,
    coupling_matrix: {},
    ...overrides,
  };
}

describe("runStore", () => {
  beforeEach(() => {
    useRunStore.getState().reset();
  });

  it("initializes with default state", () => {
    const state = useRunStore.getState();
    expect(state.run).toBeNull();
    expect(state.worldState).toBeNull();
    expect(state.currentPhase).toBe(Phase.CompetitiveNormality);
    expect(state.orderParameter).toBe(0);
    expect(state.currentTurn).toBe(0);
    expect(state.events).toEqual([]);
    expect(state.participants).toEqual([]);
  });

  it("setRun updates run and derived state", () => {
    const worldState = makeWorldState({ turn: 3, phase: Phase.HybridCoercion, order_parameter: 0.5 });
    const run: RunRead = {
      id: "r1",
      name: "Test Run",
      scenario_id: "s1",
      scenario_name: "Test Scenario",
      status: "in_progress",
      current_turn: 3,
      current_phase: Phase.HybridCoercion,
      order_parameter: 0.5,
      seed: null,
      world_state: worldState,
      participants: [],
      created_at: "2025-01-01",
      updated_at: "2025-01-01",
    };

    useRunStore.getState().setRun(run);
    const state = useRunStore.getState();

    expect(state.run).toBe(run);
    expect(state.worldState).toBe(worldState);
    expect(state.currentPhase).toBe(Phase.HybridCoercion);
    expect(state.orderParameter).toBe(0.5);
    expect(state.currentTurn).toBe(3);
  });

  it("addEvents prepends and caps at 200", () => {
    const event1: TurnEvent = {
      id: "e1",
      type: "action",
      description: "First",
      domain: null,
      actor: null,
      turn: 1,
      visibility: "all",
    };
    const event2: TurnEvent = {
      id: "e2",
      type: "stochastic",
      description: "Second",
      domain: null,
      actor: null,
      turn: 1,
      visibility: "all",
    };

    useRunStore.getState().addEvents([event1]);
    useRunStore.getState().addEvents([event2]);

    const state = useRunStore.getState();
    expect(state.events).toHaveLength(2);
    expect(state.events[0].id).toBe("e2");
    expect(state.events[1].id).toBe("e1");
  });

  it("addParticipant adds and deduplicates by user_id", () => {
    const p1: RunParticipant = {
      user_id: "u1",
      username: "alice",
      role: "blue_commander",
      is_human: true,
      is_online: true,
      joined_at: "2025-01-01",
    };

    useRunStore.getState().addParticipant(p1);
    expect(useRunStore.getState().participants).toHaveLength(1);

    const p1Updated = { ...p1, role: "observer" as const };
    useRunStore.getState().addParticipant(p1Updated);
    expect(useRunStore.getState().participants).toHaveLength(1);
    expect(useRunStore.getState().participants[0].role).toBe("observer");
  });

  it("removeParticipant removes by user_id", () => {
    const p1: RunParticipant = {
      user_id: "u1",
      username: "alice",
      role: "blue_commander",
      is_human: true,
      is_online: true,
      joined_at: "2025-01-01",
    };

    useRunStore.getState().addParticipant(p1);
    useRunStore.getState().removeParticipant("u1");
    expect(useRunStore.getState().participants).toHaveLength(0);
  });

  it("addStressSnapshot tracks history capped at 50", () => {
    const worldState = makeWorldState();

    for (let i = 0; i < 55; i++) {
      useRunStore.getState().addStressSnapshot(i, worldState.layers);
    }

    expect(useRunStore.getState().stressHistory).toHaveLength(50);
    expect(useRunStore.getState().stressHistory[0].turn).toBe(5);
  });

  it("reset returns to initial state", () => {
    const worldState = makeWorldState();
    useRunStore.getState().setWorldState(worldState);
    useRunStore.getState().reset();

    const state = useRunStore.getState();
    expect(state.worldState).toBeNull();
    expect(state.currentTurn).toBe(0);
    expect(state.events).toEqual([]);
  });

  it("ignores null or undefined world state updates", () => {
    const initialWorldState = makeWorldState();
    useRunStore.getState().setWorldState(initialWorldState);
    useRunStore.getState().setWorldState(undefined);
    useRunStore.getState().setWorldState(null);

    const state = useRunStore.getState();
    expect(state.worldState).toBe(initialWorldState);
    expect(state.currentTurn).toBe(initialWorldState.turn);
  });

  it("falls back to existing values when world state is missing fields", () => {
    const baseWorldState = makeWorldState();
    useRunStore.getState().setWorldState(baseWorldState);

    // @ts-expect-error allow partial state for robustness test
    useRunStore.getState().setWorldState({ layers: baseWorldState.layers });

    const state = useRunStore.getState();
    expect(state.currentPhase).toBe(baseWorldState.phase);
    expect(state.orderParameter).toBe(baseWorldState.order_parameter);
    expect(state.currentTurn).toBe(baseWorldState.turn);
  });
});
