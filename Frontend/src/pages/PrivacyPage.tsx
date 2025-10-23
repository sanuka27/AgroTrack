import React, { useEffect } from 'react';
import { Shield, Eye, Database, Lock } from 'lucide-react';

const PrivacyPage = () => {
  useEffect(() => {
    document.title = 'Privacy Policy - AgroTrack';
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,hsl(120_100%_25%/0.05),transparent_70%)] pointer-events-none"></div>

      <main role="main" className="relative container mx-auto max-w-4xl px-4 py-16">
        {/* Header Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center space-x-2 bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Shield className="w-4 h-4" />
            <span>Privacy Policy</span>
          </div>
          <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
            Your Privacy
            <span className="bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent"> Matters to Us</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            This policy explains how we collect, use, and protect your information when you use AgroTrack.
          </p>
        </div>

        <div className="space-y-8">
          {/* Introduction Banner */}
          <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-2xl p-6">
            <p className="text-green-800 text-lg font-medium">
              <strong>Your privacy matters to us.</strong> This policy explains how we collect, use, and protect
              your information when you use AgroTrack. We've written it in plain English to make it easy to understand.
            </p>
          </div>

          {/* What Information We Collect */}
          <section className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-white/20">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                <Eye className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">What Information We Collect</h2>
            </div>

            <div className="space-y-6">
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Account Information</h3>
                <p className="text-gray-600 leading-relaxed">
                  When you create an account, we collect your email address, name, and password.
                  This helps us provide personalized plant care recommendations.
                </p>
              </div>

              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Photos You Upload</h3>
                <p className="text-gray-600 leading-relaxed">
                  Plant photos you share with us for identification and disease detection.
                  These images are processed by our AI but remain your property.
                </p>
              </div>

              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Device & Usage Data</h3>
                <p className="text-gray-600 leading-relaxed">
                  Basic information about how you use our app (features clicked, time spent)
                  and your device (type, operating system) to improve our service.
                </p>
              </div>
            </div>
          </section>

          {/* How We Use Information */}
          <section className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-white/20">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">How We Use Your Information</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                <p className="text-green-800 text-sm font-medium">Plant identification & disease analysis</p>
                <p className="text-green-700 text-xs mt-1">Processing your photos through our AI systems</p>
              </div>
              <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                <p className="text-green-800 text-sm font-medium">Personalized notifications</p>
                <p className="text-green-700 text-xs mt-1">Sending watering reminders and care tips</p>
              </div>
              <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                <p className="text-green-800 text-sm font-medium">Service improvement</p>
                <p className="text-green-700 text-xs mt-1">Analytics to understand what features are most helpful</p>
              </div>
              <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                <p className="text-green-800 text-sm font-medium">Account management</p>
                <p className="text-green-700 text-xs mt-1">Keeping your profile secure and up-to-date</p>
              </div>
            </div>
          </section>

          {/* Cookies & Tracking */}
          <section className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-white/20">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Cookies & Tracking</h2>
            <p className="text-gray-600 leading-relaxed mb-6 text-lg">
              We use cookies for essential functions (keeping you logged in) and analytics
              (understanding how people use AgroTrack). You can disable non-essential cookies
              in your browser settings.
            </p>

            <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-xl p-6">
              <p className="text-green-800 text-sm font-medium">
                <strong>Opt-out option:</strong> You can turn off analytics cookies anytime without
                affecting core features like plant identification.
              </p>
            </div>
          </section>

          {/* Information Sharing */}
          <section className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-white/20">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Information Sharing</h2>
            <p className="text-gray-600 leading-relaxed mb-6 text-lg">
              We work with trusted service providers for hosting, authentication, and analytics.
              These partners can only use your data to provide services to us.
            </p>

            <div className="bg-red-50 border border-red-200 rounded-xl p-6">
              <p className="text-red-800 text-sm font-medium">
                <strong>We do NOT sell your data.</strong> Your plant photos and personal information
                are never sold to advertisers or third parties.
              </p>
            </div>
          </section>

          {/* Data Retention & Deletion */}
          <section className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-white/20">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Database className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Data Retention & Deletion</h2>
            </div>
            <p className="text-gray-600 leading-relaxed mb-4 text-lg">
              We keep your data as long as your account is active. When you delete your account,
              we remove your personal information within 30 days.
            </p>
            <p className="text-gray-600 leading-relaxed">
              To request data deletion, contact us at{' '}
              <a href="mailto:support@agrotrack.lk?subject=Data%20Deletion%20Request" className="text-green-600 hover:text-green-700 font-medium transition-colors">
                support@agrotrack.lk
              </a> with "Data Deletion Request" in the subject line.
            </p>
          </section>

          {/* Security */}
          <section className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-white/20">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                <Lock className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Security</h2>
            </div>
            <p className="text-gray-600 leading-relaxed mb-4 text-lg">
              We use industry-standard security measures including encryption, secure servers,
              and regular security audits to protect your information.
            </p>
            <p className="text-gray-600 leading-relaxed">
              However, no method of transmission over the internet is 100% secure.
              We continuously work to improve our security practices.
            </p>
          </section>

          {/* Children & International */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <section className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Children's Privacy</h2>
              <p className="text-gray-600 leading-relaxed">
                AgroTrack is intended for users aged 13 and older. We don't knowingly collect
                personal information from children under 13. If we discover such information,
                we'll delete it promptly.
              </p>
            </section>

            <section className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
              <h2 className="text-xl font-bold text-gray-900 mb-4">International Data Transfers</h2>
              <p className="text-gray-600 leading-relaxed">
                Our servers may be located outside Sri Lanka for better service quality.
                When we transfer your data internationally, we ensure it receives the same
                level of protection as described in this policy.
              </p>
            </section>
          </div>

          {/* Contact */}
          <section className="bg-gradient-to-r from-green-600 to-blue-600 rounded-2xl p-8 text-white">
            <h2 className="text-2xl font-bold mb-6">Contact Us</h2>
            <p className="text-green-100 leading-relaxed mb-6 text-lg">
              If you have questions about this privacy policy or how we handle your data, please contact us:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <p className="text-green-100 text-sm mb-1">📧 Email</p>
                <a href="mailto:support@agrotrack.lk" className="text-white hover:text-green-200 font-medium transition-colors">
                  support@agrotrack.lk
                </a>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <p className="text-green-100 text-sm mb-1">📞 Phone</p>
                <a href="tel:+94771234567" className="text-white hover:text-green-200 font-medium transition-colors">
                  +94 77 123 4567
                </a>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <p className="text-green-100 text-sm mb-1">📍 Address</p>
                <p className="text-white font-medium">123 Galle Road, Colombo 03, Sri Lanka</p>
              </div>
            </div>
          </section>

          {/* Legal Reference */}
          <section className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-amber-900 mb-4">Legal Framework</h2>
            <p className="text-amber-800 leading-relaxed">
              This privacy policy aligns with Sri Lanka's Personal Data Protection Act (PDPA) concepts
              and international best practices for data protection.
            </p>

            <div className="bg-amber-100 border border-amber-300 rounded-xl p-4 mt-4">
              <p className="text-amber-900 text-sm font-medium">
                <strong>Legal Notice:</strong> This policy provides general information and is not
                intended as legal advice. For specific legal questions, please consult a qualified attorney.
              </p>
            </div>
          </section>
        </div>

        <footer className="mt-16 pt-8 border-t border-gray-200 text-center">
          <p className="text-sm text-gray-500">Last updated: 2025-08-24</p>
        </footer>
      </main>
    </div>
  );
};

export default PrivacyPage;
