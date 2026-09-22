import React, { useEffect } from 'react';
import { WindowHeader } from '@/components/layout/WindowHeader';
import { NavigationSidebar } from '@/components/layout/NavigationSidebar';
import { ChatContainer } from '@/components/chat/ChatContainer';
import { TelemetryView } from '@/components/dashboard/TelemetryView';
import { MemoryView } from '@/components/memory/MemoryView';
import { AutomationsView } from '@/components/automations/AutomationsView';
import { SettingsView } from '@/components/settings/SettingsView';
import { AuditView } from '@/components/audit/AuditView';
import { SetupWizard } from '@/components/setup/SetupWizard';
import { ToastProvider } from '@/components/ui/ToastProvider';
import { useJarvisSocket } from '@/hooks/useJarvisSocket';
import { useAppStore } from '@/store/useAppStore';
import { AlertCircle, X } from 'lucide-react';

export function App() {
  const { sendPrompt, interrupt } = useJarvisSocket();
  const {
    activeTab,
    proactiveAlert,
    setProactiveAlert,
    showSetupWizard,
    setShowSetupWizard,
    setFirstRunCompleted,
    setUpdateAvailable,
    setUpdateInfo,
    setActiveProvider,
  } = useAppStore();

  useEffect(() => {
    // 1. Query setup status
    fetch('http://127.0.0.1:8765/api/setup/status')
      .then((res) => res.json())
      .then((data) => {
        setFirstRunCompleted(data.first_run_completed);
        if (!data.first_run_completed) {
          setShowSetupWizard(true);
        }
        if (data.active_provider) {
          setActiveProvider(data.active_provider);
        }
      })
      .catch(() => {});

    // 2. Query GitHub auto-update check in background
    fetch('http://127.0.0.1:8765/api/updates/check')
      .then((res) => res.json())
      .then((info) => {
        if (info.update_available) {
          setUpdateAvailable(true);
          setUpdateInfo(info);
        }
      })
      .catch(() => {});
  }, [setFirstRunCompleted, setShowSetupWizard, setUpdateAvailable, setUpdateInfo, setActiveProvider]);

  return (
    <div className="w-screen h-screen flex flex-col bg-void text-text overflow-hidden relative font-sans select-none">
      {/* Global Toast Notification Container */}
      <ToastProvider />

      {/* Full-Screen First-Run Setup Wizard */}
      {showSetupWizard && (
        <SetupWizard onComplete={() => setShowSetupWizard(false)} />
      )}

      {/* Clean Desktop Header */}
      <WindowHeader />

      {/* Proactive Intelligence Banner */}
      {proactiveAlert && (
        <div className="absolute top-11 left-1/2 -translate-x-1/2 z-40 max-w-lg w-full px-4 animate-fade-in">
          <div className="p-3.5 rounded-xl border border-signal/30 shadow-elevated flex items-start gap-3 bg-surface-elevated">
            <AlertCircle className="text-signal shrink-0 mt-0.5" size={17} />
            <div className="flex-1 overflow-hidden font-sans">
              <div className="text-xs font-medium text-text-bright">
                {proactiveAlert.title}
              </div>
              <div className="text-xs text-text-muted mt-0.5">
                {proactiveAlert.message}
              </div>
              {proactiveAlert.action_tool && (
                <button
                  onClick={() => {
                    sendPrompt(`Execute ${proactiveAlert.action_tool}`);
                    setProactiveAlert(null);
                  }}
                  className="mt-2 px-3 py-1 rounded-md bg-signal text-white text-[11px] font-medium hover:bg-signal-hover transition-colors"
                >
                  Run action
                </button>
              )}
            </div>
            <button
              onClick={() => setProactiveAlert(null)}
              className="p-1 text-text-muted hover:text-text-bright transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Main Workspace Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Navigation Sidebar */}
        <NavigationSidebar />

        {/* Dynamic View Panel with Clean Fade Transition */}
        <main key={activeTab} className="flex-1 h-full flex flex-col overflow-hidden relative animate-fade-in bg-void">
          {activeTab === 'chat' && (
            <ChatContainer
              onSendMessage={(text) => sendPrompt(text)}
              onInterrupt={interrupt}
            />
          )}
          {activeTab === 'dashboard' && <TelemetryView />}
          {activeTab === 'memory' && <MemoryView />}
          {activeTab === 'automations' && <AutomationsView />}
          {activeTab === 'settings' && <SettingsView />}
          {activeTab === 'audit' && <AuditView />}
        </main>
      </div>
    </div>
  );
}

export default App;
