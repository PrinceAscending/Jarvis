import React, { useState } from 'react';
import { WelcomeStep } from './steps/WelcomeStep';
import { AIModeStep } from './steps/AIModeStep';
import { APIKeyStep } from './steps/APIKeyStep';
import { VoiceStep } from './steps/VoiceStep';
import { PermissionsStep } from './steps/PermissionsStep';
import { ReviewStep } from './steps/ReviewStep';
import { BootSequence } from './steps/BootSequence';
import { useToastStore } from '@/hooks/useToast';

interface SetupWizardProps {
  onComplete: () => void;
}

export const SetupWizard: React.FC<SetupWizardProps> = ({ onComplete }) => {
  const [step, setStep] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isBooting, setIsBooting] = useState(false);

  // Form State
  const [assistantName, setAssistantName] = useState('JARVIS');
  const [userName, setUserName] = useState('Sir');
  const [aiMode, setAiMode] = useState<'local' | 'online'>('online');
  const [activeProvider, setActiveProvider] = useState('gemini');
  const [providerConfig, setProviderConfig] = useState<any>({
    api_key: '',
    model: 'gemini-2.5-flash',
    base_url: 'http://localhost:11434',
  });
  const [voiceConfig, setVoiceConfig] = useState<any>({
    tts_voice: 'en-US-ChristopherNeural',
    tts_rate: '+5%',
  });
  const [permissionsLevel, setPermissionsLevel] = useState('interactive');
  const [proactiveEnabled, setProactiveEnabled] = useState(true);

  const STEP_TITLES = [
    'Identity',
    'AI Mode',
    'Credentials',
    'Voice Persona',
    'Guardrails',
    'Activation',
  ];

  const handleCompleteSetup = async () => {
    setIsSubmitting(true);
    try {
      const payload = {
        assistant_name: assistantName,
        user_name: userName,
        active_provider: activeProvider,
        provider_config: providerConfig,
        voice_config: voiceConfig,
        permissions_level: permissionsLevel,
        proactive_enabled: proactiveEnabled,
      };

      const res = await fetch('http://127.0.0.1:8765/api/setup/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setIsBooting(true);
      } else {
        useToastStore.getState().addToast({
          type: 'error',
          title: 'Setup Failed',
          message: 'Unable to commit configuration parameters.',
        });
        setIsSubmitting(false);
      }
    } catch (e: any) {
      useToastStore.getState().addToast({
        type: 'error',
        title: 'Connection Error',
        message: e.message || 'Cannot reach JARVIS backend service.',
      });
      setIsSubmitting(false);
    }
  };

  if (isBooting) {
    return <BootSequence onComplete={onComplete} assistantName={assistantName} />;
  }

  return (
    <div className="fixed inset-0 z-50 bg-obsidian-950 flex flex-col justify-between p-6 md:p-10 cyber-grid overflow-y-auto select-none">
      {/* Dynamic Background Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-cyan-500/10 rounded-full blur-[140px] pointer-events-none -z-10" />

      {/* Progress Steps Header */}
      <div className="max-w-2xl mx-auto w-full">
        <div className="flex items-center justify-between gap-1 mb-2">
          {STEP_TITLES.map((title, idx) => {
            const isDone = idx < step;
            const isCurr = idx === step;
            return (
              <div key={title} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className={`h-1 w-full rounded-full transition-all ${
                    isDone
                      ? 'bg-cyan-neon shadow-[0_0_10px_rgba(0,240,255,0.5)]'
                      : isCurr
                      ? 'bg-cyan-500/60'
                      : 'bg-white/10'
                  }`}
                />
                <span
                  className={`text-[9px] font-mono tracking-wider hidden sm:block ${
                    isCurr ? 'text-cyan-neon font-bold' : 'text-zinc-500'
                  }`}
                >
                  {title}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Wizard Step Body */}
      <div className="my-auto py-6">
        {step === 0 && (
          <WelcomeStep
            assistantName={assistantName}
            setAssistantName={setAssistantName}
            userName={userName}
            setUserName={setUserName}
            onNext={() => setStep(1)}
          />
        )}

        {step === 1 && (
          <AIModeStep
            mode={aiMode}
            setMode={setAiMode}
            selectedProvider={activeProvider}
            setSelectedProvider={(prov) => {
              setActiveProvider(prov);
              if (prov === 'gemini') {
                setProviderConfig((c: any) => ({ ...c, model: 'gemini-2.5-flash' }));
              } else if (prov === 'groq') {
                setProviderConfig((c: any) => ({ ...c, model: 'llama-3.3-70b-versatile' }));
              } else if (prov === 'openrouter') {
                setProviderConfig((c: any) => ({ ...c, model: 'meta-llama/llama-3.3-70b-instruct:free' }));
              } else if (prov === 'ollama') {
                setProviderConfig((c: any) => ({ ...c, model: 'llama3:latest' }));
              }
            }}
            onNext={() => setStep(2)}
            onBack={() => setStep(0)}
          />
        )}

        {step === 2 && (
          <APIKeyStep
            provider={activeProvider}
            providerConfig={providerConfig}
            setProviderConfig={setProviderConfig}
            onNext={() => setStep(3)}
            onBack={() => setStep(1)}
          />
        )}

        {step === 3 && (
          <VoiceStep
            voiceConfig={voiceConfig}
            setVoiceConfig={setVoiceConfig}
            onNext={() => setStep(4)}
            onBack={() => setStep(2)}
          />
        )}

        {step === 4 && (
          <PermissionsStep
            permissionsLevel={permissionsLevel}
            setPermissionsLevel={setPermissionsLevel}
            proactiveEnabled={proactiveEnabled}
            setProactiveEnabled={setProactiveEnabled}
            onNext={() => setStep(5)}
            onBack={() => setStep(3)}
          />
        )}

        {step === 5 && (
          <ReviewStep
            assistantName={assistantName}
            userName={userName}
            activeProvider={activeProvider}
            providerConfig={providerConfig}
            voiceConfig={voiceConfig}
            permissionsLevel={permissionsLevel}
            proactiveEnabled={proactiveEnabled}
            onGoToStep={(s) => setStep(s)}
            onConfirmLaunch={handleCompleteSetup}
            onBack={() => setStep(4)}
            isSubmitting={isSubmitting}
          />
        )}
      </div>

      {/* Footer Branding */}
      <div className="text-center font-mono text-[10px] text-zinc-600 tracking-wider">
        J.A.R.V.I.S. WINDOWS 11 INTEGRATED PERSONAL INTELLIGENCE
      </div>
    </div>
  );
};
