import React, { useState, useEffect } from 'react';
import {
  BrainCircuit,
  Plus,
  Trash2,
  Tag,
} from 'lucide-react';

export const MemoryView: React.FC = () => {
  const [memories, setMemories] = useState<any[]>([]);
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState('general');
  const [isAdding, setIsAdding] = useState(false);

  const fetchMemories = async () => {
    try {
      const res = await fetch('http://127.0.0.1:8765/api/memories');
      const data = await res.json();
      setMemories(data || []);
    } catch (e) {
      console.error('Failed to load memories', e);
    }
  };

  useEffect(() => {
    fetchMemories();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim()) return;

    try {
      await fetch('http://127.0.0.1:8765/api/memories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newContent.trim(), category: newCategory, importance: 2 }),
      });
      setNewContent('');
      setIsAdding(false);
      fetchMemories();
    } catch (e) {
      console.error('Failed to add memory', e);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`http://127.0.0.1:8765/api/memories/${id}`, {
        method: 'DELETE',
      });
      fetchMemories();
    } catch (e) {
      console.error('Failed to delete memory', e);
    }
  };

  return (
    <div className="flex-1 h-full overflow-y-auto p-6 md:p-8 space-y-6 select-none bg-void">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-text-bright flex items-center gap-2">
            <BrainCircuit className="text-signal" size={18} />
            Memory
          </h2>
          <p className="text-xs text-text-muted mt-0.5">
            Knowledge and preferences Jarvis retains across sessions
          </p>
        </div>

        <button
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-signal hover:bg-signal-hover text-white text-xs font-medium transition-colors"
        >
          <Plus size={14} />
          <span>Add memory</span>
        </button>
      </div>

      {/* Add Memory Drawer */}
      {isAdding && (
        <form onSubmit={handleAdd} className="surface-card p-5 rounded-xl border-surface-border space-y-4 animate-fade-in">
          <h3 className="text-xs font-medium text-text-bright">
            Add a memory
          </h3>

          <div>
            <textarea
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder="e.g. 'User prefers concise summaries with action points.'"
              className="w-full h-24 bg-surface-well border border-surface-border rounded-lg p-3 text-sm text-text-bright placeholder-text-muted outline-none focus:border-signal/50 font-sans"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs text-text-muted">Category:</span>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="bg-surface border border-surface-border rounded-md px-2.5 py-1 text-xs text-text outline-none font-sans"
              >
                <option value="preferences">User preferences</option>
                <option value="projects">Projects & tasks</option>
                <option value="facts">Important facts</option>
                <option value="general">General</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-3 py-1.5 rounded-lg hover:bg-surface-elevated text-text-muted text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-signal text-white font-medium text-xs hover:bg-signal-hover transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Memory Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {memories.map((m) => (
          <div
            key={m.id}
            className="surface-card p-4 rounded-xl hover:border-surface-border/90 transition-colors group relative flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="px-2 py-0.5 rounded-md bg-surface-elevated border border-surface-border text-[11px] text-text-muted flex items-center gap-1">
                  <Tag size={10} />
                  {m.category}
                </span>

                <button
                  onClick={() => handleDelete(m.id)}
                  title="Delete memory"
                  className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-semantic-error/15 text-text-muted hover:text-semantic-error transition-all"
                >
                  <Trash2 size={13} />
                </button>
              </div>

              <p className="text-sm text-text leading-relaxed font-sans select-text">
                {m.content}
              </p>
            </div>

            <div className="mt-4 pt-2 border-t border-surface-border/50 text-[10px] text-text-muted/60 flex items-center justify-end">
              <span>{m.created_at}</span>
            </div>
          </div>
        ))}
        {memories.length === 0 && (
          <div className="col-span-2 py-12 text-center text-text-muted text-xs surface-card rounded-xl">
            No memories stored yet. Add memories to give Jarvis ongoing context about your preferences.
          </div>
        )}
      </div>
    </div>
  );
};
