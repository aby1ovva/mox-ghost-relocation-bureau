import type { Assignment, GhostRequest, Location } from '../types';

export interface MatchedResult {
  status: 'matched';
  locationId: string;
  reasons: string[];
  score: number;
}

export interface ImpossibleResult {
  status: 'impossible';
  reasonsByLocation: Record<string, string[]>;
  /** заполняется, если причина общая для всех мест (например, дедлайн просрочен) */
  globalReason?: string;
}

export type MatchResult = MatchedResult | ImpossibleResult;

/** Сколько призраков уже занимают место, не считая переданный requestId (для реассайна). */
export function occupancyOf(
  locationId: string,
  assignments: Assignment[],
  excludeRequestId?: string,
): number {
  return assignments.filter(
    (a) => a.locationId === locationId && a.requestId !== excludeRequestId,
  ).length;
}

export function isDeadlinePassed(deadline: string, today: Date): boolean {
  const d = new Date(deadline);
  // сравниваем по дате, без времени суток
  const dOnly = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const tOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return dOnly.getTime() < tOnly.getTime();
}

/**
 * Жёсткие ограничения: если хотя бы одно нарушено, место не подходит вовсе.
 * Возвращает список нарушений (человекочитаемых), пустой массив = ограничений нет.
 */
export function hardViolations(
  request: GhostRequest,
  location: Location,
  assignments: Assignment[],
  excludeRequestId?: string,
): string[] {
  const violations: string[] = [];
  const occupied = occupancyOf(location.id, assignments, excludeRequestId);
  if (occupied >= location.capacity) {
    violations.push(`«${location.name}» переполнено (${occupied}/${location.capacity})`);
  }
  if (request.specialConditions.includes('needsAttic') && !location.hasAttic) {
    violations.push(`нужен чердак, а в «${location.name}» его нет`);
  }
  if (request.specialConditions.includes('fearsMirrors') && location.hasMirrors) {
    violations.push(`боится зеркал, а в «${location.name}» есть зеркала`);
  }
  if (request.specialConditions.includes('noHumans') && location.hasHumans) {
    violations.push(`нельзя селить рядом с людьми, а в «${location.name}» есть люди`);
  }
  return violations;
}

/** Мягкий скоринг: чем меньше, тем лучше подходит место. */
export function softScore(request: GhostRequest, location: Location): { score: number; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];

  const tempDiff = Math.abs(request.favoriteTemp - location.ambientTemp);
  score += tempDiff;
  if (tempDiff <= 2) {
    reasons.push('температура почти идеально совпадает');
  } else if (tempDiff <= 5) {
    reasons.push('температура подходит приемлемо');
  }

  if (request.specialConditions.includes('lovesDamp')) {
    if (location.humidity === 'damp') {
      reasons.push('любит сырость — здесь сыро');
    } else {
      score += 4;
    }
  }

  if (request.specialConditions.includes('needsSilence')) {
    if (location.noiseLevel === 'quiet') {
      reasons.push('нужна тишина — здесь тихо');
    } else if (location.noiseLevel === 'moderate') {
      score += 3 * (request.anxietyLevel / 5);
    } else {
      score += 8 * (request.anxietyLevel / 5);
    }
  } else {
    // даже без явного условия высокая тревожность не любит шум
    if (location.noiseLevel === 'loud') score += 2 * (request.anxietyLevel / 5);
  }

  if (request.specialConditions.includes('hatesBrightLight')) {
    if (location.lighting !== 'bright') {
      reasons.push('не любит яркий свет — здесь не ярко');
    } else {
      score += 4;
    }
  }

  // высокая тревожность + наличие людей = штраф, даже без noHumans
  if (location.hasHumans) {
    score += 1.5 * (request.anxietyLevel / 5);
  } else if (request.anxietyLevel >= 4) {
    reasons.push('спокойное место без людей — то, что нужно тревожному призраку');
  }

  return { score, reasons };
}

export function matchGhost(
  request: GhostRequest,
  locations: Location[],
  assignments: Assignment[],
  today: Date = new Date(),
): MatchResult {
  if (isDeadlinePassed(request.deadline, today)) {
    return {
      status: 'impossible',
      reasonsByLocation: {},
      globalReason: `дедлайн переселения (${request.deadline}) уже прошёл`,
    };
  }

  const reasonsByLocation: Record<string, string[]> = {};
  const candidates: { location: Location; score: number; reasons: string[] }[] = [];

  for (const location of locations) {
    const violations = hardViolations(request, location, assignments, request.id);
    if (violations.length > 0) {
      reasonsByLocation[location.id] = violations;
      continue;
    }
    const { score, reasons } = softScore(request, location);
    candidates.push({ location, score, reasons });
  }

  if (candidates.length === 0) {
    return { status: 'impossible', reasonsByLocation };
  }

  candidates.sort((a, b) => a.score - b.score);
  const best = candidates[0];
  return {
    status: 'matched',
    locationId: best.location.id,
    reasons: best.reasons.length > 0 ? best.reasons : ['подходит по всем ключевым параметрам лучше остальных'],
    score: best.score,
  };
}

/**
 * Проверка ручного выбора места пользователем. Не блокирует выбор, а возвращает
 * список нарушений жёстких ограничений — приложение должно предупредить о них.
 */
export function evaluateManualChoice(
  request: GhostRequest,
  location: Location,
  assignments: Assignment[],
  today: Date = new Date(),
): string[] {
  const violations: string[] = [];
  if (isDeadlinePassed(request.deadline, today)) {
    violations.push(`дедлайн переселения (${request.deadline}) уже прошёл`);
  }
  violations.push(...hardViolations(request, location, assignments, request.id));
  return violations;
}
