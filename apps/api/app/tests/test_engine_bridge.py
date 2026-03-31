"""Tests for the engine bridge with mock subprocess."""

import json
import uuid
from unittest.mock import AsyncMock, MagicMock

import pytest

from app.services.engine_bridge import EngineBridge, EngineError


@pytest.fixture
def bridge() -> EngineBridge:
    return EngineBridge("/fake/engine")


@pytest.mark.asyncio
async def test_start_engine_binary_not_found(bridge: EngineBridge):
    """Starting engine with missing binary should raise EngineError."""
    with pytest.raises(EngineError, match="Engine binary not found"):
        await bridge.start_engine(uuid.uuid4(), "test_scenario", seed=42)


@pytest.mark.asyncio
async def test_send_command_no_engine(bridge: EngineBridge):
    """Sending command to non-existent engine should raise EngineError."""
    with pytest.raises(EngineError, match="No engine running"):
        await bridge.send_command(uuid.uuid4(), "GetState")


@pytest.mark.asyncio
async def test_send_command_success(bridge: EngineBridge):
    """Test sending a command when an engine process exists."""
    run_id = uuid.uuid4()
    inner_data = {"turn": 0}
    response_envelope = {"status": "Ok", "data": inner_data}
    response_bytes = (json.dumps(response_envelope) + "\n").encode()

    mock_process = MagicMock()
    mock_stdin = MagicMock()
    mock_stdin.write = MagicMock()
    mock_stdin.drain = AsyncMock()
    mock_process.stdin = mock_stdin

    mock_stdout = AsyncMock()
    mock_stdout.readline = AsyncMock(return_value=response_bytes)
    mock_process.stdout = mock_stdout

    bridge._processes[run_id] = mock_process

    result = await bridge.send_command(run_id, "GetState")
    assert result == inner_data
    mock_stdin.write.assert_called_once()


@pytest.mark.asyncio
async def test_shutdown_engine(bridge: EngineBridge):
    """Test graceful engine shutdown."""
    run_id = uuid.uuid4()

    mock_process = MagicMock()
    mock_stdin = MagicMock()
    mock_stdin.write = MagicMock()
    mock_stdin.drain = AsyncMock()
    mock_stdin.close = MagicMock()
    mock_process.stdin = mock_stdin
    mock_process.stdout = MagicMock()
    mock_process.wait = AsyncMock(return_value=0)
    mock_process.kill = MagicMock()

    bridge._processes[run_id] = mock_process

    await bridge.shutdown_engine(run_id)
    assert run_id not in bridge._processes
    mock_stdin.close.assert_called_once()


@pytest.mark.asyncio
async def test_shutdown_nonexistent_engine(bridge: EngineBridge):
    """Shutting down a non-existent engine should be a no-op."""
    await bridge.shutdown_engine(uuid.uuid4())  # Should not raise


@pytest.mark.asyncio
async def test_get_state_delegates(bridge: EngineBridge):
    """get_state should call send_command with correct args."""
    run_id = uuid.uuid4()
    inner_data = {"turn": 1, "phase": "Escalation"}
    response_envelope = {"status": "Ok", "data": inner_data}
    response_bytes = (json.dumps(response_envelope) + "\n").encode()

    mock_process = MagicMock()
    mock_stdin = MagicMock()
    mock_stdin.write = MagicMock()
    mock_stdin.drain = AsyncMock()
    mock_process.stdin = mock_stdin

    mock_stdout = AsyncMock()
    mock_stdout.readline = AsyncMock(return_value=response_bytes)
    mock_process.stdout = mock_stdout

    bridge._processes[run_id] = mock_process

    result = await bridge.get_state(run_id)
    assert result == inner_data


@pytest.mark.asyncio
async def test_shutdown_all(bridge: EngineBridge):
    """shutdown_all should clean up all processes."""
    for _ in range(3):
        run_id = uuid.uuid4()
        mock_process = MagicMock()
        mock_stdin = MagicMock()
        mock_stdin.write = MagicMock()
        mock_stdin.drain = AsyncMock()
        mock_stdin.close = MagicMock()
        mock_process.stdin = mock_stdin
        mock_process.stdout = MagicMock()
        mock_process.wait = AsyncMock(return_value=0)
        mock_process.kill = MagicMock()
        bridge._processes[run_id] = mock_process

    await bridge.shutdown_all()
    assert len(bridge._processes) == 0
