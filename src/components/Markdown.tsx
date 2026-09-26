import ReactMarkdown, { type Components } from "react-markdown";

// Tailwind の preflight で見出しやリストの装飾が消えるため、要素ごとにクラスを当てる
// 生の HTML は react-markdown が描画しないので、管理者の入力でもスクリプトは埋め込まれない
const components: Components = {
  h1: ({ children }) => (
    <h2 className="mt-3 text-base font-bold text-slate-800 first:mt-0">{children}</h2>
  ),
  h2: ({ children }) => <h3 className="mt-3 font-bold text-slate-800 first:mt-0">{children}</h3>,
  h3: ({ children }) => <h4 className="mt-3 font-medium text-slate-800 first:mt-0">{children}</h4>,
  p: ({ children }) => <p className="mt-2 first:mt-0">{children}</p>,
  strong: ({ children }) => <strong className="font-medium text-slate-800">{children}</strong>,
  ul: ({ children }) => <ul className="mt-2 list-disc space-y-1 pl-5">{children}</ul>,
  ol: ({ children }) => <ol className="mt-2 list-decimal space-y-1 pl-5">{children}</ol>,
  a: ({ href, children }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-sky-700 underline">
      {children}
    </a>
  ),
  code: ({ children }) => <code className="rounded bg-slate-100 px-1 font-mono">{children}</code>,
  hr: () => <hr className="my-3 border-slate-200" />,
  blockquote: ({ children }) => (
    <blockquote className="mt-2 border-l-4 border-slate-200 pl-3 text-slate-500">
      {children}
    </blockquote>
  ),
};

export default function Markdown({ children }: { children: string }) {
  return <ReactMarkdown components={components}>{children}</ReactMarkdown>;
}
