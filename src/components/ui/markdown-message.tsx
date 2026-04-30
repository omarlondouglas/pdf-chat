"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function MarkdownMessage({ content }: { content: string }) {
  return (
    <div className="prose-chat">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
          ul: ({ children }) => (
            <ul className="list-disc pl-5 mb-2 space-y-1">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal pl-5 mb-2 space-y-1">{children}</ol>
          ),
          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
          strong: ({ children }) => (
            <strong className="font-semibold text-white">{children}</strong>
          ),
          em: ({ children }) => <em className="italic">{children}</em>,
          h1: ({ children }) => (
            <h1 className="text-lg font-semibold mt-3 mb-2">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-base font-semibold mt-3 mb-2">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-sm font-semibold mt-2 mb-1">{children}</h3>
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 underline underline-offset-2"
            >
              {children}
            </a>
          ),
          code: ({ className, children }) => {
            const isBlock = (className || "").startsWith("language-");
            if (isBlock) {
              return (
                <pre className="my-2 p-3 rounded-lg bg-black/50 border border-white/10 overflow-x-auto text-xs">
                  <code className={className}>{children}</code>
                </pre>
              );
            }
            return (
              <code className="px-1 py-0.5 rounded bg-black/40 text-[0.85em] border border-white/10">
                {children}
              </code>
            );
          },
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-white/20 pl-3 italic text-gray-300 my-2">
              {children}
            </blockquote>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto my-2">
              <table className="min-w-full border border-white/10 text-xs">
                {children}
              </table>
            </div>
          ),
          th: ({ children }) => (
            <th className="px-2 py-1 border-b border-white/10 text-left font-semibold bg-white/5">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-2 py-1 border-b border-white/5">{children}</td>
          ),
          hr: () => <hr className="my-3 border-white/10" />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
