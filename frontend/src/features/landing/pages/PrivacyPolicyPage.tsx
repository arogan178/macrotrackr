import { Link } from "@tanstack/react-router";
import React from "react";

import LogoButton from "@/components/layout/LogoButton";
import { BackIcon, Button } from "@/components/ui";
import PageBackground from "@/features/landing/components/PageBackground";

const PrivacyPolicyPage: React.FC = () => {
  return (
    <div className="relative min-h-screen overflow-hidden text-foreground">
      <PageBackground />
      <header className="border-b border-border bg-surface">
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
        <section>
          <div className="mx-auto max-w-4xl">
            <div className="rounded-xl border border-border bg-surface p-8 lg:p-10">
              <h1 className="mb-6 text-4xl font-bold text-foreground">
                Privacy Policy
              </h1>

              <p className="mb-8 text-sm text-foreground/80">
                <strong>Last updated:</strong> {new Date().toLocaleDateString()}
              </p>

              <div className="prose prose-lg prose-invert max-w-none">
                <section className="mb-8">
                  <h2 className="mb-3 text-2xl font-semibold text-foreground">
                    Information We Collect
                  </h2>
                  <p>
                    We collect information you provide directly to us, such as
                    when you create an account, log nutrition data, or contact
                    us for support.
                  </p>
                  <ul className="ml-4 list-inside list-disc space-y-2">
                    <li>Account information (email, password)</li>
                    <li>Nutrition tracking data (meals, macros, goals)</li>
                    <li>Usage information and preferences</li>
                  </ul>
                </section>

                <section className="mb-8">
                  <h2 className="mb-3 text-2xl font-semibold text-foreground">
                    How We Use Your Information
                  </h2>
                  <p>We use the information we collect to:</p>
                  <ul className="ml-4 list-inside list-disc space-y-2">
                    <li>Provide and maintain our service</li>
                    <li>Track your nutrition goals and progress</li>
                    <li>Send you important service notifications</li>
                    <li>Improve our application and user experience</li>
                  </ul>
                </section>

                <section className="mb-8">
                  <h2 className="mb-3 text-2xl font-semibold text-foreground">
                    Data Security
                  </h2>
                  <p>
                    We implement appropriate security measures to protect your
                    personal information against unauthorized access,
                    alteration, disclosure, or destruction.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="mb-3 text-2xl font-semibold text-foreground">
                    Data Retention
                  </h2>
                  <p>
                    We retain your personal information only for as long as
                    necessary to provide our services and fulfill the purposes
                    outlined in this privacy policy.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="mb-3 text-2xl font-semibold text-foreground">
                    Your Rights
                  </h2>
                  <p>You have the right to:</p>
                  <ul className="ml-4 list-inside list-disc space-y-2">
                    <li>Access your personal data</li>
                    <li>Correct inaccurate data</li>
                    <li>Delete your account and data</li>
                    <li>Export your data</li>
                  </ul>
                </section>

                <section className="mb-2">
                  <h2 className="mb-3 text-2xl font-semibold text-foreground">
                    Contact Us
                  </h2>
                  <p>
                    If you have any questions about this Privacy Policy, please
                    contact us at{" "}
                    <a
                      href="mailto:contact@macrotrackr.com"
                      className="text-primary underline underline-offset-4 hover:text-primary"
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
