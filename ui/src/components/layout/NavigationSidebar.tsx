import React from 'react';
import {
  MessageSquareCode,
  Activity,
  BrainCircuit,
  Zap,
  ShieldAlert,
  Settings2,
} from 'lucide-react';
import { useAppStore, NavigationTab } from '@/store/useAppStore';

interface NavItem {
  id: NavigationTab;
  label: string;
  icon: React.ElementType;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'chat', label: 'Command Core', icon: MessageSquareCode },
  { id: 'dashboard', label: 'Telemetry', icon: Activity },
  { id: 'memory', label: 'Memory Core', icon: BrainCircuit },
  { id: 'automations', label: 'Workflows', icon: Zap },
  { id: 'audit', label: 'Security Audit', icon: ShieldAlert },
  { id: 'settings', label: 'Neural Matrix', icon: Settings2 },
];

export const NavigationSidebar: React.FC = () => {
  const { activeTab, setActiveTab } = useAppStore();

  return (
    <aside className="w-16 md:w-56 h-full flex flex-col justify-between border-r border-white/[0.06] bg-obsidian-900/60 backdrop-blur-xl select-none z-20">
      {/* Navigation Links */}
      <div className="p-3 space-y-1.5">
        <div className="hidden md:block px-3 py-2 text-[10px] font-mono tracking-widest text-zinc-500 uppercase">
          Operating Modules
        </div>

        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3.5 px-3 py-2.5 rounded-xl transition-all relative group ${
                isActive
                  ? 'bg-cyan-500/10 text-cyan-neon border border-cyan-neon/30 shadow-[0_0_15px_rgba(0,240,255,0.15)]'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.03]'
              }`}
            >
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-cyan-neon rounded-r" />
              )}
              <Icon
                size={18}
                className={`shrink-0 transition-transform duration-200 ${
                  isActive ? 'scale-110 text-cyan-neon' : 'group-hover:scale-105'
                }`}
              />
              <span className="hidden md:inline-block text-xs font-medium tracking-wide">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Cybernetic Accent Footer */}
      <div className="p-3 border-t border-white/[0.05]">
        <div className="hidden md:flex flex-col gap-1 p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.05]">
          <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400">
            <span>JARVIS CORE</span>
            <span className="text-emerald-400">ONLINE</span>
          </div>
          <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
            <div className="bg-cyan-neon h-full w-4/5 animate-pulse" />
          </div>
        </div>
      </div>
    </aside>
  );
};
