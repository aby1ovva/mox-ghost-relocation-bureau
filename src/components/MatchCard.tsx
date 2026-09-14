import { SPECIAL_CONDITION_LABELS, type Assignment, type GhostRequest, type Location } from '../types';

/** Спецзначение в select для пункта «Вернуть авто-решение» — не может совпасть с id места. */
const REVERT_TO_AUTO_VALUE = '__auto__';

interface Props {
  request: GhostRequest;
  assignment: Assignment | undefined;
  locations: Location[];
  onManualAssign: (requestId: string, locationId: string | null) => void;
  onRevertToAuto: (requestId: string) => void;
  onRemove: (requestId: string) => void;
}

export function MatchCard({ request, assignment, locations, onManualAssign, onRevertToAuto, onRemove }: Props) {
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
            onChange={(e) => {
              const value = e.target.value;
              if (value === REVERT_TO_AUTO_VALUE) {
                onRevertToAuto(request.id);
              } else {
                onManualAssign(request.id, value || null);
              }
            }}
          >
            <option value="">— без места —</option>
            {assignment?.source === 'manual' && (
              <option value={REVERT_TO_AUTO_VALUE}>↺ Вернуть авто-решение</option>
            )}
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
