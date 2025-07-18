import { Link } from "@tanstack/react-router";
import React from "react";

const PrivacyPolicyPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="mb-8">
          <Link
            to="/"
            className="text-indigo-400 hover:text-indigo-300 transition-colors inline-flex items-center"
          >
            ← Back to Home
          </Link>
        </div>

        <h1 className="text-4xl font-bold mb-8 bg-gradient-to-r from-white to-slate-300 text-transparent bg-clip-text">
          Privacy Policy
        </h1>

        <div className="prose prose-lg prose-invert max-w-none">
          <div className="text-slate-300 space-y-6">
            <p className="text-slate-400 mb-8">
              <strong>Last updated:</strong> {new Date().toLocaleDateString()}
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">
                Information We Collect
              </h2>
              <p>
                We collect information you provide directly to us, such as when
                you create an account, log nutrition data, or contact us for
                support.
              </p>
              <ul className="list-disc list-inside ml-4 space-y-2">
                <li>Account information (email, password)</li>
                <li>Nutrition tracking data (meals, macros, goals)</li>
                <li>Usage information and preferences</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">
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
              <h2 className="text-2xl font-semibold text-white mb-4">
                Data Security
              </h2>
              <p>
                We implement appropriate security measures to protect your
                personal information against unauthorized access, alteration,
                disclosure, or destruction.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">
                Data Retention
              </h2>
              <p>
                We retain your personal information only for as long as
                necessary to provide our services and fulfill the purposes
                outlined in this privacy policy.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">
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

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">
                Contact Us
              </h2>
              <p>
                If you have any questions about this Privacy Policy, please
                contact us at:{" "}
                <a
                  href="mailto:contact@macrotrackr.com"
                  className="text-indigo-400 hover:text-indigo-300"
                >
                  contact@macrotrackr.com
                </a>
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;
