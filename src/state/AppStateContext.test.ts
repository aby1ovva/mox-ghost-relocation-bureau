import { describe, expect, it } from 'vitest';
import type { GhostRequest, Location } from '../types';
import { reducer } from './AppStateContext';

// Регрессионный тест: до фикса ручной выбор "без места" навсегда выключал
// заявку из авто-подбора (флаг source:'manual' никогда не снимался), даже
// когда позже освобождалось идеально подходящее место. Найдено при внешнем
// аудите, см. AI Worklog.

function makeRequest(overrides: Partial<GhostRequest> = {}): GhostRequest {
  return {
    id: 'r1',
    name: 'Стеклянная Марта',
    anxietyLevel: 4,
    favoriteTemp: 9,
    deadline: '2027-01-01',
    specialConditions: [],
    ...overrides,
  };
}

function makeLocation(overrides: Partial<Location> = {}): Location {
  return {
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
    ...overrides,
  };
}

describe('REVERT_TO_AUTO', () => {
  it('возвращает заявку в авто-подбор после ручного выбора "без места"', () => {
    const state = {
      requests: [makeRequest()],
      locations: [makeLocation()],
      assignments: [{ requestId: 'r1', locationId: 'l1', source: 'auto' as const, reasons: [], violations: [] }],
      today: '2026-09-13',
    };

    // Оператор вручную снимает заявку с места ("— без места —").
    const afterManual = reducer(state, { type: 'MANUAL_ASSIGN', requestId: 'r1', locationId: null });
    const manualAssignment = afterManual.assignments.find((a) => a.requestId === 'r1');
    expect(manualAssignment?.source).toBe('manual');
    expect(manualAssignment?.locationId).toBeNull();

    // До фикса заявка оставалась бы в этом состоянии навсегда, даже при
    // свободном подходящем месте — REVERT_TO_AUTO должен вернуть её в авто-подбор.
    const afterRevert = reducer(afterManual, { type: 'REVERT_TO_AUTO', requestId: 'r1' });
    const revertedAssignment = afterRevert.assignments.find((a) => a.requestId === 'r1');
    expect(revertedAssignment?.source).toBe('auto');
    expect(revertedAssignment?.locationId).toBe('l1');
  });

  it('не ломает состояние, если для заявки нет подходящего места после отмены', () => {
    const state = {
      requests: [makeRequest({ specialConditions: ['needsAttic'] })],
      locations: [makeLocation({ hasAttic: false })],
      assignments: [{ requestId: 'r1', locationId: null, source: 'manual' as const, reasons: [], violations: [] }],
      today: '2026-09-13',
    };

    const afterRevert = reducer(state, { type: 'REVERT_TO_AUTO', requestId: 'r1' });
    const assignment = afterRevert.assignments.find((a) => a.requestId === 'r1');
    expect(assignment?.source).toBe('auto');
    expect(assignment?.locationId).toBeNull();
  });
});
