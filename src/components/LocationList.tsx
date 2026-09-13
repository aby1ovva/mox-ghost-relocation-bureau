import { occupancyOf } from '../logic/matching';
import type { Assignment, Location } from '../types';

const LIGHTING_LABEL: Record<Location['lighting'], string> = {
  dark: 'тёмное',
  dim: 'приглушённое',
  bright: 'яркое',
};
const NOISE_LABEL: Record<Location['noiseLevel'], string> = {
  quiet: 'тихо',
  moderate: 'средне',
  loud: 'шумно',
};
const HUMIDITY_LABEL: Record<Location['humidity'], string> = {
  dry: 'сухо',
  normal: 'нормально',
  damp: 'сыро',
};

interface Props {
  locations: Location[];
  assignments: Assignment[];
  onRemove: (id: string) => void;
}

export function LocationList({ locations, assignments, onRemove }: Props) {
  if (locations.length === 0) {
    return <p className="empty-state">Мест переселения пока нет. Добавьте хотя бы одно ниже.</p>;
  }

  return (
    <ul className="location-list">
      {locations.map((loc) => {
        const occupied = occupancyOf(loc.id, assignments);
        const isFull = occupied >= loc.capacity;
        return (
          <li key={loc.id} className={isFull ? 'location-card location-card--full' : 'location-card'}>
            <div className="location-card__header">
              <strong>{loc.name}</strong>
              <span className={isFull ? 'occupancy occupancy--full' : 'occupancy'}>
                {occupied}/{loc.capacity}
              </span>
            </div>
            <p className="location-card__details">
              {loc.ambientTemp}°C · {LIGHTING_LABEL[loc.lighting]} · {NOISE_LABEL[loc.noiseLevel]} · {HUMIDITY_LABEL[loc.humidity]}
              {loc.hasHumans && ' · есть люди'}
              {loc.hasMirrors && ' · есть зеркала'}
              {loc.hasAttic && ' · есть чердак'}
            </p>
            <button type="button" className="link-button" onClick={() => onRemove(loc.id)}>
              удалить место
            </button>
          </li>
        );
      })}
    </ul>
  );
}
