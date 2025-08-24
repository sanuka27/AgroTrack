import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ChevronUp } from 'lucide-react';

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
    <main role="main" className="container mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-4xl font-bold text-gray-900 mb-8">Help Center</h1>
      
      <div className="space-y-8">
        {/* Introduction */}
        <section>
          <p className="text-lg text-gray-600 leading-relaxed mb-6">
            Welcome to the AgroTrack Help Center! Find answers to common questions below, 
            or reach out to our support team if you need additional assistance.
          </p>
          
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
            <p className="text-emerald-800 text-sm">
              <strong>Quick tip:</strong> Most questions can be answered by searching through the FAQ below. 
              For technical issues, our Bug Reports page has specific troubleshooting steps.
            </p>
          </div>
        </section>

        {/* FAQ Section */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">Frequently Asked Questions</h2>
          
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="border border-gray-200 rounded-lg">
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
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Still Need Help?</h2>
          <p className="text-gray-600 leading-relaxed mb-6">
            Can't find what you're looking for? Our support team is here to help:
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">General Support</h3>
              <p className="text-gray-600 text-sm mb-4">
                Questions about using AgroTrack, plant care advice, or account issues.
              </p>
              <Link 
                to="/contact" 
                className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm"
              >
                Contact Support →
              </Link>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Technical Issues</h3>
              <p className="text-gray-600 text-sm mb-4">
                App crashes, bugs, or features not working as expected.
              </p>
              <Link 
                to="/bug-reports" 
                className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
              >
                Report Bug →
              </Link>
            </div>
          </div>
        </section>

        {/* Quick Contact Info */}
        <section className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Direct Contact</h3>
          <div className="space-y-2 text-sm">
            <p className="text-gray-600">
              📧 Email: <a href="mailto:support@agrotrack.lk" className="text-emerald-600 hover:text-emerald-700">support@agrotrack.lk</a>
            </p>
            <p className="text-gray-600">
              📞 Phone: <a href="tel:+94771234567" className="text-emerald-600 hover:text-emerald-700">+94 77 123 4567</a>
            </p>
            <p className="text-gray-600">
              🕒 Support Hours: Monday-Friday, 9:00 AM - 6:00 PM (Sri Lanka Time)
            </p>
          </div>
        </section>
      </div>
    </main>
  );
};

export default HelpCenterPage;
