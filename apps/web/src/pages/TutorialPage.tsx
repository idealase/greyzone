import { lazy, Suspense, useState, useEffect, useCallback } from "react";
import TutorialProgress from "../components/tutorial/TutorialProgress";

const WelcomeStep = lazy(() => import("../components/tutorial/steps/WelcomeStep"));
const DomainsStep = lazy(() => import("../components/tutorial/steps/DomainsStep"));
const RolesStep = lazy(() => import("../components/tutorial/steps/RolesStep"));
const EscalationStep = lazy(() => import("../components/tutorial/steps/EscalationStep"));
const ActionsStep = lazy(() => import("../components/tutorial/steps/ActionsStep"));
const BoardStep = lazy(() => import("../components/tutorial/steps/BoardStep"));
const CouplingsStep = lazy(() => import("../components/tutorial/steps/CouplingsStep"));
const ReadyStep = lazy(() => import("../components/tutorial/steps/ReadyStep"));

const STEPS = [
  { title: "Welcome", subtitle: "What is Greyzone?" },
  { title: "Domains", subtitle: "The 8 battlespace domains" },
  { title: "Roles", subtitle: "Blue, Red, Observer" },
  { title: "Escalation", subtitle: "The Ψ system" },
  { title: "Actions", subtitle: "Taking your turn" },
  { title: "The Board", subtitle: "Reading the dashboard" },
  { title: "Couplings", subtitle: "Ripple effects" },
  { title: "Ready", subtitle: "Start playing" },
];

const STEP_TITLES = STEPS.map((s) => s.title);

function renderStep(step: number, onReplay: () => void) {
  switch (step) {
    case 0: return <WelcomeStep />;
    case 1: return <DomainsStep />;
    case 2: return <RolesStep />;
    case 3: return <EscalationStep />;
    case 4: return <ActionsStep />;
    case 5: return <BoardStep />;
    case 6: return <CouplingsStep />;
    case 7: return <ReadyStep onReplay={onReplay} />;
    default: return <WelcomeStep />;
  }
}

export default function TutorialPage() {
  const [currentStep, setCurrentStep] = useState(0);

  const goTo = useCallback((step: number) => {
    setCurrentStep(Math.max(0, Math.min(STEPS.length - 1, step)));
  }, []);

  const handleReplay = useCallback(() => {
    setCurrentStep(0);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight") goTo(currentStep + 1);
      if (e.key === "ArrowLeft") goTo(currentStep - 1);
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [currentStep, goTo]);

  // Scroll to top on step change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentStep]);

  const isLast = currentStep === STEPS.length - 1;

  return (
    <div className="tutorial-page">
      <title>Tutorial | GREYZONE</title>

      <TutorialProgress
        currentStep={currentStep}
        totalSteps={STEPS.length}
        stepTitles={STEP_TITLES}
        onStepClick={goTo}
      />

      <div key={currentStep} className="tutorial-step">
        <Suspense fallback={<div style={{ color: "var(--text-muted)" }}>Loading step…</div>}>
          {renderStep(currentStep, handleReplay)}
        </Suspense>
      </div>

      <div className="tutorial-nav">
        <button
          className="btn btn--secondary"
          onClick={() => goTo(currentStep - 1)}
          disabled={currentStep === 0}
          style={{ opacity: currentStep === 0 ? 0.4 : 1 }}
        >
          ← Back
        </button>

        <span className="tutorial-nav__counter">
          Step {currentStep + 1} of {STEPS.length} — {STEPS[currentStep]?.subtitle}
        </span>

        <button
          className="btn btn--primary"
          onClick={() => (isLast ? handleReplay() : goTo(currentStep + 1))}
        >
          {isLast ? "↩ Replay Tutorial" : "Next →"}
        </button>
      </div>
    </div>
  );
}
