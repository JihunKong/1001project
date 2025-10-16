'use client';

interface Tab {
  id: string;
  label: string;
  count?: number;
}

interface TabNavigationProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export default function TabNavigation({ tabs, activeTab, onTabChange }: TabNavigationProps) {
  return (
    <div className="border-b border-[#E5E5EA]">
      <nav className="flex gap-3" aria-label="Story status tabs">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              aria-current={isActive ? 'page' : undefined}
              className={`
                px-2.5 py-2 text-sm font-medium transition-colors relative
                ${isActive
                  ? 'text-[#141414]'
                  : 'text-[#8E8E93] hover:text-[#141414]'
                }
              `}
            >
              <span>{tab.label}</span>
              {tab.count !== undefined && tab.count > 0 && (
                <span
                  className={`ml-1 text-xs ${isActive ? 'text-[#141414]' : 'text-[#8E8E93]'}`}
                >
                  ({tab.count})
                </span>
              )}
              {isActive && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#141414]" />
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
