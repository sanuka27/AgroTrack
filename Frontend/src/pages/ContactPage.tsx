import React, { useEffect } from 'react';
import { MapPin, Phone, Mail, MessageCircle } from 'lucide-react';

const ContactPage = () => {
  useEffect(() => {
    document.title = 'Contact Us - AgroTrack';
  }, []);

  return (
    <main role="main" className="container mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-4xl font-bold text-gray-900 mb-8">Contact Us</h1>
      
      <div className="space-y-8">
        {/* Introduction */}
        <section>
          <p className="text-lg text-gray-600 leading-relaxed mb-6">
            We'd love to hear from you! Whether you have questions about plant care, need technical support, 
            or want to share feedback about AgroTrack, our team is here to help.
          </p>
          
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
            <p className="text-emerald-800 text-sm">
              <strong>Response Time:</strong> We typically respond to emails within 24 hours during business days. 
              For urgent issues, please call us directly.
            </p>
          </div>
        </section>

        {/* Contact Methods Grid */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">Get in Touch</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Phone */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center mr-3">
                  <Phone className="w-5 h-5 text-emerald-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800">Phone Support</h3>
              </div>
              <p className="text-gray-600 text-sm mb-4">
                Call us for immediate assistance with your plant care questions or technical issues.
              </p>
              <a 
                href="tel:+94771234567" 
                className="text-emerald-600 hover:text-emerald-700 font-medium text-lg"
              >
                +94 77 123 4567
              </a>
              <p className="text-gray-500 text-xs mt-2">
                Monday-Friday, 9:00 AM - 6:00 PM (Sri Lanka Time)
              </p>
            </div>

            {/* Email */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                  <Mail className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800">Email Support</h3>
              </div>
              <p className="text-gray-600 text-sm mb-4">
                Send us detailed questions or feedback. We'll get back to you within 24 hours.
              </p>
              <a 
                href="mailto:support@agrotrack.lk?subject=AgroTrack%20Support%20Request" 
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                support@agrotrack.lk
              </a>
            </div>

            {/* WhatsApp */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                  <MessageCircle className="w-5 h-5 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800">WhatsApp Chat</h3>
              </div>
              <p className="text-gray-600 text-sm mb-4">
                Chat with us on WhatsApp for quick questions and plant care tips.
              </p>
              <a 
                href="https://wa.me/94771234567" 
                target="_blank" 
                rel="noopener"
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Chat on WhatsApp
              </a>
            </div>

            {/* Location */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center mr-3">
                  <MapPin className="w-5 h-5 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800">Visit Our Office</h3>
              </div>
              <p className="text-gray-600 text-sm mb-4">
                Drop by our office in Colombo for in-person consultations (by appointment).
              </p>
              <a 
                href="https://maps.google.com/?q=123+Galle+Road+Colombo+03+Sri+Lanka" 
                target="_blank" 
                rel="noopener"
                className="text-red-600 hover:text-red-700 font-medium block leading-relaxed"
              >
                123 Galle Road<br />
                Colombo 03, Sri Lanka
              </a>
              <p className="text-gray-500 text-xs mt-2">
                Click to view on Google Maps
              </p>
            </div>
          </div>
        </section>

        {/* Support Categories */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">What Can We Help You With?</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
              <h3 className="font-semibold text-emerald-800 mb-2">🌱 Plant Care Questions</h3>
              <p className="text-emerald-700 text-sm">
                Plant identification, disease diagnosis, watering schedules, and general gardening advice.
              </p>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-800 mb-2">🔧 Technical Support</h3>
              <p className="text-blue-700 text-sm">
                App issues, login problems, feature requests, and bug reports.
              </p>
            </div>
            
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h3 className="font-semibold text-purple-800 mb-2">💭 Feedback & Suggestions</h3>
              <p className="text-purple-700 text-sm">
                Ideas for new features, user experience feedback, and partnership opportunities.
              </p>
            </div>
          </div>
        </section>

        {/* Business Hours */}
        <section className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Business Hours</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Phone & WhatsApp Support</h4>
              <ul className="text-gray-600 space-y-1">
                <li>Monday - Friday: 9:00 AM - 6:00 PM</li>
                <li>Saturday: 10:00 AM - 4:00 PM</li>
                <li>Sunday: Closed</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Email Support</h4>
              <ul className="text-gray-600 space-y-1">
                <li>24/7 - We'll respond within 24 hours</li>
                <li>Emergency issues: Call us directly</li>
              </ul>
            </div>
          </div>
          <p className="text-gray-500 text-xs mt-4">
            All times are in Sri Lanka Standard Time (UTC+5:30)
          </p>
        </section>

        {/* Additional Resources */}
        <section>
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Before You Contact Us</h3>
          <p className="text-gray-600 leading-relaxed mb-4">
            You might find answers faster by checking these resources first:
          </p>
          
          <div className="space-y-2">
            <p className="text-gray-600">
              📚 <a href="/help" className="text-emerald-600 hover:text-emerald-700">Help Center & FAQ</a> - Common questions and troubleshooting
            </p>
            <p className="text-gray-600">
              🐛 <a href="/bug-reports" className="text-emerald-600 hover:text-emerald-700">Bug Reports</a> - Technical issue reporting
            </p>
            <p className="text-gray-600">
              📱 In-app Help - Look for the "?" icon in the AgroTrack app
            </p>
          </div>
        </section>
      </div>
    </main>
  );
};

export default ContactPage;
