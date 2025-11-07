import React, { useEffect } from 'react';
import { FileText, Shield, AlertTriangle, Scale } from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

const TermsPage = () => {
  useEffect(() => {
    document.title = 'Terms of Service - AgroTrack';
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10 dark:opacity-20 bg-[radial-gradient(circle_at_50%_120%,hsl(120_100%_25%/0.05),transparent_70%)] pointer-events-none"></div>

      <main role="main" className="relative container mx-auto max-w-4xl px-4 py-16">
        {/* Header Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center space-x-2 bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <FileText className="w-4 h-4" />
            <span>Terms of Service</span>
          </div>
          <h1 className="text-4xl lg:text-5xl font-bold text-foreground mb-6">
            Terms of
            <span className="bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent"> Service</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Clear and fair terms for using AgroTrack. We've kept them straightforward for everyone.
          </p>
        </div>
        <div className="space-y-8">
          {/* Introduction Banner */}
          <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/30 dark:to-blue-900/30 border border-green-200 dark:border-border rounded-2xl p-6">
            <p className="text-green-800 dark:text-green-300 text-lg font-medium">
              <strong>Welcome to AgroTrack!</strong> By using our service, you agree to these terms.
              We've kept them straightforward and fair for everyone.
            </p>
          </div>

          {/* Acceptance of Terms */}
          <section className="bg-card/90 dark:bg-card/70 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-border/40">
            <h2 className="text-2xl font-bold text-foreground mb-6">Acceptance of Terms</h2>
            <p className="text-muted-foreground leading-relaxed mb-4 text-lg">
              By creating an account or using AgroTrack, you agree to be bound by these Terms of Service
              and our Privacy Policy. If you don't agree with any part of these terms, please don't use our service.
            </p>
            <p className="text-muted-foreground leading-relaxed text-lg">
              We may update these terms occasionally. When we do, we'll notify you via email or through
              the app. Continued use of AgroTrack after changes means you accept the new terms.
            </p>
          </section>

          {/* Accounts & Security */}
          <section className="bg-card/90 dark:bg-card/70 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-border/40">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">Accounts & Security</h2>
            </div>

            <div className="space-y-6">
              <div className="bg-muted/50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-foreground mb-3">Keep Your Login Safe</h3>
                <p className="text-muted-foreground leading-relaxed">
                  You're responsible for keeping your password secure and all activities under your account.
                  Don't share your login credentials with others.
                </p>
              </div>

              <div className="bg-muted/50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-foreground mb-3">Accurate Information</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Please provide accurate information when creating your account. This helps us give you
                  better plant care recommendations and support when needed.
                </p>
              </div>
            </div>
          </section>

          {/* Acceptable Use */}
          <section className="bg-card/90 dark:bg-card/70 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-border/40">
            <h2 className="text-2xl font-bold text-foreground mb-6">Acceptable Use</h2>
            <p className="text-muted-foreground leading-relaxed mb-6 text-lg">
              AgroTrack is designed to help you care for plants. Please use it responsibly:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl p-4">
                <p className="text-red-800 dark:text-red-300 text-sm font-medium">❌ Don't upload harmful content</p>
                <p className="text-red-700 dark:text-red-300/80 text-xs mt-1">Illegal or inappropriate content</p>
              </div>
              <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl p-4">
                <p className="text-red-800 dark:text-red-300 text-sm font-medium">❌ Don't reverse engineer</p>
                <p className="text-red-700 dark:text-red-300/80 text-xs mt-1">Attempting to hack our AI systems</p>
              </div>
              <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl p-4">
                <p className="text-red-800 dark:text-red-300 text-sm font-medium">❌ Don't spam or harass</p>
                <p className="text-red-700 dark:text-red-300/80 text-xs mt-1">Using service to harm others</p>
              </div>
              <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl p-4">
                <p className="text-red-800 dark:text-red-300 text-sm font-medium">❌ Don't share false info</p>
                <p className="text-red-700 dark:text-red-300/80 text-xs mt-1">Misleading plant care advice</p>
              </div>
            </div>

            <p className="text-muted-foreground leading-relaxed mt-6 text-lg">
              We reserve the right to suspend or terminate accounts that violate these guidelines.
            </p>
          </section>

          {/* AI Output Disclaimer */}
          <section className="bg-card/90 dark:bg-card/70 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-border/40">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-amber-500 to-amber-600 rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">AI Output Disclaimer</h2>
            </div>

            <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-xl p-6 mb-6">
              <p className="text-muted-foreground leading-relaxed mb-6 text-lg">
                <strong>Important:</strong> Our AI provides suggestions based on image analysis and data patterns.
                Results may sometimes be inaccurate.
              </p>
            </div>

            <p className="text-muted-foreground leading-relaxed mb-6 text-lg">
              Always verify AI recommendations with:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-xl p-4 text-center">
                <p className="text-green-800 dark:text-green-300 text-sm font-medium">Local Experts</p>
                <p className="text-green-700 dark:text-green-300/80 text-xs mt-1">Agricultural extension officers</p>
              </div>
              <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-xl p-4 text-center">
                <p className="text-green-800 dark:text-green-300 text-sm font-medium">Multiple Sources</p>
                <p className="text-green-700 dark:text-green-300/80 text-xs mt-1">Cross-reference identification</p>
              </div>
              <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-xl p-4 text-center">
                <p className="text-green-800 dark:text-green-300 text-sm font-medium">Common Sense</p>
                <p className="text-green-700 dark:text-green-300/80 text-xs mt-1">Your own observation</p>
              </div>
            </div>

            <p className="text-muted-foreground leading-relaxed text-lg">
              We're not responsible for plant damage or loss resulting from following AI recommendations.
              Use AgroTrack as a helpful tool, not the only source of plant care advice.
            </p>
          </section>

          {/* Subscriptions & Payments */}
          <section className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/30 dark:to-blue-900/30 border border-green-200 dark:border-border rounded-2xl p-6">
            <h2 className="text-xl font-bold text-foreground mb-4">Subscriptions & Payments</h2>
            <p className="text-green-800 dark:text-green-300 text-lg font-medium">
              <strong>Free Beta:</strong> AgroTrack is currently in free beta testing.
              We'll notify users well in advance if we introduce any paid features or subscriptions.
            </p>
          </section>

          {/* Intellectual Property */}
          <section className="bg-card/90 dark:bg-card/70 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-border/40">
            <h2 className="text-2xl font-bold text-foreground mb-6">Intellectual Property</h2>

            <div className="space-y-6">
              <div className="bg-muted/50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-foreground mb-3">Your Content</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Photos you upload remain your property. By using AgroTrack, you grant us permission to
                  process these images for identification, disease detection, and service improvement.
                </p>
              </div>

              <div className="bg-muted/50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-foreground mb-3">Our Platform</h3>
                <p className="text-muted-foreground leading-relaxed">
                  The AgroTrack app, AI models, and related technology are our intellectual property.
                  You may use them through our service but not copy, modify, or redistribute them.
                </p>
              </div>
            </div>
          </section>

          {/* Termination & Liability */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <section className="bg-card/90 dark:bg-card/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-border/40">
              <h2 className="text-xl font-bold text-foreground mb-4">Termination</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                You can delete your account anytime through the app settings or by contacting us.
                We may suspend or terminate accounts that violate these terms.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                When an account is terminated, we'll delete personal data according to our Privacy Policy,
                but may retain some information for legal or safety purposes.
              </p>
            </section>

            <section className="bg-card/90 dark:bg-card/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-border/40">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <Scale className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl font-bold text-foreground">Limitation of Liability</h2>
              </div>
              <p className="text-muted-foreground leading-relaxed mb-4">
                We provide AgroTrack "as is" and can't guarantee it will always work perfectly.
                Our liability for any issues is limited to the extent permitted by Sri Lankan law.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                We're not responsible for indirect damages like lost crops or business interruption,
                but we are committed to fixing problems and improving our service.
              </p>
            </section>
          </div>

          {/* Governing Law */}
          <section className="bg-card/90 dark:bg-card/70 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-border/40">
            <h2 className="text-2xl font-bold text-foreground mb-6">Governing Law & Venue</h2>
            <p className="text-muted-foreground leading-relaxed text-lg">
              These terms are governed by the laws of Sri Lanka. Any legal disputes will be resolved
              in Sri Lankan courts, but we prefer to work things out directly with our users first.
            </p>
          </section>

          {/* Contact */}
          <section className="bg-gradient-to-r from-green-600 to-blue-600 rounded-2xl p-8 text-white">
            <h2 className="text-2xl font-bold mb-6">Contact Us</h2>
            <p className="text-green-100 leading-relaxed mb-6 text-lg">
              Questions about these terms? We're happy to clarify:
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
      </div>
      
      </main>

      <Footer />
    </div>
  );
};

export default TermsPage;
