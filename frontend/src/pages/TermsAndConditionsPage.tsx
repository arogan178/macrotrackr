import React from "react";
import { Link } from "react-router-dom";

const TermsAndConditionsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-900 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900/20 to-indigo-900/30"></div>
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_30%_20%,rgba(120,119,198,0.3),transparent_50%)]"></div>
        <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_80%,rgba(67,56,202,0.2),transparent_50%)]"></div>
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-slate-800/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <Link to="/" className="flex items-center">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-white via-blue-100 to-indigo-200 text-transparent bg-clip-text">
                MacroTrackr
              </h1>
            </Link>
            <Link
              to="/"
              className="text-slate-400 hover:text-white transition-colors"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="relative z-10 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-3xl p-8 lg:p-12">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-slate-300 text-transparent bg-clip-text mb-8">
              Terms and Conditions
            </h1>

            <div className="prose prose-invert prose-slate max-w-none">
              <p className="text-slate-300 text-lg mb-8">
                Last updated: {new Date().toLocaleDateString()}
              </p>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-white mb-4">
                  1. Acceptance of Terms
                </h2>
                <p className="text-slate-300 leading-relaxed mb-4">
                  By accessing and using MacroTrackr ("the Service"), you accept
                  and agree to be bound by the terms and provision of this
                  agreement. If you do not agree to abide by the above, please
                  do not use this service.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-white mb-4">
                  2. Description of Service
                </h2>
                <p className="text-slate-300 leading-relaxed mb-4">
                  MacroTrackr is a nutrition and macro tracking application that
                  allows users to log meals, track macronutrients, set fitness
                  goals, and monitor their progress. The service includes both
                  free and premium features.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-white mb-4">
                  3. User Accounts
                </h2>
                <p className="text-slate-300 leading-relaxed mb-4">
                  To access certain features of the Service, you may be required
                  to create an account. You are responsible for:
                </p>
                <ul className="list-disc list-inside text-slate-300 space-y-2 mb-4">
                  <li>
                    Maintaining the confidentiality of your account credentials
                  </li>
                  <li>All activities that occur under your account</li>
                  <li>Providing accurate and up-to-date information</li>
                  <li>Notifying us immediately of any unauthorized use</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-white mb-4">
                  4. Privacy Policy
                </h2>
                <p className="text-slate-300 leading-relaxed mb-4">
                  Your privacy is important to us. Our Privacy Policy explains
                  how we collect, use, and protect your information when you use
                  our Service. By using our Service, you agree to the collection
                  and use of information in accordance with our Privacy Policy.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-white mb-4">
                  5. Subscription and Billing
                </h2>
                <p className="text-slate-300 leading-relaxed mb-4">
                  Pro features require a paid subscription. By subscribing, you
                  agree to:
                </p>
                <ul className="list-disc list-inside text-slate-300 space-y-2 mb-4">
                  <li>Pay all fees associated with your subscription</li>
                  <li>Automatic renewal unless cancelled</li>
                  <li>No refunds for partial subscription periods</li>
                  <li>Price changes with 30 days notice</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-white mb-4">
                  6. Acceptable Use
                </h2>
                <p className="text-slate-300 leading-relaxed mb-4">
                  You agree not to use the Service to:
                </p>
                <ul className="list-disc list-inside text-slate-300 space-y-2 mb-4">
                  <li>Upload harmful, offensive, or illegal content</li>
                  <li>Attempt to gain unauthorized access to our systems</li>
                  <li>Interfere with the proper functioning of the Service</li>
                  <li>Violate any applicable laws or regulations</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-white mb-4">
                  7. Health Disclaimer
                </h2>
                <p className="text-slate-300 leading-relaxed mb-4">
                  MacroTrackr is not a medical service and should not be used as
                  a substitute for professional medical advice. Always consult
                  with healthcare professionals before making significant
                  changes to your diet or exercise routine.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-white mb-4">
                  8. Limitation of Liability
                </h2>
                <p className="text-slate-300 leading-relaxed mb-4">
                  In no event shall MacroTrackr be liable for any indirect,
                  incidental, special, consequential, or punitive damages,
                  including without limitation, loss of profits, data, use,
                  goodwill, or other intangible losses.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-white mb-4">
                  9. Data Ownership and Export
                </h2>
                <p className="text-slate-300 leading-relaxed mb-4">
                  You retain ownership of all data you input into MacroTrackr.
                  You may export your data at any time through your account
                  settings. Upon account deletion, your data will be permanently
                  removed from our systems within 30 days.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-white mb-4">
                  10. Termination
                </h2>
                <p className="text-slate-300 leading-relaxed mb-4">
                  We may terminate or suspend your account at any time for
                  violation of these terms. You may also delete your account at
                  any time through your account settings.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-white mb-4">
                  11. Changes to Terms
                </h2>
                <p className="text-slate-300 leading-relaxed mb-4">
                  We reserve the right to modify these terms at any time. We
                  will notify users of any material changes via email or through
                  the Service. Continued use of the Service after changes
                  constitutes acceptance of the new terms.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-white mb-4">
                  12. Governing Law
                </h2>
                <p className="text-slate-300 leading-relaxed mb-4">
                  These terms shall be governed by and construed in accordance
                  with the laws of the jurisdiction in which MacroTrackr
                  operates, without regard to its conflict of law provisions.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-white mb-4">
                  13. Contact Information
                </h2>
                <p className="text-slate-300 leading-relaxed mb-4">
                  If you have any questions about these Terms and Conditions,
                  please contact us at:
                </p>
                <div className="bg-slate-700/50 rounded-lg p-4 text-slate-300">
                  <p>Website: www.macrotrackr.com</p>
                  <p>Email: contact@macrotrackr.com</p>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsAndConditionsPage;
