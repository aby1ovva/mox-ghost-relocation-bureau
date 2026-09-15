import { describe, expect, it } from 'vitest';
import type { Assignment, GhostRequest, Location } from '../types';
import { buildReport } from './report';

function req(id: string, name = id): GhostRequest {
  return {
    id,
    name,
    anxietyLevel: 2,
    favoriteTemp: 10,
    deadline: '2027-01-01',
    specialConditions: [],
  };
}

function loc(id: string, capacity = 2): Location {
  return {
    id,
    name: id,
    capacity,
    ambientTemp: 10,
    lighting: 'dim',
    noiseLevel: 'quiet',
    humidity: 'normal',
    hasHumans: false,
    hasMirrors: false,
    hasAttic: false,
  };
}

describe('buildReport', () => {
  it('возвращает нулевой отчёт для пустого списка заявок', () => {
    const report = buildReport([], [], []);
    expect(report.totalRequests).toBe(0);
    expect(report.resettledCount).toBe(0);
    expect(report.unresettledCount).toBe(0);
    expect(report.problematicRequests).toEqual([]);
    expect(report.overloadedLocations).toEqual([]);
  });

  it('считает расселённых и нерасселённых призраков', () => {
    const requests = [req('a'), req('b')];
    const assignments: Assignment[] = [
      { requestId: 'a', locationId: 'l1', source: 'auto', reasons: [], violations: [] },
    ];
    // Два свободных места без спецусловий у заявки — 'a' не должна попасть в
    // "мало альтернатив", тест здесь проверяет только счётчики resettled/unresettled.
    const report = buildReport(requests, [loc('l1'), loc('l2')], assignments);
    expect(report.resettledCount).toBe(1);
    expect(report.unresettledCount).toBe(1);
    expect(report.problematicRequests).toEqual([
      { requestId: 'b', name: 'b', reason: 'не удалось найти место' },
    ]);
  });

  it('помечает перегруженные места', () => {
    const requests = [req('a'), req('b')];
    const assignments: Assignment[] = [
      { requestId: 'a', locationId: 'l1', source: 'auto', reasons: [], violations: [] },
      { requestId: 'b', locationId: 'l1', source: 'manual', reasons: [], violations: ['переполнено'] },
    ];
    // l2 и l3 — два свободных запасных варианта для 'a', чтобы у неё было >1
    // альтернативы и тест проверял только перегрузку l1, не пересекаясь с
    // отдельным тестом на "мало альтернатив".
    const report = buildReport(requests, [loc('l1', 1), loc('l2', 2), loc('l3', 2)], assignments);
    expect(report.overloadedLocations).toEqual([
      { locationId: 'l1', name: 'l1', occupied: 2, capacity: 1 },
    ]);
    expect(report.problematicRequests).toEqual([
      { requestId: 'b', name: 'b', reason: expect.stringMatching(/нарушает условия/) },
    ]);
  });

  it('помечает проблемной заявку без нарушений, но с единственным подходящим местом', () => {
    const requests = [req('a')];
    // Только l1 подходит по вместимости (1), l2 уже занято другой заявкой — запасного варианта нет.
    const assignments: Assignment[] = [
      { requestId: 'a', locationId: 'l1', source: 'auto', reasons: [], violations: [] },
      { requestId: 'other', locationId: 'l2', source: 'auto', reasons: [], violations: [] },
    ];
    const report = buildReport(requests, [loc('l1', 1), loc('l2', 1)], assignments);
    expect(report.problematicRequests).toEqual([
      { requestId: 'a', name: 'a', reason: expect.stringMatching(/мало альтернатив/) },
    ]);
  });

  it('не помечает проблемной заявку, у которой есть запасные подходящие места', () => {
    const requests = [req('a')];
    const assignments: Assignment[] = [
      { requestId: 'a', locationId: 'l1', source: 'auto', reasons: [], violations: [] },
    ];
    const report = buildReport(requests, [loc('l1', 2), loc('l2', 2)], assignments);
    expect(report.problematicRequests).toEqual([]);
  });
});
