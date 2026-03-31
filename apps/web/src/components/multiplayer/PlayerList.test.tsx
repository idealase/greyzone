import { render, screen } from "@testing-library/react";
import PlayerList from "./PlayerList";
import { useWebSocketStore } from "../../stores/websocketStore";
import { RunParticipant } from "../../types/run";

const participant: RunParticipant = {
  user_id: "user-1",
  username: "Commander",
  role: "blue_commander",
  is_human: true,
  is_online: true,
  joined_at: new Date().toISOString(),
};

describe("PlayerList presence indicator", () => {
  afterEach(() => {
    useWebSocketStore.getState().reset();
  });

  it("shows unknown status when realtime connection is lost", () => {
    useWebSocketStore.setState({ status: "reconnecting", hasEverConnected: true });

    render(<PlayerList participants={[participant]} />);

    expect(screen.getByTitle("Status unknown (connection lost)")).toBeInTheDocument();
  });

  it("keeps reported presence while connecting for the first time", () => {
    useWebSocketStore.setState({ status: "connecting", hasEverConnected: false });

    render(<PlayerList participants={[{ ...participant, is_online: false }]} />);

    expect(screen.getByTitle("Offline")).toBeInTheDocument();
  });
});
