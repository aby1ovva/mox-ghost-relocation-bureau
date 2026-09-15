import { describe, expect, it } from 'vitest';
import type { Assignment, GhostRequest, Location } from '../types';
import { countViableLocations, evaluateManualChoice, matchGhost, occupancyOf } from './matching';

const today = new Date('2026-09-13T00:00:00');

function makeRequest(overrides: Partial<GhostRequest> = {}): GhostRequest {
  return {
    id: 'r1',
    name: 'Стеклянная Марта',
    anxietyLevel: 3,
    favoriteTemp: 10,
    deadline: '2026-12-01',
    specialConditions: [],
    ...overrides,
  };
}

function makeLocation(overrides: Partial<Location> = {}): Location {
  return {
    id: 'l1',
    name: 'Старый маяк',
    capacity: 2,
    ambientTemp: 10,
    lighting: 'dim',
    noiseLevel: 'quiet',
    humidity: 'normal',
    hasHumans: false,
    hasMirrors: false,
    hasAttic: false,
    ...overrides,
  };
}

describe('matchGhost', () => {
  it('находит подходящее место при отсутствии конфликтов', () => {
    const request = makeRequest();
    const location = makeLocation();
    const result = matchGhost(request, [location], [], today);
    expect(result.status).toBe('matched');
    if (result.status === 'matched') {
      expect(result.locationId).toBe('l1');
      expect(result.reasons.length).toBeGreaterThan(0);
    }
  });

  it('признаёт заявку невозможной, если дедлайн уже прошёл', () => {
    const request = makeRequest({ deadline: '2026-01-01' });
    const location = makeLocation();
    const result = matchGhost(request, [location], [], today);
    expect(result.status).toBe('impossible');
    if (result.status === 'impossible') {
      expect(result.globalReason).toMatch(/дедлайн/);
    }
  });

  it('признаёт место недоступным, если оно переполнено', () => {
    const request = makeRequest();
    const location = makeLocation({ capacity: 1 });
    const assignments: Assignment[] = [
      { requestId: 'other', locationId: 'l1', source: 'auto', reasons: [], violations: [] },
    ];
    const result = matchGhost(request, [location], assignments, today);
    expect(result.status).toBe('impossible');
    if (result.status === 'impossible') {
      expect(result.reasonsByLocation.l1[0]).toMatch(/переполнено/);
    }
  });

  it('не считает заявку блокированной собственным текущим назначением при пересчёте', () => {
    const request = makeRequest();
    const location = makeLocation({ capacity: 1 });
    const assignments: Assignment[] = [
      { requestId: 'r1', locationId: 'l1', source: 'auto', reasons: [], violations: [] },
    ];
    const result = matchGhost(request, [location], assignments, today);
    expect(result.status).toBe('matched');
  });

  it('отклоняет место, конфликтующее со спецусловием needsAttic', () => {
    const request = makeRequest({ specialConditions: ['needsAttic'] });
    const location = makeLocation({ hasAttic: false });
    const result = matchGhost(request, [location], [], today);
    expect(result.status).toBe('impossible');
    if (result.status === 'impossible') {
      expect(result.reasonsByLocation.l1[0]).toMatch(/чердак/);
    }
  });

  it('отклоняет место с людьми для условия noHumans', () => {
    const request = makeRequest({ specialConditions: ['noHumans'] });
    const location = makeLocation({ hasHumans: true });
    const result = matchGhost(request, [location], [], today);
    expect(result.status).toBe('impossible');
  });

  it('выбирает место с наименьшей разницей температур среди нескольких вариантов', () => {
    const request = makeRequest({ favoriteTemp: 5 });
    const cold = makeLocation({ id: 'cold', ambientTemp: 5 });
    const hot = makeLocation({ id: 'hot', ambientTemp: 25 });
    const result = matchGhost(request, [hot, cold], [], today);
    expect(result.status).toBe('matched');
    if (result.status === 'matched') {
      expect(result.locationId).toBe('cold');
    }
  });

  it('даёт конкретную причину с числом градусов даже при большой разнице температур, без шаблонной фразы', () => {
    const request = makeRequest({ favoriteTemp: 30, anxietyLevel: 1 });
    const location = makeLocation({ ambientTemp: 10 });
    const result = matchGhost(request, [location], [], today);
    expect(result.status).toBe('matched');
    if (result.status === 'matched') {
      expect(result.reasons).toContain('разница по температуре 20°C — не идеально, но лучший вариант из доступных');
      expect(result.reasons).not.toContain('подходит по всем ключевым параметрам лучше остальных');
    }
  });
});

describe('evaluateManualChoice', () => {
  it('возвращает пустой список нарушений для корректного выбора', () => {
    const request = makeRequest();
    const location = makeLocation();
    const violations = evaluateManualChoice(request, location, [], today);
    expect(violations).toEqual([]);
  });

  it('сообщает о нарушении, если ручной выбор конфликтует со спецусловием', () => {
    const request = makeRequest({ specialConditions: ['noHumans'] });
    const location = makeLocation({ hasHumans: true });
    const violations = evaluateManualChoice(request, location, [], today);
    expect(violations.length).toBeGreaterThan(0);
    expect(violations[0]).toMatch(/людьми/);
  });

  it('сообщает о переполненности при ручном выборе', () => {
    const request = makeRequest();
    const location = makeLocation({ capacity: 1 });
    const assignments: Assignment[] = [
      { requestId: 'other', locationId: 'l1', source: 'auto', reasons: [], violations: [] },
    ];
    const violations = evaluateManualChoice(request, location, assignments, today);
    expect(violations.some((v) => v.includes('переполнено'))).toBe(true);
  });
});

describe('countViableLocations', () => {
  it('возвращает 0, если ни одно место не проходит жёсткие ограничения', () => {
    const request = makeRequest({ specialConditions: ['needsAttic'] });
    const locations = [makeLocation({ id: 'l1', hasAttic: false }), makeLocation({ id: 'l2', hasAttic: false })];
    expect(countViableLocations(request, locations, [])).toBe(0);
  });

  it('считает только места без нарушений, исключая текущее назначение заявки', () => {
    const request = makeRequest();
    const locations = [
      makeLocation({ id: 'l1', capacity: 1 }),
      makeLocation({ id: 'l2', capacity: 1 }),
      makeLocation({ id: 'l3', capacity: 1 }),
    ];
    const assignments: Assignment[] = [
      { requestId: 'r1', locationId: 'l1', source: 'auto', reasons: [], violations: [] },
      { requestId: 'other', locationId: 'l2', source: 'auto', reasons: [], violations: [] },
    ];
    // l1 — своё текущее место (исключается из подсчёта занятости), l2 — занято другим, l3 — свободно
    expect(countViableLocations(request, locations, assignments, 'r1')).toBe(2);
  });
});

describe('occupancyOf', () => {
  it('считает только назначения на конкретное место', () => {
    const assignments: Assignment[] = [
      { requestId: 'a', locationId: 'l1', source: 'auto', reasons: [], violations: [] },
      { requestId: 'b', locationId: 'l2', source: 'auto', reasons: [], violations: [] },
    ];
    expect(occupancyOf('l1', assignments)).toBe(1);
  });

  it('исключает переданный requestId (для пересчёта при реассайне)', () => {
    const assignments: Assignment[] = [
      { requestId: 'a', locationId: 'l1', source: 'auto', reasons: [], violations: [] },
    ];
    expect(occupancyOf('l1', assignments, 'a')).toBe(0);
  });
});
