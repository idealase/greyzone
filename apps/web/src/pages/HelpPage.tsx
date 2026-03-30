import { Link } from "react-router-dom";

const DOCS_BASE = "https://github.com/idealase/greyzone/blob/main/docs";

export default function HelpPage() {
  return (
    <div>
      <div className="page-header">
        <h1 className="page-header__title">Help & Documentation</h1>
        <p className="page-header__subtitle">
          Quick explanations of Greyzone mechanics, with links to the tutorial and specs.
        </p>
      </div>

      <div className="help-grid">
        <div className="help-card">
          <h3>Quick Links</h3>
          <ul className="help-list">
            <li>
              <Link to="/tutorial">Interactive Tutorial</Link>
            </li>
            <li>
              <a href={`${DOCS_BASE}/simulation-spec.md`} target="_blank" rel="noreferrer">
                Simulation Guide (docs/simulation-spec.md)
              </a>
            </li>
            <li>
              <a href={`${DOCS_BASE}/product-spec.md`} target="_blank" rel="noreferrer">
                Product Spec (docs/product-spec.md)
              </a>
            </li>
            <li>
              <a href={`${DOCS_BASE}/api-spec.md`} target="_blank" rel="noreferrer">
                API Spec (docs/api-spec.md)
              </a>
            </li>
          </ul>
        </div>

        <div className="help-card">
          <h3>Simulation Concepts</h3>
          <ul className="help-list">
            <li>
              Order Parameter (Ψ): measures system coherence; phase shifts occur as Ψ rises.
            </li>
            <li>
              Phases 0-5: escalation ladder from Competitive Normality → Generalized / Bloc War.
            </li>
            <li>
              Domain stress vs. resilience: resilience dampens spillover and stress spikes.
            </li>
            <li>
              Coupling: some actions bleed into other domains and can accelerate escalation.
            </li>
          </ul>
        </div>

        <div className="help-card">
          <h3>Keyboard Shortcuts</h3>
          <p style={{ color: "var(--text-secondary)", marginBottom: "0.4rem" }}>
            Press <span className="shortcut-key">?</span> anywhere in the simulation to open the full cheat sheet.
          </p>
          <ul className="help-list">
            <li>
              <span className="shortcut-key">?</span> — open shortcuts
            </li>
            <li>
              <span className="shortcut-key">Esc</span> — close dialogs/overlays
            </li>
            <li>
              <span className="shortcut-key">↑ ↓</span> — navigate tutorial steps
            </li>
            <li>
              <span className="shortcut-key">Tab</span> — move focus between controls
            </li>
          </ul>
        </div>

        <div className="help-card">
          <h3>Feedback & Support</h3>
          <ul className="help-list">
            <li>
              <a
                href="https://github.com/idealase/greyzone/issues/new/choose"
                target="_blank"
                rel="noreferrer"
              >
                Report an issue on GitHub
              </a>
            </li>
            <li>
              <a
                href={`${DOCS_BASE}/product-spec.md#feedback`}
                target="_blank"
                rel="noreferrer"
              >
                Review feedback guidelines
              </a>
            </li>
            <li>
              Prefer email? Contact the facilitators listed in the scenario brief.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
