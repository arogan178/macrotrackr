import React from "react";

import AppHeader from "@/components/layout/AppHeader";
import PageShell from "@/components/layout/PageShell";
import BackToTopButton from "@/features/landing/components/BackToTopButton";
import Footer from "@/features/landing/components/Footer";
import { usePageMetadata } from "@/hooks";
import { APP_URL, buildCanonicalUrl, SUPPORT_EMAIL } from "@/utils/appConstants";

const TermsAndConditionsPage: React.FC = () => {
  usePageMetadata({
    title: "Terms and Conditions — MacroTrackr",
    description: "Read the Terms and Conditions for using MacroTrackr, our fitness and nutrition tracking platform.",
    canonical: buildCanonicalUrl("/terms"),
  });

  return (
    <div className="relative min-h-screen overflow-hidden text-foreground selection:bg-primary/30">
      <AppHeader mode="minimal" />

      <PageShell width="prose">
        <div>
          <div className="rounded-card border border-border bg-background p-8 lg:p-12">
            <h1 className="mb-8 text-4xl font-bold text-foreground">
              Terms and Conditions
            </h1>

            <div className="prose prose-slate prose-headings:text-foreground prose-p:text-foreground/85 prose-li:text-foreground/85 prose-strong:text-foreground prose-a:text-primary dark:prose-invert max-w-none">
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
                <p className="mb-4 leading-relaxed text-muted">
                  <strong>You must be 18 or older to create an account.</strong>{" "}
                  MacroTrackr is not intended for children, and we do not
                  knowingly collect information from anyone under 18. If you
                  believe a minor has created an account, contact us and we will
                  remove it.
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
                  <strong>
                    MacroTrackr does not provide medical advice.
                  </strong>{" "}
                  It is a tracking tool, not a medical service, and nothing in
                  it is a diagnosis, treatment, or a substitute for professional
                  care. Consult a qualified healthcare professional before
                  making significant dietary or exercise changes, and
                  particularly before pursuing a calorie deficit.
                </p>
                <p className="mb-4 leading-relaxed text-muted">
                  Calorie and macro targets, along with BMR and TDEE figures,
                  are <strong>estimates</strong> produced by standard formulae
                  from the details you enter. They are not measurements, they
                  are not personalised to your medical history, and they can be
                  wrong for you.
                </p>
                <p className="mb-4 leading-relaxed text-muted">
                  Do not use MacroTrackr if tracking food intake is harmful to
                  you. If you are experiencing disordered eating, or tracking
                  makes your relationship with food worse, please stop and speak
                  to a doctor or a qualified support service.
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
                <div className="rounded-card border border-border bg-surface p-4 text-foreground">
                  <p>Website: {APP_URL}</p>
                  <p>Email: {SUPPORT_EMAIL}</p>
                </div>
              </section>
            </div>
          </div>
        </div>
      </PageShell>

      <Footer />
      <BackToTopButton label="Back to top" className="bottom-32 sm:bottom-28" />
    </div>
  );
};

export default TermsAndConditionsPage;
