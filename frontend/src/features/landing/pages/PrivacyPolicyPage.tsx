import React from "react";

import PageBackground from "@/components/layout/PageBackground";
import BackToTopButton from "@/features/landing/components/BackToTopButton";
import Footer from "@/features/landing/components/Footer";
import LegalHeader from "@/features/landing/components/LegalHeader";

const PrivacyPolicyPage: React.FC = () => {
  return (
    <div className="relative min-h-screen overflow-hidden text-foreground selection:bg-primary/30">
      <PageBackground />
      <LegalHeader />

      <main className="relative z-10 px-4 pt-24 pb-14 sm:px-6 sm:pt-28 lg:px-8">
        <section>
          <div className="mx-auto max-w-4xl">
            <div className="rounded-3xl border border-border/70 bg-background/70 p-8 shadow-2xl shadow-black/10 backdrop-blur-sm lg:p-10">
              <h1 className="mb-6 text-4xl font-bold text-foreground">
                Privacy Policy
              </h1>

              <p className="mb-8 text-sm text-foreground/80">
                <strong>Last updated:</strong> {new Date().toLocaleDateString()}
              </p>

              <div className="prose prose-lg prose-headings:text-foreground prose-p:text-foreground/85 prose-li:text-foreground/85 prose-strong:text-foreground prose-a:text-primary dark:prose-invert max-w-none">
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

      <Footer />
      <BackToTopButton label="Back to top" className="bottom-32 sm:bottom-28" />
    </div>
  );
};

export default PrivacyPolicyPage;
