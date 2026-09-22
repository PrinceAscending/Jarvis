import React from 'react';
import {
  MessageSquareCode,
  Activity,
  BrainCircuit,
  Zap,
  ShieldCheck,
  Settings,
} from 'lucide-react';
import { useAppStore, NavigationTab } from '@/store/useAppStore';

interface NavItem {
  id: NavigationTab;
  label: string;
  icon: React.ElementType;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'chat', label: 'Chat', icon: MessageSquareCode },
  { id: 'dashboard', label: 'System', icon: Activity },
  { id: 'memory', label: 'Memory', icon: BrainCircuit },
  { id: 'automations', label: 'Workflows', icon: Zap },
  { id: 'audit', label: 'Audit log', icon: ShieldCheck },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export const NavigationSidebar: React.FC = () => {
  const { activeTab, setActiveTab } = useAppStore();

  return (
    <aside className="w-14 md:w-48 h-full flex flex-col justify-between border-r border-surface-border bg-void select-none z-20">
      {/* Navigation Links */}
      <div className="p-2 space-y-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all relative ${
                isActive
                  ? 'bg-surface-elevated text-text-bright font-medium border border-surface-border'
                  : 'text-text-muted hover:text-text hover:bg-surface/60 border border-transparent'
              }`}
            >
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-4 bg-signal rounded-r-full" />
              )}
              <Icon
                size={17}
                className={`shrink-0 transition-colors ${
                  isActive ? 'text-signal' : 'text-text-muted'
                }`}
              />
              <span className="hidden md:inline-block tracking-normal">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Subtle version footnote */}
      <div className="p-3 border-t border-surface-border hidden md:block">
        <div className="text-[11px] text-text-muted/70 flex items-center justify-between">
          <span>Jarvis</span>
          <span>v4.2.0</span>
        </div>
      </div>
    </aside>
  );
};
