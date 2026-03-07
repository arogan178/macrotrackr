import { useNavigate } from "@tanstack/react-router";
import type { ReactNode } from "react";

import CardContainer from "@/components/form/CardContainer";
import LogoButton from "@/components/layout/LogoButton";
import PageBackground from "@/components/layout/PageBackground";

interface AuthPageShellProps {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
  panelClassName?: string;
}

export default function AuthPageShell({
  eyebrow,
  title,
  description,
  children,
  panelClassName = "max-w-md",
}: AuthPageShellProps) {
  const navigate = useNavigate();

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden text-foreground">
      <PageBackground />
      <header className="fixed inset-x-0 top-4 z-50 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="flex min-h-14 items-center justify-between rounded-2xl border border-border/70 bg-background/85 px-4 shadow-lg shadow-black/5 backdrop-blur-md transition-colors duration-200 supports-backdrop-filter:bg-background/75 sm:px-6">
            <LogoButton
              compact
              onClick={() => navigate({ to: "/" })}
              ariaLabel="Home"
            />
          </div>
        </div>
      </header>

      <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-12 pt-32 sm:px-6 lg:px-8">
        <section className="flex w-full flex-col items-center justify-center">
          <div className={`w-full ${panelClassName}`}>
            <div className="mb-5 px-1 text-center">
              <p className="text-[11px] font-semibold tracking-[0.18em] text-primary uppercase">
                {eyebrow}
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
                {title}
              </h1>
              <p className="mt-2 text-sm text-muted">{description}</p>
            </div>
            <CardContainer className="bg-surface p-8">{children}</CardContainer>
          </div>
        </section>
      </main>
    </div>
  );
}
