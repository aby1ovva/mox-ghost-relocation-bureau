import type { Assignment, GhostRequest, Location } from '../types';
import { countViableLocations, occupancyOf } from './matching';

export interface ProblematicRequest {
  requestId: string;
  name: string;
  reason: string;
}

export interface OverloadedLocation {
  locationId: string;
  name: string;
  occupied: number;
  capacity: number;
}

export interface Report {
  totalRequests: number;
  resettledCount: number;
  unresettledCount: number;
  problematicRequests: ProblematicRequest[];
  overloadedLocations: OverloadedLocation[];
}

export function buildReport(
  requests: GhostRequest[],
  locations: Location[],
  assignments: Assignment[],
): Report {
  const assignmentByRequest = new Map(assignments.map((a) => [a.requestId, a]));

  let resettledCount = 0;
  const problematicRequests: ProblematicRequest[] = [];

  for (const request of requests) {
    const assignment = assignmentByRequest.get(request.id);
    if (assignment && assignment.locationId) {
      resettledCount += 1;
      if (assignment.violations.length > 0) {
        problematicRequests.push({
          requestId: request.id,
          name: request.name,
          reason: `ручное размещение нарушает условия: ${assignment.violations.join('; ')}`,
        });
      } else {
        // Заявка расселена без нарушений — но если у неё нет запасного варианта,
        // это тоже проблемность отдельного рода: малейшее изменение (новая заявка,
        // занятое место) может выбить её из подбора. Текущее место всегда входит
        // в подсчёт (иначе заявка не была бы здесь без нарушений), так что
        // viable === 0 в этой ветке физически недостижимо — порог только <= 1.
        const viable = countViableLocations(request, locations, assignments, request.id);
        if (viable <= 1) {
          problematicRequests.push({
            requestId: request.id,
            name: request.name,
            reason: 'мало альтернатив: на момент подбора подходило только текущее место, запасного нет',
          });
        }
      }
    } else {
      problematicRequests.push({
        requestId: request.id,
        name: request.name,
        reason: 'не удалось найти место',
      });
    }
  }

  const overloadedLocations: OverloadedLocation[] = locations
    .map((location) => ({
      locationId: location.id,
      name: location.name,
      occupied: occupancyOf(location.id, assignments),
      capacity: location.capacity,
    }))
    .filter((l) => l.capacity > 0 && l.occupied >= l.capacity)
    .sort((a, b) => b.occupied / b.capacity - a.occupied / a.capacity);

  return {
    totalRequests: requests.length,
    resettledCount,
    unresettledCount: requests.length - resettledCount,
    problematicRequests,
    overloadedLocations,
  };
}
