import React, { useEffect, useRef } from 'react';
import { AssistantStatus } from '@/store/useAppStore';

interface VisualizerProps {
  status: AssistantStatus;
  size?: number;
}

export const AudioVisualizerOrb: React.FC<VisualizerProps> = ({ status, size = 260 }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let phase = 0;
    let ringAngle = 0;

    const render = () => {
      ctx.clearRect(0, 0, size, size);

      const center = size / 2;
      phase += 0.04;
      ringAngle += status === 'tool_executing' ? 0.05 : 0.015;

      // Status-specific color palette (aerospace cockpit instrumentation)
      let primaryGlow = 'rgba(226, 168, 105, 0.85)'; // Warm amber idle
      let secondaryGlow = 'rgba(226, 168, 105, 0.22)';
      let coreColor = 'rgba(243, 190, 134, 0.95)';
      let speedMultiplier = 1.0;
      let amplitude = 6;

      if (status === 'thinking') {
        primaryGlow = 'rgba(167, 139, 250, 0.9)'; // Violet synthesis
        secondaryGlow = 'rgba(167, 139, 250, 0.25)';
        coreColor = 'rgba(196, 181, 253, 0.95)';
        speedMultiplier = 2.0;
        amplitude = 10;
      } else if (status === 'tool_executing') {
        primaryGlow = 'rgba(251, 191, 36, 0.9)'; // Active execution amber
        secondaryGlow = 'rgba(251, 191, 36, 0.25)';
        coreColor = 'rgba(253, 230, 138, 0.95)';
        speedMultiplier = 2.4;
        amplitude = 12;
      } else if (status === 'speaking') {
        primaryGlow = 'rgba(79, 106, 232, 0.95)'; // Signal indigo wave
        secondaryGlow = 'rgba(99, 125, 240, 0.35)';
        coreColor = 'rgba(255, 255, 255, 0.98)';
        speedMultiplier = 1.8;
        amplitude = 16;
      } else if (status === 'listening') {
        primaryGlow = 'rgba(52, 211, 153, 0.95)'; // Acoustic reception emerald
        secondaryGlow = 'rgba(52, 211, 153, 0.25)';
        coreColor = 'rgba(110, 231, 183, 0.95)';
        speedMultiplier = 1.2;
        amplitude = 14;
      }

      // 1. Draw outer segmented cyber ring
      ctx.save();
      ctx.translate(center, center);
      ctx.rotate(ringAngle);
      ctx.strokeStyle = secondaryGlow;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([8, 12]);
      ctx.beginPath();
      ctx.arc(0, 0, center * 0.88, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // 2. Draw counter-rotating middle ring
      ctx.save();
      ctx.translate(center, center);
      ctx.rotate(-ringAngle * 0.7);
      ctx.strokeStyle = primaryGlow;
      ctx.lineWidth = 1.2;
      ctx.setLineDash([4, 16]);
      ctx.beginPath();
      ctx.arc(0, 0, center * 0.76, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // 3. Draw multi-layered orbital waveforms
      for (let layer = 0; layer < 3; layer++) {
        ctx.save();
        ctx.beginPath();
        const baseRadius = center * 0.48 + layer * 10;
        ctx.strokeStyle = primaryGlow;
        ctx.lineWidth = 2.2 - layer * 0.5;
        ctx.shadowBlur = 18;
        ctx.shadowColor = primaryGlow;

        const points = 72;
        for (let i = 0; i <= points; i++) {
          const theta = (i / points) * Math.PI * 2;
          const wobble =
            Math.sin(theta * (4 + layer) + phase * speedMultiplier + layer * 1.5) *
            (amplitude + Math.sin(phase * 2) * 3);
          const r = baseRadius + wobble;
          const x = center + Math.cos(theta) * r;
          const y = center + Math.sin(theta) * r;

          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }

        ctx.closePath();
        ctx.stroke();
        ctx.restore();
      }

      // 4. Central Glowing Arc Reactor Core
      const corePulse = Math.sin(phase * 1.5) * 4;
      const coreRadius = Math.max(12, center * 0.22 + corePulse);

      const gradient = ctx.createRadialGradient(
        center,
        center,
        2,
        center,
        center,
        coreRadius * 1.5
      );
      gradient.addColorStop(0, coreColor);
      gradient.addColorStop(0.5, primaryGlow);
      gradient.addColorStop(1, 'transparent');

      ctx.save();
      ctx.fillStyle = gradient;
      ctx.shadowBlur = 25;
      ctx.shadowColor = primaryGlow;
      ctx.beginPath();
      ctx.arc(center, center, coreRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [status, size]);

  return (
    <div className="relative flex items-center justify-center select-none" style={{ width: size, height: size }}>
      <canvas ref={canvasRef} width={size} height={size} className="w-full h-full" />
    </div>
  );
};
