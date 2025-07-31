import { Link } from "@tanstack/react-router";
import React from "react";

import { BackIcon, Button } from "@/components/ui";

const TermsAndConditionsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <header className="border border-border bg-surface">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <Link to="/" className="flex items-center" aria-label="Home">
              <h1 className="text-3xl font-bold text-foreground">
                MacroTrackr
              </h1>
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

      <main className="relative z-10 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-surface backdrop-blur-sm border border-border/50 rounded-2xl p-8 lg:p-12 shadow-primary">
            <h1 className="text-4xl font-bold text-foreground mb-8">
              Terms and Conditions
            </h1>

            <div className="prose prose-invert prose-slate max-w-none">
              <p className="text-foreground text-lg mb-8">
                Last updated: {new Date().toLocaleDateString()}
              </p>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-foreground mb-3">
                  1. Acceptance of Terms
                </h2>
                <p className="text-foreground leading-relaxed mb-4">
                  By accessing and using MacroTrackr, you accept and agree to be
                  bound by these terms. If you do not agree, please do not use
                  the service.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-foreground mb-3">
                  2. Description of Service
                </h2>
                <p className="text-foreground leading-relaxed mb-4">
                  MacroTrackr is a nutrition and macro tracking application that
                  includes free and premium features.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-foreground mb-3">
                  3. User Accounts
                </h2>
                <p className="text-foreground leading-relaxed mb-4">
                  To access certain features, you may be required to create an
                  account. You are responsible for account security and accurate
                  information.
                </p>
                <ul className="list-disc list-inside text-foreground space-y-2 mb-4">
                  <li>Maintain credential confidentiality</li>
                  <li>All activities under your account</li>
                  <li>Provide accurate and up-to-date information</li>
                  <li>Notify us immediately of unauthorized use</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-foreground mb-3">
                  4. Privacy Policy
                </h2>
                <p className="text-foreground leading-relaxed mb-4">
                  Your privacy is important. By using the Service, you agree to
                  our Privacy Policy.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-foreground mb-3">
                  5. Subscription and Billing
                </h2>
                <p className="text-foreground leading-relaxed mb-4">
                  Pro features require a paid subscription. By subscribing, you
                  agree to fees, automatic renewal, and price changes with
                  notice.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-foreground mb-3">
                  6. Acceptable Use
                </h2>
                <p className="text-foreground leading-relaxed mb-4">
                  You agree not to misuse the Service.
                </p>
                <ul className="list-disc list-inside text-foreground space-y-2 mb-4">
                  <li>Do not upload harmful, offensive, or illegal content</li>
                  <li>Do not attempt to gain unauthorized access</li>
                  <li>
                    Do not interfere with the proper functioning of the Service
                  </li>
                  <li>Comply with applicable laws and regulations</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-foreground mb-3">
                  7. Health Disclaimer
                </h2>
                <p className="text-foreground leading-relaxed mb-4">
                  MacroTrackr is not a medical service; consult professionals
                  before significant dietary or exercise changes.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-foreground mb-3">
                  8. Limitation of Liability
                </h2>
                <p className="text-foreground leading-relaxed mb-4">
                  In no event shall MacroTrackr be liable for indirect or
                  consequential damages.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-foreground mb-3">
                  9. Data Ownership and Export
                </h2>
                <p className="text-foreground leading-relaxed mb-4">
                  You retain ownership of your data and may export it. Upon
                  account deletion, data is removed within 30 days.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-foreground mb-3">
                  10. Termination
                </h2>
                <p className="text-foreground leading-relaxed mb-4">
                  We may terminate or suspend your account for violations. You
                  can delete your account at any time.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-foreground mb-3">
                  11. Changes to Terms
                </h2>
                <p className="text-foreground leading-relaxed mb-4">
                  We may modify these terms; continued use indicates acceptance.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-foreground mb-3">
                  12. Governing Law
                </h2>
                <p className="text-foreground leading-relaxed mb-4">
                  These terms are governed by the laws of our operating
                  jurisdiction.
                </p>
              </section>

              <section className="mb-2">
                <h2 className="text-2xl font-semibold text-foreground mb-3">
                  13. Contact Information
                </h2>
                <div className="bg-surface/50 rounded-lg p-4 text-foreground border border-border/50">
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
