"""Bridge to communicate with the Rust simulation engine via subprocess JSON protocol."""

from __future__ import annotations

import asyncio
import json
import uuid
from typing import Any

import structlog

logger = structlog.get_logger()


class EngineError(Exception):
    """Raised when the engine returns an error or is unavailable."""


class EngineBridge:
    """Manages communication with Rust engine subprocesses."""

    def __init__(self, binary_path: str) -> None:
        self.binary_path = binary_path
        self._processes: dict[uuid.UUID, asyncio.subprocess.Process] = {}

    async def start_engine(
        self, run_id: uuid.UUID, scenario_config: dict, seed: int
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

            # Send init command with scenario config
            init_response = await self.send_command(
                run_id,
                {"command": "init", "config": scenario_config},
            )
            logger.info(
                "engine_started", run_id=str(run_id), response=init_response
            )
        except FileNotFoundError:
            raise EngineError(
                f"Engine binary not found at {self.binary_path}. "
                "Ensure the Rust engine is compiled."
            )
        except Exception as e:
            raise EngineError(f"Failed to start engine: {e}")

    async def send_command(self, run_id: uuid.UUID, command: dict) -> dict:
        """Send a JSON command to the engine and get response."""
        process = self._processes.get(run_id)
        if process is None:
            raise EngineError(f"No engine running for run {run_id}")
        if process.stdin is None or process.stdout is None:
            raise EngineError(f"Engine I/O not available for run {run_id}")

        line = json.dumps(command) + "\n"
        process.stdin.write(line.encode())
        await process.stdin.drain()

        response_line = await asyncio.wait_for(
            process.stdout.readline(), timeout=30.0
        )
        if not response_line:
            raise EngineError(f"Engine closed unexpectedly for run {run_id}")

        try:
            return json.loads(response_line.decode())
        except json.JSONDecodeError as e:
            raise EngineError(f"Invalid JSON from engine: {e}")

    async def get_state(self, run_id: uuid.UUID) -> dict:
        """Get the full game state."""
        return await self.send_command(run_id, {"command": "get_state"})

    async def get_role_state(self, run_id: uuid.UUID, role_id: str) -> dict:
        """Get game state scoped to a specific role (fog of war)."""
        return await self.send_command(
            run_id, {"command": "get_role_state", "role_id": role_id}
        )

    async def get_legal_actions(self, run_id: uuid.UUID, role_id: str) -> list[Any]:
        """Get legal actions available for a role."""
        result = await self.send_command(
            run_id, {"command": "get_legal_actions", "role_id": role_id}
        )
        return result.get("actions", [])

    async def submit_action(self, run_id: uuid.UUID, action: dict) -> dict:
        """Submit a player action to the engine."""
        return await self.send_command(
            run_id, {"command": "submit_action", "action": action}
        )

    async def advance_turn(self, run_id: uuid.UUID) -> dict:
        """Advance the simulation by one turn."""
        return await self.send_command(run_id, {"command": "advance_turn"})

    async def take_snapshot(self, run_id: uuid.UUID) -> dict:
        """Take a snapshot of current state for replay."""
        return await self.send_command(run_id, {"command": "take_snapshot"})

    async def get_event_log(self, run_id: uuid.UUID) -> list[Any]:
        """Get the engine's event log."""
        result = await self.send_command(run_id, {"command": "get_event_log"})
        return result.get("events", [])

    async def replay_to_turn(self, run_id: uuid.UUID, turn: int) -> dict:
        """Replay game state to a specific turn."""
        return await self.send_command(
            run_id, {"command": "replay_to_turn", "turn": turn}
        )

    async def get_metrics(self, run_id: uuid.UUID) -> dict:
        """Get current simulation metrics."""
        return await self.send_command(run_id, {"command": "get_metrics"})

    async def shutdown_engine(self, run_id: uuid.UUID) -> None:
        """Shut down an engine subprocess."""
        process = self._processes.pop(run_id, None)
        if process is None:
            return

        try:
            if process.stdin is not None:
                line = json.dumps({"command": "shutdown"}) + "\n"
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
