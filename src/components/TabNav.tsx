export type TabId = 'dispatch' | 'report' | 'worklog';

const TABS: { id: TabId; label: string }[] = [
  { id: 'dispatch', label: 'Диспетчерская' },
  { id: 'report', label: 'Отчёт' },
  { id: 'worklog', label: 'AI Worklog' },
];

export function TabNav({ active, onChange }: { active: TabId; onChange: (id: TabId) => void }) {
  return (
    <nav className="tab-nav" aria-label="Разделы приложения">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          className={tab.id === active ? 'tab-nav__item tab-nav__item--active' : 'tab-nav__item'}
          onClick={() => onChange(tab.id)}
          aria-current={tab.id === active ? 'page' : undefined}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
}
