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
    const report = buildReport(requests, [loc('l1')], assignments);
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
    const report = buildReport(requests, [loc('l1', 1)], assignments);
    expect(report.overloadedLocations).toEqual([
      { locationId: 'l1', name: 'l1', occupied: 2, capacity: 1 },
    ]);
    expect(report.problematicRequests[0].reason).toMatch(/нарушает условия/);
  });
});
