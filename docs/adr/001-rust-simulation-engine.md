# ADR 001: Rust for Simulation Engine

## Status
Accepted

## Context
The simulation engine must handle deterministic state evolution, complex coupling calculations across 8 domains, and fast tick processing. It must be the sole authority over world-state mutation and support seeded RNG for reproducibility.

## Decision
Implement the simulation engine in Rust.

## Rationale
- **Determinism**: Rust's strict type system and absence of GC pauses ensure reproducible computation. Combined with `rand_chacha` (ChaCha8Rng), identical seeds produce identical runs.
- **Performance**: Complex coupling matrix propagation and phase transition calculations benefit from Rust's zero-cost abstractions.
- **Safety**: The borrow checker prevents data races and memory errors in state management code.
- **Serialization**: `serde` provides efficient, correct (de)serialization for snapshots and the JSON protocol.
- **Integration**: Communicates with the Python backend via a simple JSON-over-stdin/stdout protocol, avoiding FFI complexity.

## Consequences
- Requires Rust toolchain for development
- Subprocess management adds complexity to the Python backend
- JSON protocol has serialization overhead (acceptable for turn-based simulation)
