import { useId, useState, type FormEvent } from 'react';
import { ALL_SPECIAL_CONDITIONS, SPECIAL_CONDITION_LABELS, type GhostRequest, type SpecialCondition } from '../types';

interface Props {
  onSubmit: (request: GhostRequest) => void;
}

export function RequestForm({ onSubmit }: Props) {
  const formId = useId();
  const [name, setName] = useState('');
  const [anxietyLevel, setAnxietyLevel] = useState(3);
  const [favoriteTemp, setFavoriteTemp] = useState(10);
  const [deadline, setDeadline] = useState('');
  const [conditions, setConditions] = useState<SpecialCondition[]>([]);
  const [error, setError] = useState<string | null>(null);

  function toggleCondition(condition: SpecialCondition) {
    setConditions((prev) =>
      prev.includes(condition) ? prev.filter((c) => c !== condition) : [...prev, condition],
    );
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Укажите имя привидения.');
      return;
    }
    if (!deadline || Number.isNaN(new Date(deadline).getTime())) {
      setError('Укажите корректную дату дедлайна.');
      return;
    }
    if (!Number.isFinite(favoriteTemp) || favoriteTemp < -30 || favoriteTemp > 40) {
      setError('Температура должна быть числом от -30 до 40 °C.');
      return;
    }

    onSubmit({
      id: `g_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      name: trimmedName,
      anxietyLevel: anxietyLevel as 1 | 2 | 3 | 4 | 5,
      favoriteTemp,
      deadline,
      specialConditions: conditions,
    });

    setName('');
    setAnxietyLevel(3);
    setFavoriteTemp(10);
    setDeadline('');
    setConditions([]);
  }

  return (
    <form className="form" onSubmit={handleSubmit} aria-label="Новая заявка на переселение">
      <h3>Новая заявка</h3>
      {error && (
        <p className="form__error" role="alert">
          {error}
        </p>
      )}
      <div className="form__row">
        <label htmlFor={`${formId}-name`}>Имя привидения</label>
        <input id={`${formId}-name`} value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="form__row">
        <label htmlFor={`${formId}-anxiety`}>Уровень тревожности (1–5)</label>
        <input
          id={`${formId}-anxiety`}
          type="number"
          min={1}
          max={5}
          value={anxietyLevel}
          onChange={(e) => setAnxietyLevel(Number(e.target.value))}
        />
      </div>
      <div className="form__row">
        <label htmlFor={`${formId}-temp`}>Любимая температура, °C</label>
        <input
          id={`${formId}-temp`}
          type="number"
          value={favoriteTemp}
          onChange={(e) => setFavoriteTemp(Number(e.target.value))}
        />
      </div>
      <div className="form__row">
        <label htmlFor={`${formId}-deadline`}>Дедлайн переселения</label>
        <input
          id={`${formId}-deadline`}
          type="date"
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
        />
      </div>
      <fieldset className="form__row">
        <legend>Особые условия</legend>
        {ALL_SPECIAL_CONDITIONS.map((condition) => (
          <label key={condition} className="form__checkbox">
            <input
              type="checkbox"
              checked={conditions.includes(condition)}
              onChange={() => toggleCondition(condition)}
            />
            {SPECIAL_CONDITION_LABELS[condition]}
          </label>
        ))}
      </fieldset>
      <button type="submit">Добавить заявку</button>
    </form>
  );
}
