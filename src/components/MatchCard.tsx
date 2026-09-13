import { SPECIAL_CONDITION_LABELS, type Assignment, type GhostRequest, type Location } from '../types';

interface Props {
  request: GhostRequest;
  assignment: Assignment | undefined;
  locations: Location[];
  onManualAssign: (requestId: string, locationId: string | null) => void;
  onRemove: (requestId: string) => void;
}

export function MatchCard({ request, assignment, locations, onManualAssign, onRemove }: Props) {
  const assignedLocation = locations.find((l) => l.id === assignment?.locationId) ?? null;
  const isResettled = !!assignedLocation;
  const hasViolations = (assignment?.violations.length ?? 0) > 0;

  return (
    <li className={`match-card ${isResettled ? (hasViolations ? 'match-card--warning' : 'match-card--ok') : 'match-card--impossible'}`}>
      <div className="match-card__header">
        <div>
          <strong>{request.name}</strong>
          <span className="match-card__meta">
            {' '}
            · тревожность {request.anxietyLevel}/5 · любит {request.favoriteTemp}°C · дедлайн {request.deadline}
          </span>
        </div>
        <button type="button" className="link-button" onClick={() => onRemove(request.id)} aria-label={`Удалить заявку ${request.name}`}>
          удалить
        </button>
      </div>

      {request.specialConditions.length > 0 && (
        <div className="badges">
          {request.specialConditions.map((c) => (
            <span key={c} className="badge">
              {SPECIAL_CONDITION_LABELS[c]}
            </span>
          ))}
        </div>
      )}

      {isResettled ? (
        <p className="match-card__result">
          ✅ Переселено в «{assignedLocation!.name}»{assignment?.source === 'manual' ? ' (выбрано вручную)' : ''}.
          {assignment && assignment.reasons.length > 0 && <> Причина: {assignment.reasons.join('; ')}.</>}
        </p>
      ) : (
        <p className="match-card__result match-card__result--impossible">
          ❌ Переселение невозможно. {assignment && assignment.reasons.length > 0
            ? `Причины: ${assignment.reasons.join('; ')}.`
            : 'Нет доступных мест.'}
        </p>
      )}

      {hasViolations && (
        <p className="match-card__warning" role="alert">
          ⚠️ Внимание: ручной выбор нарушает условия — {assignment!.violations.join('; ')}.
        </p>
      )}

      <div className="match-card__override">
        <label>
          Переселить вручную в:{' '}
          <select
            value={assignment?.locationId ?? ''}
            onChange={(e) => onManualAssign(request.id, e.target.value || null)}
          >
            <option value="">— без места —</option>
            {locations.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.name}
              </option>
            ))}
          </select>
        </label>
      </div>
    </li>
  );
}
