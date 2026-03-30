interface TutorialProgressProps {
  currentStep: number;
  totalSteps: number;
  stepTitles: string[];
  onStepClick?: (step: number) => void;
}

export default function TutorialProgress({
  currentStep,
  totalSteps,
  stepTitles,
  onStepClick,
}: TutorialProgressProps) {
  return (
    <div className="tutorial-progress">
      {Array.from({ length: totalSteps }).map((_, i) => (
        <div key={i} className="tutorial-progress__step">
          {i > 0 && (
            <div
              className={`tutorial-progress__line${i <= currentStep ? " tutorial-progress__line--done" : ""}`}
            />
          )}
          <div
            className={[
              "tutorial-progress__dot",
              i === currentStep ? "tutorial-progress__dot--active" : "",
              i < currentStep ? "tutorial-progress__dot--done" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            onClick={() => onStepClick?.(i)}
            title={stepTitles[i]}
          >
            {i < currentStep ? "✓" : i + 1}
          </div>
          <div
            className={`tutorial-progress__label${i === currentStep ? " tutorial-progress__label--active" : ""}`}
          >
            {stepTitles[i]}
          </div>
        </div>
      ))}
    </div>
  );
}
