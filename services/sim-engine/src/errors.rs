use thiserror::Error;

/// Errors that can occur during action validation and submission.
#[derive(Debug, Error, Clone)]
pub enum ActionError {
    #[error("Actor {0} not found")]
    ActorNotFound(String),

    #[error("Role {0} does not control actor {1}")]
    RoleDoesNotControlActor(String, String),

    #[error("Action type {0} requires minimum phase {1}, current phase is {2}")]
    PhaseRestriction(String, String, String),

    #[error("Insufficient resources: need {needed}, have {available}")]
    InsufficientResources { needed: f64, available: f64 },

    #[error("Invalid target layer for action type: {0}")]
    InvalidTargetLayer(String),

    #[error("Target actor {0} not found")]
    TargetActorNotFound(String),

    #[error("Invalid parameter: {0}")]
    InvalidParameter(String),

    #[error("Action not allowed in current state: {0}")]
    NotAllowed(String),
}

/// Errors that can occur in the simulation engine.
#[derive(Debug, Error)]
pub enum EngineError {
    #[error("Scenario not found: {0}")]
    ScenarioNotFound(String),

    #[error("Invalid turn for replay: {requested}, max is {max}")]
    InvalidTurn { requested: u32, max: u32 },

    #[error("Engine not initialized")]
    NotInitialized,

    #[error("Serialization error: {0}")]
    SerializationError(String),

    #[error("Action error: {0}")]
    ActionError(#[from] ActionError),
}
