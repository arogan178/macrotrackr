import type { ReactNode } from "react";

import AppHeader from "@/components/layout/AppHeader";
import Heading from "@/components/ui/Heading";
import Panel from "@/components/ui/Panel";

interface AuthPageShellProps {
  title: string;
  description: string;
  children: ReactNode;
  panelClassName?: string;
}

export default function AuthPageShell({
  title,
  description,
  children,
  panelClassName = "max-w-md",
}: AuthPageShellProps) {
  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden text-foreground">
      <AppHeader mode="minimal" />

      <main className="relative z-10 flex flex-1 items-center justify-center px-4 pt-[var(--header-offset)] pb-[var(--page-shell-pb)] sm:px-6 lg:px-8">
        <section className="flex w-full flex-col items-center justify-center">
          <div className={`w-full ${panelClassName}`}>
            <div className="mb-5 px-1 text-center">
              <Heading level="page" as="h1">
                {title}
              </Heading>
              <p className="mt-2 text-sm text-muted">{description}</p>
            </div>
            {/* Boxed at every width: a short form flat on the page read as
                loose words, and the panel is what groups it. */}
            <Panel className="sm:p-2">
              {children}
            </Panel>
          </div>
        </section>
      </main>
    </div>
  );
}
