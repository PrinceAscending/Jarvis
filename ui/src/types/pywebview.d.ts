declare global {
  interface Window {
    pywebview?: {
      api: {
        minimize_window: () => Promise<void>;
        close_window: () => Promise<void>;
        set_always_on_top: (onTop: boolean) => Promise<void>;
        ping: () => Promise<{ status: string; time: number }>;
      };
    };
  }
}

export {};
