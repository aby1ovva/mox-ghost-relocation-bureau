import type { GhostRequest, Location } from '../types';

// Данные подобраны так, чтобы сразу демонстрировать все обязательные состояния:
// нормальный матч, невозможное переселение (дедлайн + конфликт условий),
// переполненное место, кандидата на ручной override.
export const seedRequests: GhostRequest[] = [
  {
    id: 'g1',
    name: 'Стеклянная Марта',
    anxietyLevel: 4,
    favoriteTemp: 8,
    deadline: '2026-12-01',
    specialConditions: ['needsSilence', 'noHumans'],
  },
  {
    id: 'g2',
    name: 'Кашляющий Дормидонт',
    anxietyLevel: 2,
    favoriteTemp: 18,
    deadline: '2026-11-15',
    specialConditions: ['lovesDamp'],
  },
  {
    id: 'g3',
    name: 'Барон фон Скрип',
    anxietyLevel: 3,
    favoriteTemp: 12,
    deadline: '2026-10-20',
    specialConditions: ['needsAttic', 'hatesBrightLight'],
  },
  {
    id: 'g4',
    name: 'Хихикающая Ирма',
    anxietyLevel: 1,
    favoriteTemp: 20,
    deadline: '2026-11-01',
    specialConditions: [],
  },
  {
    id: 'g5',
    name: 'Забытый Профессор',
    // просроченный дедлайн — гарантированно невозможное переселение
    anxietyLevel: 3,
    favoriteTemp: 14,
    deadline: '2026-01-10',
    specialConditions: ['needsAttic'],
  },
  {
    id: 'g6',
    name: 'Зеркальная Агата',
    // три спецусловия сразу (боится зеркал + нужна тишина + нужен чердак) — из
    // всех мест этим трём одновременно удовлетворяет только «Родовой замок»:
    // демонстрация того, что несколько жёстких ограничений комбинируются
    // (пересечение, а не "любое из"), а не что переселение невозможно
    anxietyLevel: 5,
    favoriteTemp: 9,
    deadline: '2026-12-20',
    specialConditions: ['fearsMirrors', 'needsSilence', 'needsAttic'],
  },
  {
    id: 'g7',
    name: 'Скрипучий Феликс',
    anxietyLevel: 2,
    favoriteTemp: 13,
    deadline: '2026-11-25',
    specialConditions: [],
  },
];

export const seedLocations: Location[] = [
  {
    id: 'l1',
    name: 'Старый маяк',
    capacity: 2,
    ambientTemp: 9,
    lighting: 'dim',
    noiseLevel: 'quiet',
    humidity: 'normal',
    hasHumans: false,
    hasMirrors: false,
    hasAttic: false,
  },
  {
    id: 'l2',
    name: 'Заброшенный театр',
    capacity: 1,
    ambientTemp: 12,
    lighting: 'dark',
    noiseLevel: 'moderate',
    humidity: 'normal',
    hasHumans: false,
    hasMirrors: true,
    hasAttic: true,
  },
  {
    id: 'l3',
    name: 'Подвал старой типографии',
    capacity: 2,
    ambientTemp: 17,
    lighting: 'dark',
    noiseLevel: 'loud',
    humidity: 'damp',
    hasHumans: false,
    hasMirrors: false,
    hasAttic: false,
  },
  {
    id: 'l4',
    name: 'Библиотека',
    capacity: 1,
    ambientTemp: 20,
    lighting: 'bright',
    noiseLevel: 'quiet',
    humidity: 'dry',
    hasHumans: true,
    hasMirrors: false,
    hasAttic: false,
  },
  {
    id: 'l5',
    name: 'Родовой замок',
    capacity: 1,
    ambientTemp: 11,
    lighting: 'dim',
    noiseLevel: 'quiet',
    humidity: 'normal',
    hasHumans: false,
    hasMirrors: false,
    hasAttic: true,
  },
];
