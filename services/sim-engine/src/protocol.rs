use crate::action::Action;
use serde::{Deserialize, Serialize};

/// Commands that can be sent to the engine via the JSON protocol.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "command", content = "data")]
pub enum EngineCommand {
    NewGame { scenario_id: String, seed: u64 },
    GetState,
    GetRoleState { role_id: String },
    GetLegalActions { role_id: String },
    ValidateAction { action: Action },
    SubmitAction { action: Action },
    AdvanceTurn,
    TakeSnapshot,
    GetEventLog,
    ReplayToTurn { turn: u32 },
    GetMetrics,
    Shutdown,
}

/// Responses from the engine.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "status")]
pub enum EngineResponse {
    Ok { data: serde_json::Value },
    Error { code: String, message: String },
}

impl EngineResponse {
    pub fn ok(data: impl Serialize) -> Self {
        EngineResponse::Ok {
            data: serde_json::to_value(data).unwrap_or(serde_json::Value::Null),
        }
    }

    pub fn error(code: impl Into<String>, message: impl Into<String>) -> Self {
        EngineResponse::Error {
            code: code.into(),
            message: message.into(),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_command_serialization() {
        let cmd = EngineCommand::NewGame {
            scenario_id: "baltic_flashpoint".into(),
            seed: 42,
        };
        let json = serde_json::to_string(&cmd).unwrap();
        assert!(json.contains("NewGame"));
        let deser: EngineCommand = serde_json::from_str(&json).unwrap();
        match deser {
            EngineCommand::NewGame { scenario_id, seed } => {
                assert_eq!(scenario_id, "baltic_flashpoint");
                assert_eq!(seed, 42);
            }
            _ => panic!("Wrong command type"),
        }
    }

    #[test]
    fn test_response_ok() {
        let resp = EngineResponse::ok("hello");
        let json = serde_json::to_string(&resp).unwrap();
        assert!(json.contains("Ok"));
    }

    #[test]
    fn test_response_error() {
        let resp = EngineResponse::error("NOT_FOUND", "Scenario not found");
        let json = serde_json::to_string(&resp).unwrap();
        assert!(json.contains("Error"));
        assert!(json.contains("NOT_FOUND"));
    }

    #[test]
    fn test_all_commands_deserialize() {
        let commands = vec![
            r#"{"command":"GetState"}"#,
            r#"{"command":"AdvanceTurn"}"#,
            r#"{"command":"TakeSnapshot"}"#,
            r#"{"command":"GetEventLog"}"#,
            r#"{"command":"GetMetrics"}"#,
            r#"{"command":"Shutdown"}"#,
            r#"{"command":"GetRoleState","data":{"role_id":"blue_commander"}}"#,
            r#"{"command":"GetLegalActions","data":{"role_id":"blue_commander"}}"#,
            r#"{"command":"ReplayToTurn","data":{"turn":5}}"#,
            r#"{"command":"NewGame","data":{"scenario_id":"default","seed":42}}"#,
        ];

        for json in commands {
            let result: Result<EngineCommand, _> = serde_json::from_str(json);
            assert!(
                result.is_ok(),
                "Failed to deserialize: {} -- error: {:?}",
                json,
                result.err()
            );
        }
    }
}
