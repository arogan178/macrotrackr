import React from "react";

import AppHeader from "@/components/layout/AppHeader";
import PageShell from "@/components/layout/PageShell";
import Heading from "@/components/ui/Heading";
import BackToTopButton from "@/features/landing/components/BackToTopButton";
import Footer from "@/features/landing/components/Footer";
import { usePageMetadata } from "@/hooks";
import {
  APP_NAME,
  buildCanonicalUrl,
  SUPPORT_EMAIL,
  SUPPORT_EMAIL_MAILTO,
} from "@/utils/appConstants";

/**
 * Public account-deletion page.
 *
 * Google Play requires a URL where users can request deletion of their account
 * and data, reachable **without installing the app**. That is why this is a
 * public marketing route rather than a screen inside Settings: a reviewer, or
 * someone who has already uninstalled, has to be able to read it.
 *
 * The in-app route (Settings → Delete account) does the deletion itself; this
 * page documents it and gives an email fallback for people who can no longer
 * sign in.
 */
const DeleteAccountPage: React.FC = () => {
  usePageMetadata({
    title: `Delete your account — ${APP_NAME}`,
    description: `How to permanently delete your ${APP_NAME} account and all associated data, what is removed, and what is kept.`,
    canonical: buildCanonicalUrl("/delete-account"),
  });

  return (
    <div className="min-h-screen bg-background">
      <AppHeader mode="minimal" />
      <PageShell>
        <div className="mx-auto max-w-3xl px-4 py-16">
          <Heading level="display" as="h1" className="mb-3">
            Delete your account
          </Heading>
          <p className="mb-10 text-lg text-muted">
            You can delete your {APP_NAME} account and everything in it at any
            time. Deletion is immediate and cannot be undone.
          </p>

          <section className="mb-10">
            <h2 className="mb-3 text-2xl font-semibold text-foreground">
              From inside the app
            </h2>
            <ol className="list-inside list-decimal space-y-2 text-muted">
              <li>Open {APP_NAME} and sign in.</li>
              <li>
                Go to <strong>Settings → Security</strong>.
              </li>
              <li>
                Choose <strong>Delete account</strong> and confirm.
              </li>
            </ol>
          </section>

          <section className="mb-10">
            <h2 className="mb-3 text-2xl font-semibold text-foreground">
              If you can&apos;t sign in
            </h2>
            <p className="mb-4 leading-relaxed text-muted">
              Email{" "}
              <a
                href={SUPPORT_EMAIL_MAILTO}
                className="text-primary underline underline-offset-4"
              >
                {SUPPORT_EMAIL}
              </a>{" "}
              from the address on the account and ask us to delete it. We will
              confirm and complete the deletion within 30 days.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="mb-3 text-2xl font-semibold text-foreground">
              What gets deleted
            </h2>
            <p className="mb-4 leading-relaxed text-muted">
              Everything tied to your account is removed:
            </p>
            <ul className="list-inside list-disc space-y-2 text-muted">
              <li>Your account, name and email address</li>
              <li>
                Your profile details: date of birth, height, weight, gender and
                activity level
              </li>
              <li>Every logged meal and its macros</li>
              <li>Your weight history, weight goals and macro targets</li>
              <li>Your habits and saved meals</li>
              <li>Your sign-in sessions and saved credentials</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="mb-3 text-2xl font-semibold text-foreground">
              What we keep, and for how long
            </h2>
            <p className="mb-4 leading-relaxed text-muted">
              We keep records of completed payments where the law requires it.
              Tax and accounting rules oblige us to retain transaction records,
              typically for several years depending on jurisdiction. Those
              records are held by our payment providers (Google Play or Stripe)
              and are not linked back to a deleted account beyond what those
              obligations require.
            </p>
            <p className="mb-4 leading-relaxed text-muted">
              Server logs may contain technical entries such as IP addresses for
              a short period for security and abuse prevention. These expire on
              a rolling basis and are not used to reconstruct a deleted account.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="mb-3 text-2xl font-semibold text-foreground">
              If you have an active subscription
            </h2>
            <p className="mb-4 leading-relaxed text-muted">
              Cancel it before deleting your account, otherwise you may continue
              to be billed for a subscription with no account attached. Cancel
              in <strong>Google Play</strong> if you subscribed on Android, or
              through the billing portal in Settings if you subscribed on the
              web. Deletion is blocked while a subscription is active.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-semibold text-foreground">
              Prefer to export first?
            </h2>
            <p className="leading-relaxed text-muted">
              You can export your data as CSV from the app before deleting.
              Once the account is gone we cannot recover it for you.
            </p>
          </section>
        </div>
      </PageShell>

      <Footer />
      <BackToTopButton label="Back to top" className="bottom-32 sm:bottom-28" />
    </div>
  );
};

export default DeleteAccountPage;
