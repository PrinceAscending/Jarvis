import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Mic,
  MicOff,
  Square,
  Wrench,
  CheckCircle2,
  AlertCircle,
  Terminal,
  Sparkles,
  Bot,
  User,
  Trash2,
  Cpu,
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
    'Audit system health and memory',
    'Organize my Downloads folder',
    'List top running processes',
    'Search the web for latest AI news',
  ];

  return (
    <div className="flex-1 h-full flex flex-col justify-between overflow-hidden bg-obsidian-950/40 relative cyber-grid animate-fade-slide-in">
      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 space-y-6">
        {/* Arc Reactor Center Presence if messages are few */}
        {messages.length <= 2 && (
          <div className="flex flex-col items-center justify-center my-6 text-center select-none animate-fade-slide-in">
            <AudioVisualizerOrb status={status} size={220} />
            <h2 className="text-xl font-display font-bold tracking-widest text-zinc-100 mt-4 uppercase">
              J.A.R.V.I.S.
            </h2>
            <p className="text-xs text-zinc-400 font-mono max-w-sm mt-1">
              Autonomous Windows 11 Personal Intelligence Environment
            </p>

            {/* Quick Suggestions Chips */}
            <div className="flex flex-wrap justify-center gap-2 mt-6 max-w-lg">
              {SUGGESTIONS.map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSuggestionClick(s)}
                  className="px-3 py-1.5 rounded-full bg-white/[0.03] hover:bg-cyan-500/10 border border-white/10 hover:border-cyan-neon/40 text-zinc-300 hover:text-cyan-neon text-xs transition-all flex items-center gap-1.5"
                >
                  <Sparkles size={11} className="text-cyan-neon" />
                  <span>{s}</span>
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
              className={`flex gap-3.5 max-w-3xl animate-fade-slide-in ${
                isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'
              }`}
            >
              {/* Avatar Icon */}
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
                  isUser
                    ? 'bg-zinc-800 border-white/20 text-zinc-200'
                    : isAssistant
                    ? 'bg-cyan-500/10 border-cyan-neon/30 text-cyan-neon shadow-[0_0_10px_rgba(0,240,255,0.2)]'
                    : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                }`}
              >
                {isUser ? <User size={15} /> : <Bot size={15} />}
              </div>

              {/* Message Content Bubble */}
              <div
                className={`flex flex-col ${
                  isUser ? 'items-end' : 'items-start'
                }`}
              >
                <div className="flex items-center gap-2 mb-1 px-1">
                  <span className="text-[10px] font-mono tracking-wider text-zinc-400 uppercase">
                    {isUser ? 'OPERATOR' : 'J.A.R.V.I.S.'}
                  </span>
                  <span className="text-[9px] font-mono text-zinc-600">
                    {msg.timestamp}
                  </span>
                </div>

                <div
                  className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                    isUser
                      ? 'bg-cyan-500/15 text-zinc-100 border border-cyan-neon/20 rounded-tr-sm'
                      : isAssistant
                      ? 'glass-panel text-zinc-200 border-white/10 rounded-tl-sm shadow-glass-edge'
                      : 'bg-amber-950/30 text-amber-200 border border-amber-500/20'
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
                    <span className="inline-block w-2 h-4 ml-1 bg-cyan-neon animate-pulse align-middle" />
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Live Active Tool Execution Card */}
        {currentToolEvent && currentToolEvent.status === 'running' && (
          <div className="max-w-md mx-auto p-3.5 rounded-xl bg-obsidian-900/90 border border-amber-500/40 shadow-[0_0_20px_rgba(245,158,11,0.15)] flex items-center gap-3 animate-fade-slide-in">
            <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0">
              <Wrench size={14} className="text-amber-400 animate-spin" />
            </div>
            <div className="flex-1 overflow-hidden">
              <div className="text-xs font-mono font-semibold text-amber-300">
                EXECUTING: {currentToolEvent.name}
              </div>
              <div className="text-[10px] font-mono text-zinc-400 truncate">
                {JSON.stringify(currentToolEvent.arguments || {})}
              </div>
            </div>
          </div>
        )}

        {/* Neural Processing Typing Indicator */}
        {status === 'thinking' && !currentToolEvent && (
          <div className="flex items-center gap-3 max-w-sm mr-auto animate-fade-slide-in">
            <div className="w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/30 flex items-center justify-center text-violet-400 shadow-[0_0_10px_rgba(139,92,246,0.2)]">
              <Cpu size={15} className="animate-spin" />
            </div>
            <div className="glass-panel px-4 py-2.5 rounded-2xl border-white/10 rounded-tl-sm flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" />
              <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce [animation-delay:0.2s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce [animation-delay:0.4s]" />
              <span className="text-xs font-mono text-violet-300 ml-2">Neural synthesis...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Console Bar */}
      <div className="p-4 border-t border-white/[0.06] bg-obsidian-950/90 backdrop-blur-xl z-20">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto flex items-end gap-2">
          {/* Clear Button */}
          <button
            type="button"
            onClick={clearMessages}
            title="Clear Chat History"
            className="p-2.5 text-zinc-500 hover:text-zinc-300 hover:bg-white/5 rounded-xl transition-colors shrink-0 mb-0.5"
          >
            <Trash2 size={16} />
          </button>

          {/* Multi-line Auto-expanding Textarea */}
          <div className="flex-1 relative flex items-center">
            <textarea
              ref={textareaRef}
              rows={1}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Give a command or ask JARVIS... (Enter to send, Shift+Enter for newline)"
              className="w-full bg-white/[0.03] hover:bg-white/[0.05] focus:bg-white/[0.07] border border-white/10 focus:border-cyan-neon/50 rounded-xl px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition-all font-sans pr-10 shadow-inner resize-none min-h-[42px] max-h-[120px] leading-relaxed"
            />
            {status !== 'idle' && (
              <button
                type="button"
                onClick={onInterrupt}
                title="Silence / Stop Speech"
                className="absolute right-3 bottom-2.5 p-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/40 transition-colors"
              >
                <Square size={13} className="fill-rose-400" />
              </button>
            )}
          </div>

          {/* Push to Talk Button */}
          <button
            type="button"
            onClick={() => setMicActive(!micActive)}
            title={micActive ? 'Mute Microphone' : 'Push to Talk'}
            className={`p-3 rounded-xl border transition-all shrink-0 mb-0.5 ${
              micActive
                ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)] animate-pulse'
                : 'bg-white/[0.03] border-white/10 text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
            }`}
          >
            {micActive ? <Mic size={18} /> : <MicOff size={18} />}
          </button>

          {/* Send Button */}
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="p-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-30 disabled:hover:bg-cyan-500 text-obsidian-950 font-semibold transition-all shrink-0 shadow-neon-cyan mb-0.5"
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
};
