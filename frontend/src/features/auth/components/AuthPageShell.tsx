import type { ReactNode } from "react";

import CardContainer from "@/components/form/CardContainer";
import AppHeader from "@/components/layout/AppHeader";
import PageBackground from "@/components/layout/PageBackground";

interface AuthPageShellProps {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
  panelClassName?: string;
  showBackToHome?: boolean;
}

export default function AuthPageShell({
  eyebrow,
  title,
  description,
  children,
  panelClassName = "max-w-md",
  showBackToHome = true,
}: AuthPageShellProps) {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden text-foreground">
      <PageBackground />
      <AppHeader mode="minimal" showBackToHome={showBackToHome} />

      <main className="relative z-10 flex flex-1 items-center justify-center px-4 pt-[var(--header-offset)] pb-[calc(3rem+var(--sab))] sm:px-6 lg:px-8">
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
