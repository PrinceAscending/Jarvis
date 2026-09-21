import { create } from 'zustand';

export type AssistantStatus = 'idle' | 'listening' | 'thinking' | 'tool_executing' | 'speaking';
export type NavigationTab = 'chat' | 'dashboard' | 'memory' | 'automations' | 'settings' | 'audit';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'tool' | 'system';
  content: string;
  timestamp: string;
  isStreaming?: boolean;
  tool_calls?: any[];
  tool_name?: string;
  tool_result?: any;
}

export interface ToolEvent {
  name: string;
  call_id: string;
  arguments?: any;
  result?: any;
  error?: string;
  message?: string;
  status: 'running' | 'completed' | 'failed';
}

export interface ProactiveAlert {
  type: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  action_tool?: string;
  action_args?: any;
}

interface AppStore {
  status: AssistantStatus;
  activeTab: NavigationTab;
  connected: boolean;
  messages: ChatMessage[];
  systemStats: {
    cpu_percent: number;
    ram_percent: number;
    ram_used_gb: number;
    ram_total_gb: number;
  };
  micActive: boolean;
  alwaysOnTop: boolean;
  currentToolEvent: ToolEvent | null;
  proactiveAlert: ProactiveAlert | null;
  firstRunCompleted: boolean;
  showSetupWizard: boolean;
  isBooting: boolean;
  updateAvailable: boolean;
  updateInfo: any;
  activeProvider: string;

  // Actions
  setStatus: (status: AssistantStatus) => void;
  setActiveTab: (tab: NavigationTab) => void;
  setConnected: (connected: boolean) => void;
  setSystemStats: (stats: any) => void;
  setMicActive: (active: boolean) => void;
  setAlwaysOnTop: (onTop: boolean) => void;
  setCurrentToolEvent: (event: ToolEvent | null) => void;
  setProactiveAlert: (alert: ProactiveAlert | null) => void;
  setFirstRunCompleted: (completed: boolean) => void;
  setShowSetupWizard: (show: boolean) => void;
  setIsBooting: (booting: boolean) => void;
  setUpdateAvailable: (available: boolean) => void;
  setUpdateInfo: (info: any) => void;
  setActiveProvider: (provider: string) => void;

  addMessage: (msg: Omit<ChatMessage, 'id' | 'timestamp'>) => string;
  appendStreamChunk: (id: string, chunk: string) => void;
  finalizeStream: (id: string, finalContent?: string) => void;
  clearMessages: () => void;
}

export const useAppStore = create<AppStore>((set) => ({
  status: 'idle',
  activeTab: 'chat',
  connected: false,
  messages: [
    {
      id: 'welcome',
      role: 'assistant',
      content: "Online and ready, sir. All core systems operational. How may I assist you today?",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }
  ],
  systemStats: {
    cpu_percent: 0,
    ram_percent: 0,
    ram_used_gb: 0,
    ram_total_gb: 0,
  },
  micActive: false,
  alwaysOnTop: false,
  currentToolEvent: null,
  proactiveAlert: null,
  firstRunCompleted: true, // Default to true until checked from server
  showSetupWizard: false,
  isBooting: false,
  updateAvailable: false,
  updateInfo: null,
  activeProvider: 'gemini',

  setStatus: (status) => set({ status }),
  setActiveTab: (activeTab) => set({ activeTab }),
  setConnected: (connected) => set({ connected }),
  setSystemStats: (systemStats) => set({ systemStats }),
  setMicActive: (micActive) => set({ micActive }),
  setAlwaysOnTop: (alwaysOnTop) => set({ alwaysOnTop }),
  setCurrentToolEvent: (currentToolEvent) => set({ currentToolEvent }),
  setProactiveAlert: (proactiveAlert) => set({ proactiveAlert }),
  setFirstRunCompleted: (firstRunCompleted) => set({ firstRunCompleted }),
  setShowSetupWizard: (showSetupWizard) => set({ showSetupWizard }),
  setIsBooting: (isBooting) => set({ isBooting }),
  setUpdateAvailable: (updateAvailable) => set({ updateAvailable }),
  setUpdateInfo: (updateInfo) => set({ updateInfo }),
  setActiveProvider: (activeProvider) => set({ activeProvider }),

  addMessage: (msg) => {
    const id = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newMsg: ChatMessage = {
      ...msg,
      id,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    set((state) => ({ messages: [...state.messages, newMsg] }));
    return id;
  },

  appendStreamChunk: (id, chunk) => {
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === id ? { ...m, content: m.content + chunk, isStreaming: true } : m
      ),
    }));
  },

  finalizeStream: (id, finalContent) => {
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === id
          ? {
              ...m,
              content: finalContent !== undefined ? finalContent : m.content,
              isStreaming: false,
            }
          : m
      ),
    }));
  },

  clearMessages: () => set({ messages: [] }),
}));
