import React from "react";

import { ContentImage } from "@/components/ui";

interface MarkdownComponentsOptions {
  CodeBlock: React.ComponentType<{
    inline?: boolean;
    className?: string;
    children?: React.ReactNode;
  }>;
}

export function createMarkdownComponents({ CodeBlock }: MarkdownComponentsOptions) {
  return {
    h1: ({ children, id }: { children?: React.ReactNode; id?: string }) => (
      <h1
        id={id}
        className="mt-14 scroll-mt-32 text-3xl font-semibold tracking-tight text-foreground first:mt-0 sm:text-[2.25rem]"
      >
        {children}
      </h1>
    ),
    h2: ({ children, id }: { children?: React.ReactNode; id?: string }) => (
      <h2
        id={id}
        className="mt-14 scroll-mt-32 text-2xl font-semibold tracking-tight text-foreground sm:text-[2rem]"
      >
        {children}
      </h2>
    ),
    h3: ({ children, id }: { children?: React.ReactNode; id?: string }) => (
      <h3
        id={id}
        className="mt-10 scroll-mt-32 text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
      >
        {children}
      </h3>
    ),
    p: ({ children }: { children?: React.ReactNode }) => (
      <p className="mb-7 text-[1.05rem] leading-8 text-foreground/88 sm:text-[1.1rem] sm:leading-9">
        {children}
      </p>
    ),
    ul: ({ children }: { children?: React.ReactNode }) => (
      <ul className="mb-8 list-outside list-disc space-y-3 pl-6 marker:text-primary">
        {children}
      </ul>
    ),
    ol: ({ children }: { children?: React.ReactNode }) => (
      <ol className="mb-8 list-outside list-decimal space-y-3 pl-6 marker:text-primary">
        {children}
      </ol>
    ),
    li: ({ children }: { children?: React.ReactNode }) => (
      <li className="pl-1 text-[1.02rem] leading-8 text-foreground/88">
        {children}
      </li>
    ),
    a: ({ href, children }: { href?: string; children?: React.ReactNode }) => (
      <a
        href={href}
        className="text-primary underline underline-offset-2 transition-colors hover:text-primary/80"
        target={href?.startsWith("http") ? "_blank" : undefined}
        rel={href?.startsWith("http") ? "noopener noreferrer" : undefined}
      >
        {children}
      </a>
    ),
    strong: ({ children }: { children?: React.ReactNode }) => (
      <strong className="font-semibold text-foreground">{children}</strong>
    ),
    blockquote: ({ children }: { children?: React.ReactNode }) => (
      <blockquote className="my-10 rounded-3xl border border-primary/20 bg-primary/6 px-6 py-5 text-lg leading-8 text-foreground/82 italic shadow-sm">
        {children}
      </blockquote>
    ),
    code: ({
      inline,
      className,
      children,
    }: {
      inline?: boolean;
      className?: string;
      children?: React.ReactNode;
    }) => (
      <CodeBlock inline={inline} className={className}>
        {children}
      </CodeBlock>
    ),
    img: ({ src, alt }: { src?: string; alt?: string }) => (
      <ContentImage
        src={src}
        alt={alt ?? ""}
        containerClassName="my-10 overflow-hidden rounded-3xl shadow-xl ring-1 ring-border/50"
        className="w-full rounded-lg"
        loading="lazy"
      />
    ),
    table: ({ children }: { children?: React.ReactNode }) => (
      <div className="my-6 overflow-x-auto rounded-lg border border-border/60">
        <table className="w-full border-collapse text-sm">{children}</table>
      </div>
    ),
    thead: ({ children }: { children?: React.ReactNode }) => (
      <thead className="bg-surface-2">{children}</thead>
    ),
    th: ({ children }: { children?: React.ReactNode }) => (
      <th className="border-b border-border px-4 py-3 text-left font-semibold text-foreground">
        {children}
      </th>
    ),
    td: ({ children }: { children?: React.ReactNode }) => (
      <td className="border-b border-border px-4 py-3 text-foreground/90 last:border-b-0">
        {children}
      </td>
    ),
  };
}
