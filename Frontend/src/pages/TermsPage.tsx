import React, { useEffect } from 'react';

const TermsPage = () => {
  useEffect(() => {
    document.title = 'Terms of Service - AgroTrack';
  }, []);

  return (
    <main role="main" className="container mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-4xl font-bold text-gray-900 mb-8">Terms of Service</h1>
      
      <div className="space-y-8">
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
          <p className="text-emerald-800 text-sm">
            <strong>Welcome to AgroTrack!</strong> By using our service, you agree to these terms. 
            We've kept them straightforward and fair for everyone.
          </p>
        </div>

        {/* Acceptance of Terms */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Acceptance of Terms</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            By creating an account or using AgroTrack, you agree to be bound by these Terms of Service 
            and our Privacy Policy. If you don't agree with any part of these terms, please don't use our service.
          </p>
          <p className="text-gray-600 leading-relaxed">
            We may update these terms occasionally. When we do, we'll notify you via email or through 
            the app. Continued use of AgroTrack after changes means you accept the new terms.
          </p>
        </section>

        {/* Accounts & Security */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Accounts & Security</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium text-gray-700 mb-2">Keep Your Login Safe</h3>
              <p className="text-gray-600 leading-relaxed">
                You're responsible for keeping your password secure and all activities under your account. 
                Don't share your login credentials with others.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-gray-700 mb-2">Accurate Information</h3>
              <p className="text-gray-600 leading-relaxed">
                Please provide accurate information when creating your account. This helps us give you 
                better plant care recommendations and support when needed.
              </p>
            </div>
          </div>
        </section>

        {/* Acceptable Use */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Acceptable Use</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            AgroTrack is designed to help you care for plants. Please use it responsibly:
          </p>
          
          <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
            <li>Don't upload harmful, illegal, or inappropriate content</li>
            <li>Don't attempt to reverse engineer or hack our AI systems</li>
            <li>Don't use our service to spam or harass other users</li>
            <li>Don't share false information about plant care that could harm others' plants</li>
          </ul>
          
          <p className="text-gray-600 leading-relaxed">
            We reserve the right to suspend or terminate accounts that violate these guidelines.
          </p>
        </section>

        {/* AI Output Disclaimer */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">AI Output Disclaimer</h2>
          
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
            <p className="text-amber-800 text-sm font-medium">
              <strong>Important:</strong> Our AI provides suggestions based on image analysis and data patterns. 
              Results may sometimes be inaccurate.
            </p>
          </div>
          
          <p className="text-gray-600 leading-relaxed mb-4">
            Always verify AI recommendations with:
          </p>
          
          <ul className="list-disc list-inside text-gray-600 space-y-1 mb-4">
            <li>Local gardening experts or agricultural extension officers</li>
            <li>Multiple reliable plant identification sources</li>
            <li>Your own observation and common sense</li>
          </ul>
          
          <p className="text-gray-600 leading-relaxed">
            We're not responsible for plant damage or loss resulting from following AI recommendations. 
            Use AgroTrack as a helpful tool, not the only source of plant care advice.
          </p>
        </section>

        {/* Subscriptions & Payments */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Subscriptions & Payments</h2>
          
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
            <p className="text-emerald-800 text-sm">
              <strong>Free Beta:</strong> AgroTrack is currently in free beta testing. 
              We'll notify users before introducing any paid features or subscriptions.
            </p>
          </div>
        </section>

        {/* Intellectual Property */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Intellectual Property</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium text-gray-700 mb-2">Your Content</h3>
              <p className="text-gray-600 leading-relaxed">
                Photos you upload remain your property. By using AgroTrack, you grant us permission to 
                process these images for identification, disease detection, and service improvement.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-gray-700 mb-2">Our Platform</h3>
              <p className="text-gray-600 leading-relaxed">
                The AgroTrack app, AI models, and related technology are our intellectual property. 
                You may use them through our service but not copy, modify, or redistribute them.
              </p>
            </div>
          </div>
        </section>

        {/* Termination */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Termination</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            You can delete your account anytime through the app settings or by contacting us. 
            We may suspend or terminate accounts that violate these terms.
          </p>
          <p className="text-gray-600 leading-relaxed">
            When an account is terminated, we'll delete personal data according to our Privacy Policy, 
            but may retain some information for legal or safety purposes.
          </p>
        </section>

        {/* Limitation of Liability */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Limitation of Liability</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            We provide AgroTrack "as is" and can't guarantee it will always work perfectly. 
            Our liability for any issues is limited to the extent permitted by Sri Lankan law.
          </p>
          <p className="text-gray-600 leading-relaxed">
            We're not responsible for indirect damages like lost crops or business interruption, 
            but we are committed to fixing problems and improving our service.
          </p>
        </section>

        {/* Governing Law & Venue */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Governing Law & Venue</h2>
          <p className="text-gray-600 leading-relaxed">
            These terms are governed by the laws of Sri Lanka. Any legal disputes will be resolved 
            in Sri Lankan courts, but we prefer to work things out directly with our users first.
          </p>
        </section>

        {/* Contact */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Contact Us</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            Questions about these terms? We're happy to clarify:
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
      </div>
      
      <footer className="mt-12 pt-8 border-t border-gray-200 text-center text-sm text-gray-500">
        Last updated: 2025-08-24
      </footer>
    </main>
  );
};

export default TermsPage;
