import React, { useEffect, useState } from 'react';
import { AudioVisualizerOrb } from '@/components/audio/AudioVisualizerOrb';
import { CheckCircle2 } from 'lucide-react';

interface BootSequenceProps {
  onComplete: () => void;
  assistantName: string;
}

export const BootSequence: React.FC<BootSequenceProps> = ({ onComplete, assistantName }) => {
  const [logs, setLogs] = useState<string[]>([]);

  const BOOT_LOGS = [
    'ESTABLISHING SECURE RUNTIME PIPELINE...',
    'INITIALIZING DYNAMIC TOOL REGISTRY (19 TOOLS ONLINE)...',
    'MOUNTING PERSISTENT SQLITE MEMORY DATABASE...',
    'CONNECTING TO NEURAL INFERENCE ENGINE...',
    'SYNCHRONIZING EDGE TTS ACOUSTIC MATRIX...',
    'ARMING PROACTIVE TELEMETRY & HEALTH WATCHDOG...',
    'ALL SUBSYSTEMS NOMINAL.',
    `WELCOME, OPERATOR. ${assistantName.toUpperCase()} IS ONLINE.`,
  ];

  useEffect(() => {
    let currentIdx = 0;
    const interval = setInterval(() => {
      if (currentIdx < BOOT_LOGS.length) {
        setLogs((prev) => [...prev, BOOT_LOGS[currentIdx]]);
        currentIdx++;
      } else {
        clearInterval(interval);
        setTimeout(() => {
          onComplete();
        }, 1200);
      }
    }, 400);

    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 bg-obsidian-950 flex flex-col items-center justify-center p-6 z-50 cyber-grid select-none animate-fade-slide-in">
      <div className="flex flex-col items-center max-w-lg w-full space-y-6 text-center">
        {/* Arc Reactor Core Pulsing */}
        <div className="scale-110">
          <AudioVisualizerOrb status="speaking" size={240} />
        </div>

        {/* Brand */}
        <div className="space-y-1">
          <h1 className="text-2xl font-display font-bold tracking-widest text-zinc-100 uppercase">
            {assistantName} CORE ACTIVATION
          </h1>
          <p className="text-xs font-mono text-cyan-neon tracking-widest uppercase animate-pulse">
            System Booting // Windows 11
          </p>
        </div>

        {/* Terminal Boot Log */}
        <div className="w-full glass-panel p-4 rounded-xl border-cyan-neon/30 text-left font-mono text-[11px] space-y-1.5 h-44 overflow-hidden shadow-neon-cyan/10">
          {logs.map((log, idx) => (
            <div key={idx} className="flex items-center gap-2 animate-fade-slide-in">
              <span className="text-cyan-neon">[OK]</span>
              <span className={idx === logs.length - 1 ? 'text-zinc-100 font-bold' : 'text-zinc-400'}>
                {log}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
