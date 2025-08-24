import React, { useEffect, useState } from 'react';
import { Bug, Mail, Send } from 'lucide-react';

const BugReportsPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });

  useEffect(() => {
    document.title = 'Bug Reports - AgroTrack';
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Bug report submitted:', formData);
    alert('Thank you for your bug report! We\'ll investigate this issue.');
    setFormData({ name: '', email: '', message: '' });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <main role="main" className="container mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-4xl font-bold text-gray-900 mb-8">Bug Reports</h1>
      
      <div className="space-y-8">
        {/* Introduction */}
        <section>
          <p className="text-lg text-gray-600 leading-relaxed mb-6">
            Found a bug or technical issue with AgroTrack? We appreciate your help in making our app better! 
            Report bugs using the methods below, and our development team will investigate promptly.
          </p>
          
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800 text-sm">
              <strong>For urgent issues affecting plant safety:</strong> Please call our support line at 
              <a href="tel:+94771234567" className="font-medium"> +94 77 123 4567</a> immediately.
            </p>
          </div>
        </section>

        {/* Quick Email Report */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Quick Email Report</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            For fastest processing, email us directly with your bug report:
          </p>
          
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center mr-3">
                <Mail className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Email Bug Report</h3>
                <p className="text-gray-600 text-sm">Direct line to our development team</p>
              </div>
            </div>
            
            <a 
              href="mailto:bugs@agrotrack.lk?subject=Bug%20Report&body=Please%20describe%20the%20issue%3A%0A%0ASteps%20to%20reproduce%3A%0A1.%20%0A2.%20%0A3.%20%0A%0ADevice%20information%3A%0A-%20Device%20type%3A%20%0A-%20Operating%20system%3A%20%0A-%20App%20version%3A%20%0A%0AScreenshots%20(if%20applicable)%3A%20Please%20attach"
              className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <Mail className="w-4 h-4 mr-2" />
              Send Bug Report Email
            </a>
            
            <p className="text-gray-500 text-sm mt-3">
              This will open your email client with a pre-filled template to help you provide all necessary details.
            </p>
          </div>
        </section>

        {/* Bug Report Guidelines */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">What to Include in Your Report</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-700">📝 Essential Information</h3>
              <ul className="list-disc list-inside text-gray-600 space-y-2 text-sm">
                <li>Clear description of what went wrong</li>
                <li>What you were trying to do when the bug occurred</li>
                <li>What you expected to happen vs. what actually happened</li>
                <li>Whether the issue happens consistently or randomly</li>
              </ul>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-700">📱 Technical Details</h3>
              <ul className="list-disc list-inside text-gray-600 space-y-2 text-sm">
                <li>Device type (iPhone, Android, etc.)</li>
                <li>Operating system version</li>
                <li>AgroTrack app version</li>
                <li>Screenshots or screen recordings if possible</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Alternative Form */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Alternative: Web Form</h2>
          <p className="text-gray-600 leading-relaxed mb-6">
            Prefer to use a form? Fill out the details below and we'll receive your bug report:
          </p>
          
          <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Your Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="Enter your name"
                />
              </div>
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="your.email@example.com"
                />
              </div>
              
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                  Bug Description
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="Please describe the bug in detail, including steps to reproduce it and any error messages you saw..."
                />
              </div>
              
              <button
                type="submit"
                className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
              >
                <Send className="w-4 h-4 mr-2" />
                Submit Bug Report
              </button>
            </div>
          </form>
          
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-4">
            <p className="text-amber-800 text-sm">
              <strong>Note:</strong> This form currently logs reports to the console for development purposes. 
              For immediate assistance, please use the email method above.
            </p>
          </div>
        </section>

        {/* Common Issues */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Common Issues & Quick Fixes</h2>
          
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-800 mb-2">🐛 App Won't Load or Crashes</h3>
              <p className="text-gray-600 text-sm">
                Try restarting the app, checking your internet connection, or updating to the latest version.
              </p>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-800 mb-2">📷 Camera/Photo Upload Issues</h3>
              <p className="text-gray-600 text-sm">
                Ensure AgroTrack has camera permissions and try taking photos in good lighting conditions.
              </p>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-800 mb-2">🔐 Login Problems</h3>
              <p className="text-gray-600 text-sm">
                Check your email/password, ensure caps lock is off, or try the "Forgot Password" option.
              </p>
            </div>
          </div>
        </section>

        {/* Contact Alternative */}
        <section className="bg-emerald-50 border border-emerald-200 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <Bug className="w-6 h-6 text-emerald-600 mr-3" />
            <h3 className="text-lg font-semibold text-emerald-800">Need Immediate Help?</h3>
          </div>
          <p className="text-emerald-700 mb-4">
            For urgent issues or if you're unable to use the bug reporting methods above, 
            contact our support team directly:
          </p>
          <div className="space-y-2 text-sm">
            <p className="text-emerald-700">
              📞 Phone: <a href="tel:+94771234567" className="font-medium hover:text-emerald-800">+94 77 123 4567</a>
            </p>
            <p className="text-emerald-700">
              📧 General Support: <a href="mailto:support@agrotrack.lk" className="font-medium hover:text-emerald-800">support@agrotrack.lk</a>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
};

export default BugReportsPage;
