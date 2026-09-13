import { useId, useState, type FormEvent } from 'react';
import type { Humidity, Lighting, Location, NoiseLevel } from '../types';

interface Props {
  onSubmit: (location: Location) => void;
}

export function LocationForm({ onSubmit }: Props) {
  const formId = useId();
  const [name, setName] = useState('');
  const [capacity, setCapacity] = useState(1);
  const [ambientTemp, setAmbientTemp] = useState(10);
  const [lighting, setLighting] = useState<Lighting>('dim');
  const [noiseLevel, setNoiseLevel] = useState<NoiseLevel>('quiet');
  const [humidity, setHumidity] = useState<Humidity>('normal');
  const [hasHumans, setHasHumans] = useState(false);
  const [hasMirrors, setHasMirrors] = useState(false);
  const [hasAttic, setHasAttic] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Укажите название места.');
      return;
    }
    if (!Number.isInteger(capacity) || capacity < 0) {
      setError('Вместимость должна быть целым числом ≥ 0.');
      return;
    }

    onSubmit({
      id: `l_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      name: trimmedName,
      capacity,
      ambientTemp,
      lighting,
      noiseLevel,
      humidity,
      hasHumans,
      hasMirrors,
      hasAttic,
    });

    setName('');
    setCapacity(1);
    setAmbientTemp(10);
    setLighting('dim');
    setNoiseLevel('quiet');
    setHumidity('normal');
    setHasHumans(false);
    setHasMirrors(false);
    setHasAttic(false);
  }

  return (
    <form className="form" onSubmit={handleSubmit} aria-label="Новое место переселения">
      <h3>Новое место</h3>
      {error && (
        <p className="form__error" role="alert">
          {error}
        </p>
      )}
      <div className="form__row">
        <label htmlFor={`${formId}-name`}>Название</label>
        <input id={`${formId}-name`} value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="form__row">
        <label htmlFor={`${formId}-capacity`}>Вместимость</label>
        <input
          id={`${formId}-capacity`}
          type="number"
          min={0}
          value={capacity}
          onChange={(e) => setCapacity(Number(e.target.value))}
        />
      </div>
      <div className="form__row">
        <label htmlFor={`${formId}-temp`}>Температура, °C</label>
        <input
          id={`${formId}-temp`}
          type="number"
          value={ambientTemp}
          onChange={(e) => setAmbientTemp(Number(e.target.value))}
        />
      </div>
      <div className="form__row">
        <label htmlFor={`${formId}-lighting`}>Освещение</label>
        <select id={`${formId}-lighting`} value={lighting} onChange={(e) => setLighting(e.target.value as Lighting)}>
          <option value="dark">Тёмное</option>
          <option value="dim">Приглушённое</option>
          <option value="bright">Яркое</option>
        </select>
      </div>
      <div className="form__row">
        <label htmlFor={`${formId}-noise`}>Уровень шума</label>
        <select id={`${formId}-noise`} value={noiseLevel} onChange={(e) => setNoiseLevel(e.target.value as NoiseLevel)}>
          <option value="quiet">Тихо</option>
          <option value="moderate">Средне</option>
          <option value="loud">Шумно</option>
        </select>
      </div>
      <div className="form__row">
        <label htmlFor={`${formId}-humidity`}>Влажность</label>
        <select id={`${formId}-humidity`} value={humidity} onChange={(e) => setHumidity(e.target.value as Humidity)}>
          <option value="dry">Сухо</option>
          <option value="normal">Нормально</option>
          <option value="damp">Сыро</option>
        </select>
      </div>
      <label className="form__checkbox">
        <input type="checkbox" checked={hasHumans} onChange={(e) => setHasHumans(e.target.checked)} />
        Есть люди
      </label>
      <label className="form__checkbox">
        <input type="checkbox" checked={hasMirrors} onChange={(e) => setHasMirrors(e.target.checked)} />
        Есть зеркала
      </label>
      <label className="form__checkbox">
        <input type="checkbox" checked={hasAttic} onChange={(e) => setHasAttic(e.target.checked)} />
        Есть чердак
      </label>
      <button type="submit">Добавить место</button>
    </form>
  );
}
