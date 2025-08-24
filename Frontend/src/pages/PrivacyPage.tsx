import React, { useEffect } from 'react';

const PrivacyPage = () => {
  useEffect(() => {
    document.title = 'Privacy Policy - AgroTrack';
  }, []);

  return (
    <main role="main" className="container mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-4xl font-bold text-gray-900 mb-8">Privacy Policy</h1>
      
      <div className="space-y-8">
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
          <p className="text-emerald-800 text-sm">
            <strong>Your privacy matters to us.</strong> This policy explains how we collect, use, and protect 
            your information when you use AgroTrack. We've written it in plain English to make it easy to understand.
          </p>
        </div>

        {/* What Information We Collect */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">What Information We Collect</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium text-gray-700 mb-2">Account Information</h3>
              <p className="text-gray-600 leading-relaxed">
                When you create an account, we collect your email address, name, and password. 
                This helps us provide personalized plant care recommendations.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-gray-700 mb-2">Photos You Upload</h3>
              <p className="text-gray-600 leading-relaxed">
                Plant photos you share with us for identification and disease detection. 
                These images are processed by our AI but remain your property.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-gray-700 mb-2">Device & Usage Data</h3>
              <p className="text-gray-600 leading-relaxed">
                Basic information about how you use our app (features clicked, time spent) 
                and your device (type, operating system) to improve our service.
              </p>
            </div>
          </div>
        </section>

        {/* How We Use Information */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">How We Use Your Information</h2>
          
          <ul className="list-disc list-inside text-gray-600 space-y-2">
            <li><strong>Plant identification & disease analysis:</strong> Processing your photos through our AI systems</li>
            <li><strong>Personalized notifications:</strong> Sending watering reminders and care tips</li>
            <li><strong>Service improvement:</strong> Analytics to understand what features are most helpful</li>
            <li><strong>Account management:</strong> Keeping your profile secure and up-to-date</li>
            <li><strong>Customer support:</strong> Helping you when you contact us with questions</li>
          </ul>
        </section>

        {/* Cookies & Tracking */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Cookies & Tracking</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            We use cookies for essential functions (keeping you logged in) and analytics 
            (understanding how people use AgroTrack). You can disable non-essential cookies 
            in your browser settings.
          </p>
          
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
            <p className="text-emerald-800 text-sm">
              <strong>Opt-out option:</strong> You can turn off analytics cookies anytime without 
              affecting core features like plant identification.
            </p>
          </div>
        </section>

        {/* Information Sharing */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Information Sharing</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            We work with trusted service providers for hosting, authentication, and analytics. 
            These partners can only use your data to provide services to us.
          </p>
          
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800 text-sm font-medium">
              <strong>We do NOT sell your data.</strong> Your plant photos and personal information 
              are never sold to advertisers or third parties.
            </p>
          </div>
        </section>

        {/* Data Retention & Deletion */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Data Retention & Deletion</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            We keep your data as long as your account is active. When you delete your account, 
            we remove your personal information within 30 days.
          </p>
          <p className="text-gray-600 leading-relaxed">
            To request data deletion, contact us at{' '}
            <a href="mailto:support@agrotrack.lk?subject=Data%20Deletion%20Request" className="text-emerald-600 hover:text-emerald-700">
              support@agrotrack.lk
            </a> with "Data Deletion Request" in the subject line.
          </p>
        </section>

        {/* Security */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Security</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            We use industry-standard security measures including encryption, secure servers, 
            and regular security audits to protect your information.
          </p>
          <p className="text-gray-600 leading-relaxed">
            However, no method of transmission over the internet is 100% secure. 
            We continuously work to improve our security practices.
          </p>
        </section>

        {/* Children */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Children's Privacy</h2>
          <p className="text-gray-600 leading-relaxed">
            AgroTrack is intended for users aged 13 and older. We don't knowingly collect 
            personal information from children under 13. If we discover such information, 
            we'll delete it promptly.
          </p>
        </section>

        {/* International Transfers */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">International Data Transfers</h2>
          <p className="text-gray-600 leading-relaxed">
            Our servers may be located outside Sri Lanka for better service quality. 
            When we transfer your data internationally, we ensure it receives the same 
            level of protection as described in this policy.
          </p>
        </section>

        {/* Contact */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Contact Us</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            If you have questions about this privacy policy or how we handle your data, please contact us:
          </p>
          
          <div className="space-y-2">
            <p className="text-gray-600">
              📧 Email: <a href="mailto:support@agrotrack.lk" className="text-emerald-600 hover:text-emerald-700">support@agrotrack.lk</a>
            </p>
            <p className="text-gray-600">
              📞 Phone: <a href="tel:+94771234567" className="text-emerald-600 hover:text-emerald-700">+94 77 123 4567</a>
            </p>
            <p className="text-gray-600">
              📍 Address: 123 Galle Road, Colombo 03, Sri Lanka
            </p>
          </div>
        </section>

        {/* Legal Reference */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Legal Framework</h2>
          <p className="text-gray-600 leading-relaxed">
            This privacy policy aligns with Sri Lanka's Personal Data Protection Act (PDPA) concepts 
            and international best practices for data protection.
          </p>
          
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-amber-800 text-sm">
              <strong>Legal Notice:</strong> This policy provides general information and is not 
              intended as legal advice. For specific legal questions, please consult a qualified attorney.
            </p>
          </div>
        </section>
      </div>
      
      <footer className="mt-12 pt-8 border-t border-gray-200 text-center text-sm text-gray-500">
        Last updated: 2025-08-24
      </footer>
    </main>
  );
};

export default PrivacyPage;
