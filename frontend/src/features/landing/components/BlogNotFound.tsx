import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

import Footer from "@/features/landing/components/Footer";
import Header from "@/features/landing/components/Header";

export function BlogNotFound() {
  return (
    <div className="relative flex min-h-screen flex-col bg-background text-foreground">
      <Header />
      <main className="relative z-10 mx-auto flex max-w-7xl flex-1 flex-col items-center justify-center px-4 pt-32 pb-24 sm:px-6 lg:px-8">
        <div className="space-y-6 text-center">
          <h1 className="text-4xl font-semibold tracking-tight">
            Article not found
          </h1>
          <p className="text-lg text-muted">
            The link is valid, but the article is no longer in the blog
            archive.
          </p>
          <Link
            to="/blog"
            search={{ category: undefined, tag: undefined, q: undefined }}
            className="group inline-flex min-h-11 items-center gap-2 rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium text-muted transition-colors duration-200 hover:border-primary/40 hover:bg-surface-2 hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            Back to the blog
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
