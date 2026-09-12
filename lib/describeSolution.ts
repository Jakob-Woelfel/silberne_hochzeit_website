import type { Question } from '@/content/types';
import type { Solution } from '@/content/solutionTypes';

/**
 * Lösung als lesbaren Text. Reine Funktion – wird nur auf dem Server mit
 * echten Lösungswerten aufgerufen (Admin-Inhalte, Auflösungsseite ab 22 Uhr).
 */
export function describeSolution(solution: Solution, question?: Question): string {
  switch (solution.type) {
    case 'choice':
    case 'zoom':
      return solution.correct;
    case 'estimate': {
      const unit = question?.type === 'estimate' && question.unit ? ` ${question.unit}` : '';
      return `${solution.correct}${unit}`;
    }
    case 'text':
      return solution.accept.join(' oder ');
    case 'multi':
      return solution.correct.join(', ');
    case 'order':
      return solution.correct.map((s, i) => `${i + 1}. ${s}`).join('  ·  ');
    case 'age': {
      const people = question?.type === 'age' ? question.people : [];
      return solution.correct
        .map((age, i) => (people[i] ? `${people[i]}: ${age}` : String(age)))
        .join(' · ');
    }
  }
}
