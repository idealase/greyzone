use greyzone_engine::engine::SimulationEngine;
use greyzone_engine::protocol::{EngineCommand, EngineResponse};
use greyzone_engine::scenario::get_scenario;
use std::io::{self, BufRead, Write};
use tracing::{error, info};

fn main() {
    // Initialize tracing to stderr so it does not interfere with the JSON protocol on stdout
    tracing_subscriber_init();

    info!("Greyzone Engine starting up (JSON protocol on stdin/stdout)");

    let stdin = io::stdin();
    let stdout = io::stdout();
    let mut stdout_lock = stdout.lock();

    let mut engine: Option<SimulationEngine> = None;

    for line in stdin.lock().lines() {
        let line = match line {
            Ok(l) => l,
            Err(e) => {
                error!("Failed to read from stdin: {}", e);
                break;
            }
        };

        let trimmed = line.trim();
        if trimmed.is_empty() {
            continue;
        }

        let command: EngineCommand = match serde_json::from_str(trimmed) {
            Ok(cmd) => cmd,
            Err(e) => {
                let resp = EngineResponse::error("PARSE_ERROR", format!("Invalid JSON: {}", e));
                write_response(&mut stdout_lock, &resp);
                continue;
            }
        };

        let response = handle_command(&mut engine, command);
        write_response(&mut stdout_lock, &response);

        // Check if we should shut down
        if matches!(
            serde_json::from_str::<EngineCommand>(trimmed),
            Ok(EngineCommand::Shutdown)
        ) {
            info!("Shutting down");
            break;
        }
    }
}

fn handle_command(
    engine: &mut Option<SimulationEngine>,
    command: EngineCommand,
) -> EngineResponse {
    match command {
        EngineCommand::NewGame { scenario_id, seed } => {
            match get_scenario(&scenario_id) {
                Some(scenario) => {
                    let eng = SimulationEngine::new(scenario, seed);
                    let state = eng.get_state().clone();
                    *engine = Some(eng);
                    info!("New game started: scenario={}, seed={}", scenario_id, seed);
                    EngineResponse::ok(state)
                }
                None => EngineResponse::error(
                    "SCENARIO_NOT_FOUND",
                    format!("Scenario '{}' not found", scenario_id),
                ),
            }
        }
        EngineCommand::GetState => {
            with_engine(engine, |eng| EngineResponse::ok(eng.get_state()))
        }
        EngineCommand::GetRoleState { role_id } => {
            with_engine(engine, |eng| {
                EngineResponse::ok(eng.get_role_visible_state(&role_id))
            })
        }
        EngineCommand::GetLegalActions { role_id } => {
            with_engine(engine, |eng| {
                EngineResponse::ok(eng.derive_legal_actions(&role_id))
            })
        }
        EngineCommand::ValidateAction { action } => {
            with_engine(engine, |eng| match eng.validate_action(&action) {
                Ok(()) => EngineResponse::ok("valid"),
                Err(e) => EngineResponse::error("VALIDATION_ERROR", e.to_string()),
            })
        }
        EngineCommand::SubmitAction { action } => {
            with_engine_mut(engine, |eng| match eng.submit_action(action) {
                Ok(effects) => EngineResponse::ok(effects),
                Err(e) => EngineResponse::error("ACTION_ERROR", e.to_string()),
            })
        }
        EngineCommand::AdvanceTurn => {
            with_engine_mut(engine, |eng| {
                let result = eng.advance_turn();
                EngineResponse::ok(result)
            })
        }
        EngineCommand::TakeSnapshot => {
            with_engine_mut(engine, |eng| {
                eng.take_snapshot();
                EngineResponse::ok("snapshot_taken")
            })
        }
        EngineCommand::GetEventLog => {
            with_engine(engine, |eng| EngineResponse::ok(eng.get_event_log()))
        }
        EngineCommand::ReplayToTurn { turn } => {
            with_engine(engine, |eng| match eng.replay_to_turn(turn) {
                Ok(state) => EngineResponse::ok(state),
                Err(e) => EngineResponse::error("REPLAY_ERROR", e.to_string()),
            })
        }
        EngineCommand::GetMetrics => {
            with_engine(engine, |eng| EngineResponse::ok(eng.get_metrics()))
        }
        EngineCommand::Shutdown => {
            info!("Shutdown command received");
            EngineResponse::ok("shutting_down")
        }
    }
}

fn with_engine(
    engine: &Option<SimulationEngine>,
    f: impl FnOnce(&SimulationEngine) -> EngineResponse,
) -> EngineResponse {
    match engine {
        Some(eng) => f(eng),
        None => EngineResponse::error("NOT_INITIALIZED", "No game in progress. Send NewGame first."),
    }
}

fn with_engine_mut(
    engine: &mut Option<SimulationEngine>,
    f: impl FnOnce(&mut SimulationEngine) -> EngineResponse,
) -> EngineResponse {
    match engine {
        Some(eng) => f(eng),
        None => EngineResponse::error("NOT_INITIALIZED", "No game in progress. Send NewGame first."),
    }
}

fn write_response(out: &mut impl Write, response: &EngineResponse) {
    if let Ok(json) = serde_json::to_string(response) {
        let _ = writeln!(out, "{}", json);
        let _ = out.flush();
    }
}

/// Initialize tracing subscriber writing to stderr.
fn tracing_subscriber_init() {
    use tracing_subscriber::fmt;
    use tracing_subscriber::EnvFilter;

    let filter = EnvFilter::try_from_default_env().unwrap_or_else(|_| EnvFilter::new("info"));

    fmt()
        .with_env_filter(filter)
        .with_writer(io::stderr)
        .with_target(false)
        .init();
}
