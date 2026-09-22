import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Mic,
  MicOff,
  Square,
  Wrench,
  Trash2,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { AudioVisualizerOrb } from '@/components/audio/AudioVisualizerOrb';
import { MarkdownRenderer } from './MarkdownRenderer';

interface ChatContainerProps {
  onSendMessage: (text: string) => void;
  onInterrupt: () => void;
}

export const ChatContainer: React.FC<ChatContainerProps> = ({
  onSendMessage,
  onInterrupt,
}) => {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const {
    messages,
    status,
    currentToolEvent,
    clearMessages,
    micActive,
    setMicActive,
  } = useAppStore();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, currentToolEvent, status]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [inputText]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim());
    setInputText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleSuggestionClick = (prompt: string) => {
    onSendMessage(prompt);
  };

  const SUGGESTIONS = [
    'How is my system performing?',
    'Organize my Downloads folder',
    'Summarize recent technology news',
  ];

  const greetingTime = (() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Good morning';
    if (hour >= 12 && hour < 18) return 'Good afternoon';
    return 'Good evening';
  })();

  return (
    <div className="flex-1 h-full flex flex-col justify-between overflow-hidden bg-void relative animate-fade-in">
      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 space-y-5">
        {/* Arc Reactor Center Presence if messages are few */}
        {messages.length <= 1 && (
          <div className="flex flex-col items-center justify-center my-6 text-center select-none animate-fade-in">
            <AudioVisualizerOrb status={status} size={200} />
            <h2 className="text-xl font-medium tracking-tight text-text-bright mt-4">
              {greetingTime}
            </h2>
            <p className="text-xs text-text-muted max-w-sm mt-1">
              Jarvis is ready to assist with system control, tasks, and questions.
            </p>

            {/* Quick Suggestions Chips */}
            <div className="flex flex-wrap justify-center gap-2 mt-5 max-w-lg">
              {SUGGESTIONS.map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSuggestionClick(s)}
                  className="px-3.5 py-1.5 rounded-lg bg-surface hover:bg-surface-elevated border border-surface-border text-text hover:text-text-bright text-xs transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Message Thread */}
        {messages.map((msg) => {
          const isAssistant = msg.role === 'assistant';
          const isUser = msg.role === 'user';
          const isTool = msg.role === 'tool';

          if (isTool) return null;

          return (
            <div
              key={msg.id}
              className={`flex flex-col max-w-2xl animate-fade-in ${
                isUser ? 'ml-auto items-end' : 'mr-auto items-start'
              }`}
            >
              <div
                className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                  isUser
                    ? 'bg-signal/15 text-text-bright border border-signal/30 rounded-tr-sm'
                    : 'bg-surface text-text border border-surface-border rounded-tl-sm'
                }`}
              >
                {isAssistant ? (
                  <MarkdownRenderer content={msg.content} />
                ) : (
                  <div className="whitespace-pre-wrap font-sans select-text">
                    {msg.content}
                  </div>
                )}

                {msg.isStreaming && (
                  <span className="inline-block w-1.5 h-3.5 ml-1 bg-signal animate-pulse align-middle" />
                )}
              </div>

              <span className="text-[10px] text-text-muted/60 mt-1 px-1">
                {msg.timestamp}
              </span>
            </div>
          );
        })}

        {/* Live Active Tool Execution Badge */}
        {currentToolEvent && currentToolEvent.status === 'running' && (
          <div className="max-w-md mx-auto p-2.5 rounded-lg bg-surface border border-warm/30 flex items-center gap-3 animate-fade-in">
            <div className="w-6 h-6 rounded-md bg-warm/15 border border-warm/30 flex items-center justify-center shrink-0">
              <Wrench size={13} className="text-warm" />
            </div>
            <div className="flex-1 overflow-hidden">
              <div className="text-xs font-mono font-medium text-warm">
                Running: {currentToolEvent.name}
              </div>
              <div className="text-[10px] font-mono text-text-muted truncate">
                {JSON.stringify(currentToolEvent.arguments || {})}
              </div>
            </div>
          </div>
        )}

        {/* Thinking Indicator */}
        {status === 'thinking' && !currentToolEvent && (
          <div className="flex items-center gap-2 max-w-sm mr-auto animate-fade-in">
            <div className="bg-surface px-3 py-2 rounded-xl border border-surface-border rounded-tl-sm flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-semantic-thinking animate-bounce" />
              <span className="w-1.5 h-1.5 rounded-full bg-semantic-thinking animate-bounce [animation-delay:0.2s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-semantic-thinking animate-bounce [animation-delay:0.4s]" />
              <span className="text-xs text-text-muted ml-2">Thinking...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Console Bar */}
      <div className="p-3 border-t border-surface-border bg-void/90 select-none z-20">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto flex items-end gap-2">
          {/* Clear Button */}
          <button
            type="button"
            onClick={clearMessages}
            title="Clear chat"
            className="p-2 text-text-muted hover:text-text-bright hover:bg-surface rounded-lg transition-colors shrink-0 mb-0.5"
          >
            <Trash2 size={15} />
          </button>

          {/* Multi-line Auto-expanding Textarea */}
          <div className="flex-1 relative flex items-center">
            <textarea
              ref={textareaRef}
              rows={1}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Message Jarvis..."
              className="w-full bg-surface hover:bg-surface-elevated focus:bg-surface-elevated border border-surface-border focus:border-signal/50 rounded-xl px-3.5 py-2.5 text-sm text-text-bright placeholder-text-muted outline-none transition-colors font-sans pr-9 resize-none min-h-[40px] max-h-[120px] leading-relaxed"
            />
            {status !== 'idle' && (
              <button
                type="button"
                onClick={onInterrupt}
                title="Stop response"
                className="absolute right-2.5 bottom-2 p-1.5 rounded-md bg-semantic-error/20 hover:bg-semantic-error/30 text-semantic-error transition-colors"
              >
                <Square size={12} className="fill-current" />
              </button>
            )}
          </div>

          {/* Push to Talk Button */}
          <button
            type="button"
            onClick={() => setMicActive(!micActive)}
            title={micActive ? 'Mute' : 'Voice input'}
            className={`p-2.5 rounded-xl border transition-colors shrink-0 mb-0.5 ${
              micActive
                ? 'bg-semantic-online/20 border-semantic-online/40 text-semantic-online'
                : 'bg-surface border-surface-border text-text-muted hover:text-text hover:bg-surface-elevated'
            }`}
          >
            {micActive ? <Mic size={17} /> : <MicOff size={17} />}
          </button>

          {/* Send Button */}
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="p-2.5 rounded-xl bg-signal hover:bg-signal-hover disabled:opacity-30 disabled:hover:bg-signal text-white transition-colors shrink-0 mb-0.5"
          >
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
};
