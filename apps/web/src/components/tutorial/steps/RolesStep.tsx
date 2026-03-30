import { useState } from "react";

interface RoleDetail {
  id: string;
  name: string;
  faction: string;
  color: string;
  colorClass: string;
  controls: string;
  sees: string;
  objective: string;
  recommended: string;
}

const ROLES: RoleDetail[] = [
  {
    id: "blue_commander",
    name: "Blue Commander",
    faction: "Blue Coalition (NATO)",
    color: "#3b82f6",
    colorClass: "blue",
    controls:
      "NATO military forces, cyber operations, space assets (satellite constellation), information operations, maritime force posture.",
    sees:
      "Full Blue Coalition state + partial Red intelligence (quality degrades as adversary Information domain strength increases).",
    objective:
      "Hold Ψ below Phase 3 for 20+ consecutive turns, or drive Red fiscal reserves below 20% for 10+ turns.",
    recommended:
      "Players who prefer direct military and cyber strategy with NATO assets and multi-domain coordination.",
  },
  {
    id: "red_commander",
    name: "Red Commander",
    faction: "Red Federation (Russia)",
    color: "#ef4444",
    colorClass: "red",
    controls:
      "Russian military and proxy forces, cyber offensive operations, energy supply weaponization, disinformation campaigns, ASAT capabilities.",
    sees:
      "Full Red Federation state + partial Blue intelligence (subject to same intelligence-quality degradation).",
    objective:
      "Drive Ψ to Phase 4 (Overt Interstate War) and maintain it for 5+ turns, or eliminate Blue alliance cohesion below 20%.",
    recommended:
      "Players who prefer asymmetric and hybrid warfare tactics — using energy, cyber, and disinformation as primary levers.",
  },
  {
    id: "observer",
    name: "Observer",
    faction: "Neutral",
    color: "#a1a1aa",
    colorClass: "gray",
    controls:
      "Nothing — read-only access to the simulation state. Cannot submit actions or influence outcomes.",
    sees:
      "Configurable view: omniscient (full both-sides state) or fog-of-war (simulated limited intel). Ideal for learning.",
    objective:
      "Analyze simulation dynamics, track cross-domain effects, and learn how escalation unfolds in real time.",
    recommended:
      "New players learning the game, analysts studying conflict dynamics, and spectators in multiplayer sessions.",
  },
];

export default function RolesStep() {
  const [selected, setSelected] = useState<string | null>("blue_commander");

  const detail = ROLES.find((r) => r.id === selected);

  return (
    <div className="tutorial-step">
      <div className="tutorial-step__header">
        <h2 className="tutorial-step__title">Choose Your Role</h2>
        <p className="tutorial-step__subtitle">
          Each role controls different levers and sees different information
        </p>
      </div>

      <div className="tutorial-role-grid">
        {ROLES.map((role) => (
          <div
            key={role.id}
            className={[
              "tutorial-role-card",
              `tutorial-role-card--${role.colorClass}`,
              selected === role.id ? "tutorial-role-card--selected" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            onClick={() => setSelected(role.id)}
          >
            <div className="tutorial-role-card__header">
              <span
                className="tutorial-role-card__dot"
                style={{ backgroundColor: role.color }}
              />
              <span className="tutorial-role-card__name" style={{ color: role.color }}>
                {role.name}
              </span>
            </div>
            <div className="tutorial-role-card__faction">{role.faction}</div>

            {selected === role.id && detail && detail.id === role.id && (
              <>
                <div className="tutorial-role-detail__section">
                  <div className="tutorial-role-detail__label">Controls</div>
                  <div className="tutorial-role-detail__value">{detail.controls}</div>
                </div>
                <div className="tutorial-role-detail__section">
                  <div className="tutorial-role-detail__label">Sees</div>
                  <div className="tutorial-role-detail__value">{detail.sees}</div>
                </div>
                <div className="tutorial-role-detail__section">
                  <div className="tutorial-role-detail__label">Objective</div>
                  <div className="tutorial-role-detail__value">{detail.objective}</div>
                </div>
                <div className="tutorial-role-detail__reco">
                  Recommended for: {detail.recommended}
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      <div className="tutorial-role-note">
        ℹ️ <strong>Multiplayer note:</strong> In multiplayer, all roles can be filled by humans. In a
        solo run, you play your chosen role against an AI opponent that adapts to your strategy.
      </div>
    </div>
  );
}
