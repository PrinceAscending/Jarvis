import React, { useEffect, useState } from 'react';
import { AudioVisualizerOrb } from '@/components/audio/AudioVisualizerOrb';

interface BootSequenceProps {
  onComplete: () => void;
  assistantName: string;
}

export const BootSequence: React.FC<BootSequenceProps> = ({ onComplete, assistantName }) => {
  const [logs, setLogs] = useState<string[]>([]);

  const BOOT_LOGS = [
    'Establishing secure local runtime pipeline...',
    'Registering automation tools (19 available)...',
    'Mounting persistent memory database...',
    'Connecting to inference engine...',
    'Synchronizing speech synthesizer...',
    'Starting telemetry and system monitor...',
    'Core systems ready.',
    `Welcome. ${assistantName} is online.`,
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
    }, 380);

    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 bg-void flex flex-col items-center justify-center p-6 z-50 select-none animate-fade-in">
      <div className="flex flex-col items-center max-w-md w-full space-y-5 text-center">
        {/* Visualizer Core */}
        <div className="scale-105">
          <AudioVisualizerOrb status="speaking" size={220} />
        </div>

        {/* Title */}
        <div className="space-y-0.5">
          <h1 className="text-xl font-semibold text-text-bright tracking-tight">
            Starting {assistantName}
          </h1>
          <p className="text-xs text-text-muted font-mono">
            Windows 11 Runtime Environment
          </p>
        </div>

        {/* Terminal Boot Log */}
        <div className="w-full surface-card terminal-grid p-4 rounded-xl border border-surface-border text-left font-mono text-[11px] space-y-1.5 h-44 overflow-hidden bg-void/80 shadow-elevated">
          {logs.map((log, idx) => (
            <div key={idx} className="flex items-center gap-2 animate-fade-in">
              <span className="text-semantic-online">[OK]</span>
              <span className={idx === logs.length - 1 ? 'text-text-bright font-medium' : 'text-text-muted'}>
                {log}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
