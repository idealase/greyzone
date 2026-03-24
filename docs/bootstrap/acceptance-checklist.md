# Acceptance Checklist

All items must be satisfied for the repository to be considered complete.

- [ ] Repo bootstraps locally with one documented command path
- [ ] Non-Docker local development path is documented and works
- [ ] All services build successfully
- [ ] DB migrations apply successfully
- [ ] Rust simulation engine runs deterministically with a fixed seed
- [ ] At least one complete scenario exists
- [ ] Multi-user run participation works
- [ ] User can join a run with a role
- [ ] Human can start a run from the UI
- [ ] Human can submit a legal move
- [ ] AI can inspect bounded state and submit a legal move
- [ ] Engine validates and applies both human and AI moves
- [ ] Phase transitions occur and are visible in UI
- [ ] Event log persists
- [ ] Replay works
- [ ] Tests pass in CI
- [ ] Docs match implemented behavior
- [ ] `docs/bootstrap/init-repo-prompt.md` exists and is referenced by README
- [ ] `docs/bootstrap/acceptance-checklist.md` exists and is referenced by README
