import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Copy, Check, Terminal } from 'lucide-react';

interface MarkdownRendererProps {
  content: string;
}

const CodeBlock: React.FC<{ language: string; value: string }> = ({ language, value }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-2.5 rounded-xl border border-white/10 bg-obsidian-900/90 overflow-hidden shadow-lg font-mono">
      <div className="flex items-center justify-between px-3.5 py-1.5 bg-white/[0.03] border-b border-white/[0.06] text-[11px] text-zinc-400">
        <span className="flex items-center gap-1.5 text-cyan-neon font-medium lowercase">
          <Terminal size={12} />
          {language || 'text'}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 text-[10px] text-zinc-400 hover:text-zinc-200 transition-colors p-1 rounded"
          title="Copy code"
        >
          {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>
      <pre className="p-3.5 overflow-x-auto text-xs text-zinc-200 font-mono leading-relaxed select-text">
        <code>{value}</code>
      </pre>
    </div>
  );
};

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  return (
    <div className="markdown-body font-sans text-sm leading-relaxed space-y-2 select-text">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ inline, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || '');
            const codeString = String(children).replace(/\n$/, '');

            if (!inline && (match || codeString.includes('\n'))) {
              return <CodeBlock language={match ? match[1] : ''} value={codeString} />;
            }
            return (
              <code
                className="px-1.5 py-0.5 rounded bg-cyan-500/10 border border-cyan-neon/20 font-mono text-[12px] text-cyan-neon"
                {...props}
              >
                {children}
              </code>
            );
          },
          p({ children }) {
            return <p className="leading-relaxed mb-1.5 last:mb-0">{children}</p>;
          },
          h1({ children }) {
            return (
              <h1 className="text-base font-display font-bold text-zinc-100 mt-3 mb-1.5 tracking-wide text-cyan-neon">
                {children}
              </h1>
            );
          },
          h2({ children }) {
            return (
              <h2 className="text-sm font-display font-semibold text-zinc-100 mt-2.5 mb-1 tracking-wide">
                {children}
              </h2>
            );
          },
          h3({ children }) {
            return (
              <h3 className="text-xs font-display font-semibold text-cyan-glow mt-2 mb-1 uppercase tracking-wider">
                {children}
              </h3>
            );
          },
          ul({ children }) {
            return <ul className="list-disc list-inside space-y-1 my-1 text-zinc-200">{children}</ul>;
          },
          ol({ children }) {
            return <ol className="list-decimal list-inside space-y-1 my-1 text-zinc-200">{children}</ol>;
          },
          li({ children }) {
            return <li className="text-xs leading-relaxed">{children}</li>;
          },
          blockquote({ children }) {
            return (
              <blockquote className="border-l-2 border-cyan-neon/50 pl-3 my-2 text-zinc-300 italic bg-white/[0.02] py-1 rounded-r">
                {children}
              </blockquote>
            );
          },
          table({ children }) {
            return (
              <div className="overflow-x-auto my-3 rounded-xl border border-white/10">
                <table className="min-w-full text-xs text-left text-zinc-200">{children}</table>
              </div>
            );
          },
          thead({ children }) {
            return <thead className="bg-white/[0.04] text-zinc-400 font-mono uppercase text-[10px]">{children}</thead>;
          },
          tbody({ children }) {
            return <tbody className="divide-y divide-white/[0.05]">{children}</tbody>;
          },
          tr({ children }) {
            return <tr className="hover:bg-white/[0.02] transition-colors">{children}</tr>;
          },
          th({ children }) {
            return <th className="px-3 py-2 font-medium">{children}</th>;
          },
          td({ children }) {
            return <td className="px-3 py-2">{children}</td>;
          },
          a({ href, children }) {
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-neon hover:underline inline-flex items-center gap-1"
              >
                {children}
              </a>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};
