import React from "react";

import PageBackground from "@/components/layout/PageBackground";
import BackToTopButton from "@/features/landing/components/BackToTopButton";
import Footer from "@/features/landing/components/Footer";
import LegalHeader from "@/features/landing/components/LegalHeader";

const TermsAndConditionsPage: React.FC = () => {
  return (
    <div className="relative min-h-screen overflow-hidden text-foreground selection:bg-primary/30">
      <PageBackground />
      <LegalHeader />

      <main className="relative z-10 px-4 pt-24 pb-14 sm:px-6 sm:pt-28 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-3xl border border-border/70 bg-background/70 p-8 shadow-2xl shadow-black/10 backdrop-blur-sm lg:p-12">
            <h1 className="mb-8 text-4xl font-bold text-foreground">
              Terms and Conditions
            </h1>

            <div className="prose prose-slate max-w-none prose-headings:text-foreground prose-p:text-foreground/85 prose-li:text-foreground/85 prose-strong:text-foreground prose-a:text-primary dark:prose-invert">
              <p className="mb-8 text-lg text-foreground">
                Last updated: {new Date().toLocaleDateString()}
              </p>

              <section className="mb-8">
                <h2 className="mb-3 text-2xl font-semibold text-foreground">
                  1. Acceptance of Terms
                </h2>
                <p className="mb-4 leading-relaxed text-muted">
                  By accessing and using MacroTrackr, you accept and agree to be
                  bound by these terms. If you do not agree, please do not use
                  the service.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="mb-3 text-2xl font-semibold text-foreground">
                  2. Description of Service
                </h2>
                <p className="mb-4 leading-relaxed text-muted">
                  MacroTrackr is a nutrition and macro tracking application that
                  includes free and premium features.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="mb-3 text-2xl font-semibold text-foreground">
                  3. User Accounts
                </h2>
                <p className="mb-4 leading-relaxed text-muted">
                  To access certain features, you may be required to create an
                  account. You are responsible for account security and accurate
                  information.
                </p>
                <ul className="mb-4 list-inside list-disc space-y-2 text-muted">
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
                <p className="mb-4 leading-relaxed text-muted">
                  Your privacy is important. By using the Service, you agree to
                  our Privacy Policy.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="mb-3 text-2xl font-semibold text-foreground">
                  5. Subscription and Billing
                </h2>
                <p className="mb-4 leading-relaxed text-muted">
                  Pro features require a paid subscription. By subscribing, you
                  agree to fees, automatic renewal, and price changes with
                  notice.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="mb-3 text-2xl font-semibold text-foreground">
                  6. Acceptable Use
                </h2>
                <p className="mb-4 leading-relaxed text-muted">
                  You agree not to misuse the Service.
                </p>
                <ul className="mb-4 list-inside list-disc space-y-2 text-muted">
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
                <p className="mb-4 leading-relaxed text-muted">
                  MacroTrackr is not a medical service; consult professionals
                  before significant dietary or exercise changes.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="mb-3 text-2xl font-semibold text-foreground">
                  8. Limitation of Liability
                </h2>
                <p className="mb-4 leading-relaxed text-muted">
                  In no event shall MacroTrackr be liable for indirect or
                  consequential damages.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="mb-3 text-2xl font-semibold text-foreground">
                  9. Data Ownership and Export
                </h2>
                <p className="mb-4 leading-relaxed text-muted">
                  You retain ownership of your data and may export it. Upon
                  account deletion, data is removed within 30 days.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="mb-3 text-2xl font-semibold text-foreground">
                  10. Termination
                </h2>
                <p className="mb-4 leading-relaxed text-muted">
                  We may terminate or suspend your account for violations. You
                  can delete your account at any time.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="mb-3 text-2xl font-semibold text-foreground">
                  11. Changes to Terms
                </h2>
                <p className="mb-4 leading-relaxed text-muted">
                  We may modify these terms; continued use indicates acceptance.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="mb-3 text-2xl font-semibold text-foreground">
                  12. Governing Law
                </h2>
                <p className="mb-4 leading-relaxed text-muted">
                  These terms are governed by the laws of our operating
                  jurisdiction.
                </p>
              </section>

              <section className="mb-2">
                <h2 className="mb-3 text-2xl font-semibold text-foreground">
                  13. Contact Information
                </h2>
                <div className="rounded-2xl border border-border/70 bg-surface/70 p-4 text-foreground backdrop-blur-sm">
                  <p>Website: www.macrotrackr.com</p>
                  <p>Email: contact@macrotrackr.com</p>
                </div>
              </section>
            </div>
          </div>
        </div>
      </main>

      <Footer />
      <BackToTopButton label="Back to top" className="bottom-32 sm:bottom-28" />
    </div>
  );
};

export default TermsAndConditionsPage;
