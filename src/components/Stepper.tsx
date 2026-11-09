import { Link } from 'react-router';
import { STEPS, type StepPath } from '../steps';

type State = 'complete' | 'current' | 'not-started';
const SR_LABEL: Record<State, string> = { complete: 'completed', current: 'current', 'not-started': 'not started' };

/**
 * Connected circles: completed steps filled green with a check, the current step white with a green outline,
 * steps not started light grey. Every step is a link; screen readers hear each step's state.
 * Until campaign progress is tracked, steps before the current one count as completed (as in the designs).
 */
export function Stepper({ campaignId, current }: { campaignId: string; current: StepPath }) {
  const currentIndex = STEPS.findIndex((s) => s.path === current);
  return (
    <ol aria-label="Campaign steps" className="stepper">
      {STEPS.map((step, i) => {
        const state: State = i < currentIndex ? 'complete' : i === currentIndex ? 'current' : 'not-started';
        const isLast = i === STEPS.length - 1;
        return (
          <li key={step.path}>
            {!isLast && (
              <span aria-hidden="true" className={`stepper__line${i < currentIndex ? ' stepper__line--done' : ''}`} />
            )}
            <Link
              to={`/campaigns/${campaignId}/${step.path}`}
              className={`is-${state}`}
              aria-current={state === 'current' ? 'step' : undefined}
            >
              <span className="stepper__dot" aria-hidden="true">
                {state === 'complete' ? '✓' : i + 1}
              </span>
              <span>
                {step.label}
                <span className="sr-only">, {SR_LABEL[state]}</span>
              </span>
            </Link>
          </li>
        );
      })}
    </ol>
  );
}
