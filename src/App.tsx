import { useState } from 'react';
import { LocationForm } from './components/LocationForm';
import { LocationList } from './components/LocationList';
import { MatchCard } from './components/MatchCard';
import { ReportView } from './components/ReportView';
import { RequestForm } from './components/RequestForm';
import { TabNav, type TabId } from './components/TabNav';
import { WorklogView } from './components/WorklogView';
import { useAppState } from './state/AppStateContext';

export default function App() {
  const { state, dispatch } = useAppState();
  const [tab, setTab] = useState<TabId>('dispatch');

  return (
    <div className="app">
      <header className="app__header">
        <h1>👻 Бюро переселения привидений</h1>
        <p>Подбираем новые места обитания для привидений из старых домов.</p>
      </header>

      <TabNav active={tab} onChange={setTab} />

      {tab === 'dispatch' && (
        <main className="dispatch">
          <div className="dispatch__toolbar">
            <button type="button" onClick={() => dispatch({ type: 'RESET_TO_SEED' })}>
              Сбросить к примеру данных
            </button>
            <button type="button" className="danger" onClick={() => dispatch({ type: 'CLEAR_ALL' })}>
              Очистить всё
            </button>
          </div>

          <section>
            <h2>Заявки на переселение</h2>
            {state.requests.length === 0 ? (
              <p className="empty-state">
                Заявок нет. Это ожидаемое пустое состояние — добавьте заявку ниже или нажмите
                «Сбросить к примеру данных».
              </p>
            ) : (
              <ul className="match-list">
                {state.requests.map((request) => (
                  <MatchCard
                    key={request.id}
                    request={request}
                    assignment={state.assignments.find((a) => a.requestId === request.id)}
                    locations={state.locations}
                    onManualAssign={(requestId, locationId) =>
                      dispatch({ type: 'MANUAL_ASSIGN', requestId, locationId })
                    }
                    onRevertToAuto={(requestId) => dispatch({ type: 'REVERT_TO_AUTO', requestId })}
                    onRemove={(id) => dispatch({ type: 'REMOVE_REQUEST', id })}
                  />
                ))}
              </ul>
            )}
            <RequestForm onSubmit={(request) => dispatch({ type: 'ADD_REQUEST', request })} />
          </section>

          <section>
            <h2>Места переселения</h2>
            <LocationList
              locations={state.locations}
              assignments={state.assignments}
              onRemove={(id) => dispatch({ type: 'REMOVE_LOCATION', id })}
            />
            <LocationForm onSubmit={(location) => dispatch({ type: 'ADD_LOCATION', location })} />
          </section>
        </main>
      )}

      {tab === 'report' && (
        <main>
          <ReportView requests={state.requests} locations={state.locations} assignments={state.assignments} />
        </main>
      )}

      {tab === 'worklog' && (
        <main>
          <WorklogView />
        </main>
      )}
    </div>
  );
}
