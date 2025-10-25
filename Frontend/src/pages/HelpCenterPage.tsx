import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ChevronUp, HelpCircle, MessageCircle, Bug } from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

const HelpCenterPage = () => {
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);

  useEffect(() => {
    document.title = 'Help Center - AgroTrack';
  }, []);

  const toggleFAQ = (index: number) => {
    setOpenFAQ(openFAQ === index ? null : index);
  };

  const faqs = [
    {
      question: "How do I identify a plant using AgroTrack?",
      answer: "Simply take a clear photo of the plant's leaves, flowers, or overall structure. Upload it through the AI Assistant feature, and our AI will analyze the image to identify the species and provide care instructions. For best results, take photos in good lighting with the plant clearly visible."
    },
    {
      question: "Why did the AI misidentify my plant?",
      answer: "AI identification can sometimes be inaccurate due to factors like photo quality, lighting, or unusual plant varieties. The AI works best with clear, well-lit photos of healthy plants. If you get an incorrect identification, try taking another photo from a different angle or in better lighting."
    },
    {
      question: "How do I report a bug or technical issue?",
      answer: "You can report bugs by visiting our Bug Reports page or emailing bugs@agrotrack.lk directly. Please include details about what happened, what device you're using, and steps to reproduce the issue. Screenshots are also helpful!"
    },
    {
      question: "How can I delete my account and data?",
      answer: "To delete your account, go to Settings in the app or contact our support team at support@agrotrack.lk with 'Account Deletion Request' in the subject line. We'll permanently delete your personal data within 30 days, though some information may be retained for legal purposes."
    },
    {
      question: "How do I change my watering reminder settings?",
      answer: "Go to your plant profile and tap on 'Care Schedule' or 'Reminders'. You can adjust watering frequency, timing, and notification preferences. The AI will also suggest optimal watering schedules based on your plant type and local weather conditions."
    },
    {
      question: "Can I use AgroTrack offline?",
      answer: "Some features like viewing saved plant profiles work offline, but AI identification and disease detection require an internet connection. Make sure you're connected to WiFi or mobile data when using these features."
    },
    {
      question: "Is AgroTrack really free to use?",
      answer: "Yes! AgroTrack is currently in free beta. All core features including plant identification, disease detection, and care reminders are available at no cost. We'll notify users well in advance if we introduce any premium features."
    }
  ];

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,hsl(120_100%_25%/0.05),transparent_70%)] pointer-events-none"></div>

        <main role="main" className="relative container mx-auto max-w-4xl px-4 py-16">
        {/* Header Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center space-x-2 bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <HelpCircle className="w-4 h-4" />
            <span>Help Center</span>
          </div>
          <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
            How Can We
            <span className="bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent"> Help You?</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Find answers to common questions or get in touch with our support team.
          </p>
        </div>
        <div className="space-y-12">
          {/* Introduction */}
          <section className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-white/20">
            <p className="text-lg text-gray-600 leading-relaxed mb-6">
              Welcome to the AgroTrack Help Center! Find answers to common questions below,
              or reach out to our support team if you need additional assistance.
            </p>

            <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-xl p-6">
              <p className="text-green-800 text-sm font-medium">
                <strong>Quick tip:</strong> Most questions can be answered by searching through the FAQ below.
                For technical issues, our Bug Reports page has specific troubleshooting steps.
              </p>
            </div>
          </section>

          {/* FAQ Section */}
          <section className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-white/20">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">Frequently Asked Questions</h2>

            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <div key={index} className="border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow">
                  <button
                    onClick={() => toggleFAQ(index)}
                    className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                    aria-expanded={openFAQ === index}
                    aria-controls={`faq-answer-${index}`}
                  >
                    <h3 className="text-lg font-medium text-gray-800 pr-4">
                      {faq.question}
                    </h3>
                    {openFAQ === index ? (
                      <ChevronUp className="w-5 h-5 text-gray-500 flex-shrink-0" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-500 flex-shrink-0" />
                    )}
                  </button>

                  {openFAQ === index && (
                    <div
                      id={`faq-answer-${index}`}
                      role="region"
                      className="px-6 pb-4"
                    >
                      <p className="text-gray-600 leading-relaxed">
                        {faq.answer}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Contact Links */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Still Need Help?</h2>
            <p className="text-gray-600 leading-relaxed mb-8 text-lg text-center">
              Can't find what you're looking for? Our support team is here to help:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20 hover:shadow-xl transition-shadow">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                    <MessageCircle className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">General Support</h3>
                </div>
                <p className="text-gray-600 text-sm mb-4">
                  Questions about using AgroTrack, plant care advice, or account issues.
                </p>
                <Link
                  to="/contact"
                  className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                >
                  Contact Support →
                </Link>
              </div>

              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20 hover:shadow-xl transition-shadow">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-red-600 rounded-xl flex items-center justify-center">
                    <Bug className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Technical Issues</h3>
                </div>
                <p className="text-gray-600 text-sm mb-4">
                  App crashes, bugs, or features not working as expected.
                </p>
                <Link
                  to="/bug-reports"
                  className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                >
                  Report Bug →
                </Link>
              </div>
            </div>
          </section>

          {/* Quick Contact Info */}
          <section className="bg-gradient-to-r from-green-600 to-blue-600 rounded-2xl p-8 text-white">
            <h3 className="text-xl font-bold mb-6">Direct Contact</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
                <p className="text-green-100 text-sm mb-1">📧 Email</p>
                <a href="mailto:support@agrotrack.lk" className="text-white hover:text-green-200 font-medium transition-colors block">
                  support@agrotrack.lk
                </a>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
                <p className="text-green-100 text-sm mb-1">📞 Phone</p>
                <a href="tel:+94771234567" className="text-white hover:text-green-200 font-medium transition-colors block">
                  +94 77 123 4567
                </a>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
                <p className="text-green-100 text-sm mb-1">🐛 Bug Reports</p>
                <a href="mailto:bugs@agrotrack.lk" className="text-white hover:text-green-200 font-medium transition-colors block">
                  bugs@agrotrack.lk
                </a>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
                <p className="text-green-100 text-sm mb-1">🕒 Support Hours</p>
                <p className="text-white font-medium">Mon-Fri, 9AM-6PM (Sri Lanka)</p>
              </div>
            </div>
          </section>
        </div>
        {/* Replace page-local footer with shared Footer for consistent layout */}
        </main>
      </div>
      <Footer />
    </>
  );
};

export default HelpCenterPage;