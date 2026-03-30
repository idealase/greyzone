import { useNavigate } from "react-router-dom";

interface ReadyStepProps {
  onReplay: () => void;
}

const CHEATSHEET = [
  "Watch Ψ — keep it below 0.50 as Blue Commander; push it above 0.70 as Red Commander.",
  "Every action has resource costs and cross-domain ripple effects — think two moves ahead.",
  "Phases are irreversible. Escalation cannot be undone once a threshold is crossed for 3 turns.",
  "Information advantage degrades your opponent's intelligence quality. Protect your Info domain.",
  "Fiscal reserves and political will are your ultimate constraints — when they collapse, the game ends.",
];

const CTA_CARDS = [
  {
    icon: "⚡",
    title: "Quick Start vs AI",
    desc: "Jump straight into a solo game against an AI opponent.",
    path: "/runs/new?mode=quickstart",
  },
  {
    icon: "🌐",
    title: "Browse Scenarios",
    desc: "Choose from pre-built Baltic Flashpoint scenarios with custom starting conditions.",
    path: "/scenarios",
  },
  {
    icon: "👥",
    title: "Create Multiplayer Run",
    desc: "Set up a full multiplayer session with human commanders on both sides.",
    path: "/runs/new",
  },
];

export default function ReadyStep({ onReplay }: ReadyStepProps) {
  const navigate = useNavigate();

  return (
    <div className="tutorial-step">
      <div className="tutorial-step__header" style={{ textAlign: "center" }}>
        <h2 className="tutorial-step__title" style={{ fontSize: "2rem" }}>
          🎖 You're Ready to Play
        </h2>
        <p className="tutorial-step__subtitle">
          You've completed the Greyzone tutorial. Here's your mission briefing.
        </p>
      </div>

      <div className="tutorial-cheatsheet">
        <div className="tutorial-cheatsheet__title">📋 Commander's Cheat Sheet</div>
        <ul className="tutorial-cheatsheet__items">
          {CHEATSHEET.map((item, i) => (
            <li key={i} className="tutorial-cheatsheet__item">
              {item}
            </li>
          ))}
        </ul>
      </div>

      <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.75rem" }}>
        Choose Your Next Step
      </div>

      <div className="tutorial-cta-grid">
        {CTA_CARDS.map((card) => (
          <div
            key={card.path}
            className="tutorial-cta-card"
            onClick={() => navigate(card.path)}
          >
            <div className="tutorial-cta-card__icon">{card.icon}</div>
            <div className="tutorial-cta-card__title">{card.title}</div>
            <div className="tutorial-cta-card__desc">{card.desc}</div>
          </div>
        ))}
      </div>

      <div className="tutorial-replay-link" onClick={onReplay}>
        ↩ Replay Tutorial from the beginning
      </div>
    </div>
  );
}
