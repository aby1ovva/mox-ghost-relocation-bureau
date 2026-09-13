export type SpecialCondition =
  | 'needsAttic'
  | 'fearsMirrors'
  | 'noHumans'
  | 'lovesDamp'
  | 'needsSilence'
  | 'hatesBrightLight';

export const SPECIAL_CONDITION_LABELS: Record<SpecialCondition, string> = {
  needsAttic: 'Нужен чердак',
  fearsMirrors: 'Боится зеркал',
  noHumans: 'Нельзя селить рядом с людьми',
  lovesDamp: 'Любит сырость',
  needsSilence: 'Нужна тишина',
  hatesBrightLight: 'Не переносит яркий свет',
};

export const ALL_SPECIAL_CONDITIONS: SpecialCondition[] = [
  'needsAttic',
  'fearsMirrors',
  'noHumans',
  'lovesDamp',
  'needsSilence',
  'hatesBrightLight',
];

export interface GhostRequest {
  id: string;
  name: string;
  /** 1 — спокойный призрак, 5 — очень тревожный */
  anxietyLevel: 1 | 2 | 3 | 4 | 5;
  /** Желаемая температура, °C */
  favoriteTemp: number;
  /** ISO-дата дедлайна переселения */
  deadline: string;
  specialConditions: SpecialCondition[];
}

export type Lighting = 'dark' | 'dim' | 'bright';
export type NoiseLevel = 'quiet' | 'moderate' | 'loud';
export type Humidity = 'dry' | 'normal' | 'damp';

export interface Location {
  id: string;
  name: string;
  capacity: number;
  ambientTemp: number;
  lighting: Lighting;
  noiseLevel: NoiseLevel;
  humidity: Humidity;
  hasHumans: boolean;
  hasMirrors: boolean;
  hasAttic: boolean;
}

export type AssignmentSource = 'auto' | 'manual';

export interface Assignment {
  requestId: string;
  /** null = призрак остался без места */
  locationId: string | null;
  source: AssignmentSource;
  /** причины (для matched) или нарушения (для manual override с конфликтом) */
  reasons: string[];
  /** нарушения жёстких ограничений, если ручной выбор конфликтует с условиями */
  violations: string[];
}
