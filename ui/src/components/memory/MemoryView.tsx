import React, { useState, useEffect } from 'react';
import {
  BrainCircuit,
  Plus,
  Trash2,
  Bookmark,
  Tag,
  Sparkles,
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
    <div className="flex-1 h-full overflow-y-auto p-6 md:p-8 space-y-6 cyber-grid select-none">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-display font-bold tracking-wider text-zinc-100 uppercase flex items-center gap-2">
            <BrainCircuit className="text-cyan-neon" size={20} />
            Persistent Memory Core
          </h2>
          <p className="text-xs font-mono text-zinc-400 mt-0.5">
            Learned knowledge, user preferences, and historical facts retained across sessions
          </p>
        </div>

        <button
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-obsidian-950 text-xs font-semibold font-mono transition-all shadow-neon-cyan"
        >
          <Plus size={14} />
          <span>STORE KNOWLEDGE</span>
        </button>
      </div>

      {/* Add Memory Drawer */}
      {isAdding && (
        <form onSubmit={handleAdd} className="glass-panel p-5 rounded-2xl border-cyan-neon/30 space-y-4">
          <h3 className="text-xs font-mono tracking-wider text-cyan-neon uppercase">
            Inject New Memory Record
          </h3>

          <div>
            <textarea
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder="e.g. 'User prefers code examples written in TypeScript with strict null checks.'"
              className="w-full h-24 bg-white/[0.03] border border-white/10 rounded-xl p-3 text-sm text-zinc-100 placeholder-zinc-500 outline-none focus:border-cyan-neon/50 font-sans"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-zinc-400">Category:</span>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="bg-obsidian-900 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-zinc-200 outline-none font-mono"
              >
                <option value="preferences">User Preferences</option>
                <option value="projects">Projects & Tasks</option>
                <option value="facts">Important Facts</option>
                <option value="general">General</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-3 py-1.5 rounded-lg hover:bg-white/5 text-zinc-400 text-xs font-mono"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-cyan-500 text-obsidian-950 font-semibold text-xs font-mono hover:bg-cyan-400 transition-all"
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
            className="glass-panel p-4 rounded-xl border-white/10 hover:border-cyan-neon/30 transition-all group relative flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-neon/20 text-[10px] font-mono text-cyan-neon flex items-center gap-1">
                  <Tag size={10} />
                  {m.category}
                </span>

                <button
                  onClick={() => handleDelete(m.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-rose-500/20 text-zinc-500 hover:text-rose-400 transition-all"
                >
                  <Trash2 size={13} />
                </button>
              </div>

              <p className="text-sm text-zinc-200 leading-relaxed font-sans select-text">
                {m.content}
              </p>
            </div>

            <div className="mt-4 pt-2 border-t border-white/[0.04] text-[9px] font-mono text-zinc-500 flex items-center justify-between">
              <span>ID: {m.id}</span>
              <span>{m.created_at}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
