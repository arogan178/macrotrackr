import { Link } from "@tanstack/react-router";
import React from "react";
import { BackIcon, Button } from "@/components/ui";

const PrivacyPolicyPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden">
      <header className="border-b border-border bg-surface">
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
        <section>
          <div className="max-w-4xl mx-auto">
            <div className="bg-surface backdrop-blur-sm border border-border/50 rounded-2xl p-8 lg:p-10 shadow-primary">
              <h1 className="text-4xl font-bold text-foreground mb-6">
                Privacy Policy
              </h1>

              <p className="text-sm text-foreground/80 mb-8">
                <strong>Last updated:</strong> {new Date().toLocaleDateString()}
              </p>

              <div className="prose prose-lg prose-invert max-w-none">
                <section className="mb-8">
                  <h2 className="text-2xl font-semibold text-foreground mb-3">
                    Information We Collect
                  </h2>
                  <p>
                    We collect information you provide directly to us, such as
                    when you create an account, log nutrition data, or contact
                    us for support.
                  </p>
                  <ul className="list-disc list-inside ml-4 space-y-2">
                    <li>Account information (email, password)</li>
                    <li>Nutrition tracking data (meals, macros, goals)</li>
                    <li>Usage information and preferences</li>
                  </ul>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-semibold text-foreground mb-3">
                    How We Use Your Information
                  </h2>
                  <p>We use the information we collect to:</p>
                  <ul className="list-disc list-inside ml-4 space-y-2">
                    <li>Provide and maintain our service</li>
                    <li>Track your nutrition goals and progress</li>
                    <li>Send you important service notifications</li>
                    <li>Improve our application and user experience</li>
                  </ul>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-semibold text-foreground mb-3">
                    Data Security
                  </h2>
                  <p>
                    We implement appropriate security measures to protect your
                    personal information against unauthorized access,
                    alteration, disclosure, or destruction.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-semibold text-foreground mb-3">
                    Data Retention
                  </h2>
                  <p>
                    We retain your personal information only for as long as
                    necessary to provide our services and fulfill the purposes
                    outlined in this privacy policy.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-semibold text-foreground mb-3">
                    Your Rights
                  </h2>
                  <p>You have the right to:</p>
                  <ul className="list-disc list-inside ml-4 space-y-2">
                    <li>Access your personal data</li>
                    <li>Correct inaccurate data</li>
                    <li>Delete your account and data</li>
                    <li>Export your data</li>
                  </ul>
                </section>

                <section className="mb-2">
                  <h2 className="text-2xl font-semibold text-foreground mb-3">
                    Contact Us
                  </h2>
                  <p>
                    If you have any questions about this Privacy Policy, please
                    contact us at{" "}
                    <a
                      href="mailto:contact@macrotrackr.com"
                      className="text-primary hover:text-primary underline underline-offset-4"
                    >
                      contact@macrotrackr.com
                    </a>
                    .
                  </p>
                </section>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default PrivacyPolicyPage;
