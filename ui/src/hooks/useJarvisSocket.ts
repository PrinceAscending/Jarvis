import { useEffect, useRef } from 'react';
import { useAppStore } from '@/store/useAppStore';

export function useJarvisSocket(url: string = 'ws://127.0.0.1:8765/ws') {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<any>(null);
  const activeAssistantMsgIdRef = useRef<string | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioQueueRef = useRef<ArrayBuffer[]>([]);
  const isPlayingAudioRef = useRef<boolean>(false);

  const {
    setConnected,
    setStatus,
    addMessage,
    appendStreamChunk,
    finalizeStream,
    setCurrentToolEvent,
    setProactiveAlert,
  } = useAppStore();

  // Initialize Web Audio Context for gapless MP3 chunk playback
  const playNextAudioChunk = async () => {
    if (audioQueueRef.current.length === 0) {
      isPlayingAudioRef.current = false;
      return;
    }
    isPlayingAudioRef.current = true;
    const chunk = audioQueueRef.current.shift()!;

    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }

      const decoded = await audioContextRef.current.decodeAudioData(chunk.slice(0));
      const source = audioContextRef.current.createBufferSource();
      source.buffer = decoded;
      source.connect(audioContextRef.current.destination);
      source.onended = () => {
        playNextAudioChunk();
      };
      source.start();
    } catch (e) {
      // If chunk is partial mp3 frame, continue
      playNextAudioChunk();
    }
  };

  useEffect(() => {
    let unmounted = false;

    const connect = () => {
      if (unmounted) return;
      try {
        const ws = new WebSocket(url);
        ws.binaryType = 'arraybuffer';
        wsRef.current = ws;

        ws.onopen = () => {
          if (!unmounted) setConnected(true);
        };

        ws.onclose = () => {
          if (!unmounted) {
            setConnected(false);
            reconnectTimeoutRef.current = setTimeout(connect, 2000);
          }
        };

        ws.onerror = () => {
          ws.close();
        };

        ws.onmessage = (event) => {
          // Binary audio data
          if (event.data instanceof ArrayBuffer) {
            audioQueueRef.current.push(event.data);
            if (!isPlayingAudioRef.current) {
              playNextAudioChunk();
            }
            return;
          }

          // JSON text event
          try {
            const data = JSON.parse(event.data);
            const { type, payload } = data;

            switch (type) {
              case 'status':
                setStatus(payload);
                break;

              case 'token':
                if (!activeAssistantMsgIdRef.current) {
                  activeAssistantMsgIdRef.current = addMessage({
                    role: 'assistant',
                    content: payload,
                    isStreaming: true,
                  });
                } else {
                  appendStreamChunk(activeAssistantMsgIdRef.current, payload);
                }
                break;

              case 'done':
                if (activeAssistantMsgIdRef.current) {
                  finalizeStream(activeAssistantMsgIdRef.current, payload?.text);
                  activeAssistantMsgIdRef.current = null;
                }
                setStatus('idle');
                break;

              case 'tool_start':
                setCurrentToolEvent({
                  name: payload.name,
                  call_id: payload.call_id,
                  arguments: payload.arguments,
                  status: 'running',
                });
                break;

              case 'tool_done':
                setCurrentToolEvent({
                  name: payload.name,
                  call_id: payload.call_id,
                  result: payload.result,
                  error: payload.error,
                  message: payload.message,
                  status: payload.success ? 'completed' : 'failed',
                });
                break;

              case 'proactive_suggestion':
                setProactiveAlert(payload);
                break;

              case 'error':
                addMessage({
                  role: 'system',
                  content: `⚠️ ${payload.message || 'System encountered an error.'}`,
                });
                setStatus('idle');
                break;
            }
          } catch (e) {
            console.error('[WebSocket] Failed to parse message', e);
          }
        };
      } catch (err) {
        if (!unmounted) {
          reconnectTimeoutRef.current = setTimeout(connect, 2000);
        }
      }
    };

    connect();

    return () => {
      unmounted = true;
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) wsRef.current.close();
    };
  }, [url]);

  const sendPrompt = (text: string, conversationId: string = 'default') => {
    if (!text.trim()) return;

    // Add user message to local state immediately
    addMessage({
      role: 'user',
      content: text,
    });

    activeAssistantMsgIdRef.current = null;
    setStatus('thinking');

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'prompt',
          payload: { text, conversation_id: conversationId },
        })
      );
    } else {
      setTimeout(() => {
        addMessage({
          role: 'system',
          content: "Backend offline. Reconnecting to local intelligence server...",
        });
        setStatus('idle');
      }, 500);
    }
  };

  const interrupt = () => {
    // Empty audio queue
    audioQueueRef.current = [];
    isPlayingAudioRef.current = false;
    if (audioContextRef.current && audioContextRef.current.state === 'running') {
      audioContextRef.current.suspend();
    }

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'interrupt', payload: {} }));
    }
    setStatus('idle');
  };

  return { sendPrompt, interrupt };
}
