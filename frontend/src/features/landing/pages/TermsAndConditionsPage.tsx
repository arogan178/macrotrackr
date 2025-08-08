import { Link } from "@tanstack/react-router";
import React from "react";

import { BackIcon, Button } from "@/components/ui";
import LogoButton from "@/components/layout/LogoButton";

const TermsAndConditionsPage: React.FC = () => {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <header className="border border-border bg-surface">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <Link to="/" className="flex items-center" aria-label="Home">
              <LogoButton className="h-0" />
            </Link>
            <Link to="/" aria-label="Back to Home">
              <Button
                text="Back to Home"
                variant="ghost"
                buttonSize="sm"
                ariaLabel="Back"
                icon={<BackIcon />}
                iconPosition="left"
              />
            </Link>
          </div>
        </div>
      </header>

      <main className="relative z-10 px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-2xl border border-border/50 bg-surface p-8 shadow-primary backdrop-blur-sm lg:p-12">
            <h1 className="mb-8 text-4xl font-bold text-foreground">
              Terms and Conditions
            </h1>

            <div className="prose prose-invert prose-slate max-w-none">
              <p className="mb-8 text-lg text-foreground">
                Last updated: {new Date().toLocaleDateString()}
              </p>

              <section className="mb-8">
                <h2 className="mb-3 text-2xl font-semibold text-foreground">
                  1. Acceptance of Terms
                </h2>
                <p className="mb-4 leading-relaxed text-foreground">
                  By accessing and using MacroTrackr, you accept and agree to be
                  bound by these terms. If you do not agree, please do not use
                  the service.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="mb-3 text-2xl font-semibold text-foreground">
                  2. Description of Service
                </h2>
                <p className="mb-4 leading-relaxed text-foreground">
                  MacroTrackr is a nutrition and macro tracking application that
                  includes free and premium features.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="mb-3 text-2xl font-semibold text-foreground">
                  3. User Accounts
                </h2>
                <p className="mb-4 leading-relaxed text-foreground">
                  To access certain features, you may be required to create an
                  account. You are responsible for account security and accurate
                  information.
                </p>
                <ul className="mb-4 list-inside list-disc space-y-2 text-foreground">
                  <li>Maintain credential confidentiality</li>
                  <li>All activities under your account</li>
                  <li>Provide accurate and up-to-date information</li>
                  <li>Notify us immediately of unauthorized use</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="mb-3 text-2xl font-semibold text-foreground">
                  4. Privacy Policy
                </h2>
                <p className="mb-4 leading-relaxed text-foreground">
                  Your privacy is important. By using the Service, you agree to
                  our Privacy Policy.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="mb-3 text-2xl font-semibold text-foreground">
                  5. Subscription and Billing
                </h2>
                <p className="mb-4 leading-relaxed text-foreground">
                  Pro features require a paid subscription. By subscribing, you
                  agree to fees, automatic renewal, and price changes with
                  notice.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="mb-3 text-2xl font-semibold text-foreground">
                  6. Acceptable Use
                </h2>
                <p className="mb-4 leading-relaxed text-foreground">
                  You agree not to misuse the Service.
                </p>
                <ul className="mb-4 list-inside list-disc space-y-2 text-foreground">
                  <li>Do not upload harmful, offensive, or illegal content</li>
                  <li>Do not attempt to gain unauthorized access</li>
                  <li>
                    Do not interfere with the proper functioning of the Service
                  </li>
                  <li>Comply with applicable laws and regulations</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="mb-3 text-2xl font-semibold text-foreground">
                  7. Health Disclaimer
                </h2>
                <p className="mb-4 leading-relaxed text-foreground">
                  MacroTrackr is not a medical service; consult professionals
                  before significant dietary or exercise changes.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="mb-3 text-2xl font-semibold text-foreground">
                  8. Limitation of Liability
                </h2>
                <p className="mb-4 leading-relaxed text-foreground">
                  In no event shall MacroTrackr be liable for indirect or
                  consequential damages.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="mb-3 text-2xl font-semibold text-foreground">
                  9. Data Ownership and Export
                </h2>
                <p className="mb-4 leading-relaxed text-foreground">
                  You retain ownership of your data and may export it. Upon
                  account deletion, data is removed within 30 days.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="mb-3 text-2xl font-semibold text-foreground">
                  10. Termination
                </h2>
                <p className="mb-4 leading-relaxed text-foreground">
                  We may terminate or suspend your account for violations. You
                  can delete your account at any time.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="mb-3 text-2xl font-semibold text-foreground">
                  11. Changes to Terms
                </h2>
                <p className="mb-4 leading-relaxed text-foreground">
                  We may modify these terms; continued use indicates acceptance.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="mb-3 text-2xl font-semibold text-foreground">
                  12. Governing Law
                </h2>
                <p className="mb-4 leading-relaxed text-foreground">
                  These terms are governed by the laws of our operating
                  jurisdiction.
                </p>
              </section>

              <section className="mb-2">
                <h2 className="mb-3 text-2xl font-semibold text-foreground">
                  13. Contact Information
                </h2>
                <div className="rounded-lg border border-border/50 bg-surface/50 p-4 text-foreground">
                  <p>Website: www.macrotrackr.com</p>
                  <p>Email: contact@macrotrackr.com</p>
                </div>
              </section>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TermsAndConditionsPage;
