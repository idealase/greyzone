"""Bridge to communicate with the Rust simulation engine via subprocess JSON protocol."""

from __future__ import annotations

import asyncio
import json
import re
import uuid
from typing import Any

import structlog

logger = structlog.get_logger()


class EngineError(Exception):
    """Raised when the engine returns an error or is unavailable."""


def _scenario_name_to_engine_id(name: str) -> str:
    """Convert a human-readable scenario name to an engine scenario ID.

    e.g. "Baltic Flashpoint" -> "baltic_flashpoint"
    """
    return re.sub(r"[^a-z0-9]+", "_", name.lower()).strip("_")


class EngineBridge:
    """Manages communication with Rust engine subprocesses."""

    def __init__(self, binary_path: str) -> None:
        self.binary_path = binary_path
        self._processes: dict[uuid.UUID, asyncio.subprocess.Process] = {}

    async def start_engine(
        self, run_id: uuid.UUID, scenario_name: str, seed: int
    ) -> None:
        """Start an engine subprocess for a run."""
        if run_id in self._processes:
            raise EngineError(f"Engine already running for run {run_id}")

        try:
            process = await asyncio.create_subprocess_exec(
                self.binary_path,
                "--mode",
                "interactive",
                "--seed",
                str(seed),
                stdin=asyncio.subprocess.PIPE,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
            )
            self._processes[run_id] = process

            scenario_id = _scenario_name_to_engine_id(scenario_name)
            init_response = await self._send_raw(
                run_id,
                {
                    "command": "NewGame",
                    "data": {"scenario_id": scenario_id, "seed": seed},
                },
            )
            logger.info(
                "engine_started", run_id=str(run_id), response=init_response
            )
        except FileNotFoundError:
            raise EngineError(
                f"Engine binary not found at {self.binary_path}. "
                "Ensure the Rust engine is compiled."
            )
        except EngineError:
            self._processes.pop(run_id, None)
            raise
        except Exception as e:
            self._processes.pop(run_id, None)
            raise EngineError(f"Failed to start engine: {e}")

    async def _send_raw(self, run_id: uuid.UUID, payload: dict) -> dict:
        """Send a raw JSON payload and parse the engine response."""
        process = self._processes.get(run_id)
        if process is None:
            raise EngineError(f"No engine running for run {run_id}")
        if process.stdin is None or process.stdout is None:
            raise EngineError(f"Engine I/O not available for run {run_id}")

        line = json.dumps(payload) + "\n"
        process.stdin.write(line.encode())
        await process.stdin.drain()

        response_line = await asyncio.wait_for(
            process.stdout.readline(), timeout=30.0
        )
        if not response_line:
            raise EngineError(f"Engine closed unexpectedly for run {run_id}")

        try:
            resp = json.loads(response_line.decode())
        except json.JSONDecodeError as e:
            raise EngineError(f"Invalid JSON from engine: {e}")

        # Engine responds with {"status": "Ok", "data": ...}
        # or {"status": "Error", "code": "...", "message": "..."}
        if resp.get("status") == "Error":
            code = resp.get("code", "UNKNOWN")
            message = resp.get("message", "Unknown engine error")
            raise EngineError(f"Engine error [{code}]: {message}")

        return resp.get("data", {})

    async def send_command(self, run_id: uuid.UUID, command: str, data: dict | None = None) -> dict:
        """Send a command to the engine using the correct protocol format."""
        payload: dict[str, Any] = {"command": command}
        if data is not None:
            payload["data"] = data
        return await self._send_raw(run_id, payload)

    async def get_state(self, run_id: uuid.UUID) -> dict:
        """Get the full game state."""
        return await self.send_command(run_id, "GetState")

    async def get_role_state(self, run_id: uuid.UUID, role_id: str) -> dict:
        """Get game state scoped to a specific role (fog of war)."""
        return await self.send_command(run_id, "GetRoleState", {"role_id": role_id})

    async def get_legal_actions(self, run_id: uuid.UUID, role_id: str) -> list[Any]:
        """Get legal actions available for a role."""
        result = await self.send_command(
            run_id, "GetLegalActions", {"role_id": role_id}
        )
        if isinstance(result, dict):
            return result.get("actions", [])
        return result if isinstance(result, list) else []

    async def submit_action(self, run_id: uuid.UUID, action: dict) -> dict:
        """Submit a player action to the engine."""
        return await self.send_command(run_id, "SubmitAction", {"action": action})

    async def advance_turn(self, run_id: uuid.UUID) -> dict:
        """Advance the simulation by one turn."""
        return await self.send_command(run_id, "AdvanceTurn")

    async def take_snapshot(self, run_id: uuid.UUID) -> dict:
        """Take a snapshot of current state for replay."""
        return await self.send_command(run_id, "TakeSnapshot")

    async def get_event_log(self, run_id: uuid.UUID) -> list[Any]:
        """Get the engine's event log."""
        result = await self.send_command(run_id, "GetEventLog")
        if isinstance(result, dict):
            return result.get("events", [])
        return result if isinstance(result, list) else []

    async def replay_to_turn(self, run_id: uuid.UUID, turn: int) -> dict:
        """Replay game state to a specific turn."""
        return await self.send_command(run_id, "ReplayToTurn", {"turn": turn})

    async def get_metrics(self, run_id: uuid.UUID) -> dict:
        """Get current simulation metrics."""
        return await self.send_command(run_id, "GetMetrics")

    async def shutdown_engine(self, run_id: uuid.UUID) -> None:
        """Shut down an engine subprocess."""
        process = self._processes.pop(run_id, None)
        if process is None:
            return

        try:
            if process.stdin is not None:
                line = json.dumps({"command": "Shutdown"}) + "\n"
                process.stdin.write(line.encode())
                await process.stdin.drain()
                process.stdin.close()
            await asyncio.wait_for(process.wait(), timeout=5.0)
        except (asyncio.TimeoutError, Exception):
            process.kill()
            await process.wait()

        logger.info("engine_shutdown", run_id=str(run_id))

    async def shutdown_all(self) -> None:
        """Shut down all engine subprocesses."""
        run_ids = list(self._processes.keys())
        for run_id in run_ids:
            await self.shutdown_engine(run_id)

    def get_process_status(self) -> dict[str, str]:
        """Return a summary of known engine subprocesses."""
        status: dict[str, str] = {}
        for run_id, process in self._processes.items():
            if process.returncode is None:
                status[str(run_id)] = "running"
            else:
                status[str(run_id)] = "stopped"
        return status
