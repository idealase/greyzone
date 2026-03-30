export default function WelcomeStep() {
  return (
    <div className="tutorial-step">
      <div className="tutorial-welcome__hero">
        <h1 className="tutorial-step__title" style={{ fontSize: "2.25rem", letterSpacing: "0.08em" }}>
          WELCOME TO GREYZONE
        </h1>
        <p className="tutorial-welcome__tagline">A Distributed Battlespace Simulation</p>
      </div>

      <div className="tutorial-welcome__scenario">
        <p style={{ color: "var(--text-secondary)", lineHeight: 1.7, marginBottom: "1rem" }}>
          The Baltic Flashpoint. NATO's eastern flank is under pressure. A web of hybrid threats —
          cyber intrusions, energy blackmail, disinformation, and proxy forces — is testing the
          alliance's cohesion. You stand at the threshold: one wrong move could tip a cold competition
          into open war. Every domain is contested. Every decision has second- and third-order effects.
          The world is watching.
        </p>

        <p style={{ color: "var(--text-secondary)", lineHeight: 1.7 }}>
          In Greyzone, you command one side of a multi-domain conflict spanning military, economic,
          cyber, space, and information domains. Your choices ripple across the entire battlespace.
          Escalation is a one-way ratchet — once crossed, thresholds cannot be undone.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
        <div>
          <h3 style={{ color: "var(--text-primary)", marginBottom: "0.75rem", fontSize: "0.9rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            What You'll Learn
          </h3>
          <ul className="tutorial-welcome__checklist">
            <li>The 8 interconnected domains</li>
            <li>Roles &amp; factions</li>
            <li>Phase escalation (Ψ)</li>
            <li>Taking &amp; tuning actions</li>
            <li>Reading the simulation board</li>
            <li>Cross-domain ripple effects</li>
            <li>Victory conditions &amp; objectives</li>
          </ul>
        </div>

        <div>
          <h3 style={{ color: "var(--text-primary)", marginBottom: "0.75rem", fontSize: "0.9rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Scenario Snapshot
          </h3>
          <div className="tutorial-welcome__stats">
            <div className="tutorial-stat">
              <div className="tutorial-stat__value">2</div>
              <div className="tutorial-stat__label">Human Roles</div>
            </div>
            <div className="tutorial-stat">
              <div className="tutorial-stat__value">8</div>
              <div className="tutorial-stat__label">Domains</div>
            </div>
            <div className="tutorial-stat">
              <div className="tutorial-stat__value">6</div>
              <div className="tutorial-stat__label">Phases</div>
            </div>
            <div className="tutorial-stat">
              <div className="tutorial-stat__value">50</div>
              <div className="tutorial-stat__label">Max Turns</div>
            </div>
            <div className="tutorial-stat">
              <div className="tutorial-stat__value">5</div>
              <div className="tutorial-stat__label">Actors</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
