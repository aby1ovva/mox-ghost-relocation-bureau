import { createContext, useContext, useEffect, useMemo, useReducer, type ReactNode } from 'react';
import { seedLocations, seedRequests } from '../data/seed';
import { evaluateManualChoice, matchGhost } from '../logic/matching';
import type { Assignment, GhostRequest, Location } from '../types';

interface AppState {
  requests: GhostRequest[];
  locations: Location[];
  assignments: Assignment[];
  /** "сегодняшняя" дата симуляции, зафиксирована при загрузке, но переопределяема в UI для демо */
  today: string;
}

type Action =
  | { type: 'RECOMPUTE' }
  | { type: 'ADD_REQUEST'; request: GhostRequest }
  | { type: 'REMOVE_REQUEST'; id: string }
  | { type: 'ADD_LOCATION'; location: Location }
  | { type: 'REMOVE_LOCATION'; id: string }
  | { type: 'MANUAL_ASSIGN'; requestId: string; locationId: string | null }
  | { type: 'SET_TODAY'; today: string }
  | { type: 'RESET_TO_SEED' }
  | { type: 'CLEAR_ALL' }
  | { type: 'LOAD'; state: AppState };

const STORAGE_KEY = 'mox-ghost-bureau-state-v1';

function recomputeAutoAssignments(state: AppState): Assignment[] {
  const today = new Date(state.today);
  const manualByRequest = new Map(
    state.assignments.filter((a) => a.source === 'manual').map((a) => [a.requestId, a]),
  );

  // Важно: сначала кладём в nextAssignments ВСЕ ручные назначения (не только те, что
  // встретились раньше по порядку заявок). Иначе авто-подбор для заявки #1 не увидит
  // занятость места, которое было вручную назначено заявке #5, и капасити-проверка
  // (hardViolations) даст ложноотрицательный результат — это реальный баг, который
  // всплыл при ревью логики пересчёта, см. AI Worklog.
  const nextAssignments: Assignment[] = [...manualByRequest.values()];

  for (const request of state.requests) {
    if (manualByRequest.has(request.id)) continue;
    const result = matchGhost(request, state.locations, nextAssignments, today);
    if (result.status === 'matched') {
      nextAssignments.push({
        requestId: request.id,
        locationId: result.locationId,
        source: 'auto',
        reasons: result.reasons,
        violations: [],
      });
    } else {
      nextAssignments.push({
        requestId: request.id,
        locationId: null,
        source: 'auto',
        reasons: result.globalReason
          ? [result.globalReason]
          : Object.entries(result.reasonsByLocation).flatMap(([, reasons]) => reasons),
        violations: [],
      });
    }
  }
  return nextAssignments;
}

function initialState(): AppState {
  const base: AppState = {
    requests: seedRequests,
    locations: seedLocations,
    assignments: [],
    today: new Date().toISOString().slice(0, 10),
  };
  return { ...base, assignments: recomputeAutoAssignments(base) };
}

function loadPersisted(): AppState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AppState;
    if (!parsed || !Array.isArray(parsed.requests) || !Array.isArray(parsed.locations)) return null;
    return parsed;
  } catch {
    // повреждённые данные в localStorage — просто игнорируем и стартуем заново
    return null;
  }
}

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'RECOMPUTE':
      return { ...state, assignments: recomputeAutoAssignments(state) };
    case 'ADD_REQUEST': {
      const next = { ...state, requests: [...state.requests, action.request] };
      return { ...next, assignments: recomputeAutoAssignments(next) };
    }
    case 'REMOVE_REQUEST': {
      const next = {
        ...state,
        requests: state.requests.filter((r) => r.id !== action.id),
        assignments: state.assignments.filter((a) => a.requestId !== action.id),
      };
      return { ...next, assignments: recomputeAutoAssignments(next) };
    }
    case 'ADD_LOCATION': {
      const next = { ...state, locations: [...state.locations, action.location] };
      return { ...next, assignments: recomputeAutoAssignments(next) };
    }
    case 'REMOVE_LOCATION': {
      const withoutLocation = {
        ...state,
        locations: state.locations.filter((l) => l.id !== action.id),
        assignments: state.assignments.map((a) =>
          a.locationId === action.id ? { ...a, locationId: null, source: 'auto' as const } : a,
        ),
      };
      return { ...withoutLocation, assignments: recomputeAutoAssignments(withoutLocation) };
    }
    case 'MANUAL_ASSIGN': {
      const request = state.requests.find((r) => r.id === action.requestId);
      if (!request) return state;
      const otherAssignments = state.assignments.filter((a) => a.requestId !== action.requestId);
      let newAssignment: Assignment;
      if (action.locationId === null) {
        newAssignment = { requestId: action.requestId, locationId: null, source: 'manual', reasons: [], violations: [] };
      } else {
        const location = state.locations.find((l) => l.id === action.locationId);
        const violations = location
          ? evaluateManualChoice(request, location, otherAssignments, new Date(state.today))
          : ['выбранное место не найдено'];
        newAssignment = {
          requestId: action.requestId,
          locationId: action.locationId,
          source: 'manual',
          reasons: ['выбрано вручную оператором'],
          violations,
        };
      }
      const next = { ...state, assignments: [...otherAssignments, newAssignment] };
      // ручные назначения зафиксированы; пересчитываем только оставшиеся auto-заявки
      return { ...next, assignments: recomputeAutoAssignments(next) };
    }
    case 'SET_TODAY': {
      const next = { ...state, today: action.today };
      return { ...next, assignments: recomputeAutoAssignments(next) };
    }
    case 'RESET_TO_SEED':
      return initialState();
    case 'CLEAR_ALL': {
      const next: AppState = { requests: [], locations: [], assignments: [], today: state.today };
      return next;
    }
    case 'LOAD':
      return action.state;
    default:
      return state;
  }
}

interface AppStateContextValue {
  state: AppState;
  dispatch: React.Dispatch<Action>;
}

const AppStateContext = createContext<AppStateContextValue | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, () => loadPersisted() ?? initialState());

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // localStorage может быть недоступен (приватный режим и т.п.) — не критично для работы приложения
    }
  }, [state]);

  const value = useMemo(() => ({ state, dispatch }), [state]);
  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState(): AppStateContextValue {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error('useAppState должен использоваться внутри AppStateProvider');
  return ctx;
}
