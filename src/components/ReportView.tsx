import { buildReport } from '../logic/report';
import type { Assignment, GhostRequest, Location } from '../types';

interface Props {
  requests: GhostRequest[];
  locations: Location[];
  assignments: Assignment[];
}

export function ReportView({ requests, locations, assignments }: Props) {
  const report = buildReport(requests, locations, assignments);

  if (report.totalRequests === 0) {
    return (
      <div className="report">
        <h2>Итоговый отчёт</h2>
        <p className="empty-state">
          Заявок пока нет — отчёт появится, как только в системе будет хотя бы одна заявка.
        </p>
      </div>
    );
  }

  return (
    <div className="report">
      <h2>Итоговый отчёт</h2>
      <div className="report__stats">
        <div className="stat">
          <span className="stat__value">{report.totalRequests}</span>
          <span className="stat__label">всего заявок</span>
        </div>
        <div className="stat stat--ok">
          <span className="stat__value">{report.resettledCount}</span>
          <span className="stat__label">расселено</span>
        </div>
        <div className="stat stat--bad">
          <span className="stat__value">{report.unresettledCount}</span>
          <span className="stat__label">без места</span>
        </div>
      </div>

      <h3>Проблемные заявки</h3>
      {report.problematicRequests.length === 0 ? (
        <p className="empty-state">Проблемных заявок нет — все расселены без нарушений.</p>
      ) : (
        <ul className="report__list">
          {report.problematicRequests.map((p) => (
            <li key={p.requestId}>
              <strong>{p.name}</strong> — {p.reason}
            </li>
          ))}
        </ul>
      )}

      <h3>Перегруженные места</h3>
      {report.overloadedLocations.length === 0 ? (
        <p className="empty-state">Перегруженных мест нет.</p>
      ) : (
        <ul className="report__list">
          {report.overloadedLocations.map((l) => (
            <li key={l.locationId}>
              <strong>{l.name}</strong> — {l.occupied}/{l.capacity}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
