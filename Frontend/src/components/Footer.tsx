import { Link } from "react-router-dom";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer role="contentinfo" className="bg-green-800 text-white/80 border-t">
      <div className="container mx-auto px-4 py-12">
        {/* Main Grid */}
        <div className="grid gap-8 grid-cols-2 md:grid-cols-4">
          
          {/* Platform Column */}
          <nav aria-label="Platform">
            <h3 className="text-white font-semibold mb-3">Platform</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/plants" className="text-sm hover:text-white transition">
                  My Plants
                </Link>
              </li>
              <li>
                <Link to="/assistant" className="text-sm hover:text-white transition">
                  AI Assistant
                </Link>
              </li>
              <li>
                <Link to="/community" className="text-sm hover:text-white transition">
                  Community
                </Link>
              </li>
              <li>
                <Link to="/analytics" className="text-sm hover:text-white transition">
                  Analytics
                </Link>
              </li>
            </ul>
          </nav>

          {/* Resources Column */}
          <nav aria-label="Resources">
            <h3 className="text-white font-semibold mb-3">Resources</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/guides" className="text-sm hover:text-white transition">
                  Plant Care Guide
                </Link>
              </li>
              <li>
                <Link to="/how-it-works" className="text-sm hover:text-white transition">
                  How it Works
                </Link>
              </li>
              <li>
                <Link to="/faq" className="text-sm hover:text-white transition">
                  FAQ
                </Link>
              </li>
            </ul>
          </nav>

          {/* Support Column */}
          <nav aria-label="Support">
            <h3 className="text-white font-semibold mb-3">Support</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/help" className="text-sm hover:text-white transition">
                  Help Center
                </Link>
              </li>
              <li>
                <a 
                  href="mailto:support@agrotrack.lk?subject=AgroTrack%20Support%20Request" 
                  className="text-sm hover:text-white transition"
                >
                  Contact Us
                </a>
              </li>
              <li>
                <a 
                  href="mailto:bugs@agrotrack.lk?subject=Bug%20Report" 
                  className="text-sm hover:text-white transition"
                >
                  Bug Reports
                </a>
              </li>
              <li>
                <a 
                  href="tel:+94771234567" 
                  className="text-sm hover:text-white transition"
                >
                  +94 77 123 4567
                </a>
              </li>
            </ul>
          </nav>

          {/* Company Column */}
          <nav aria-label="Company">
            <h3 className="text-white font-semibold mb-3">Company</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/about" className="text-sm hover:text-white transition">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-sm hover:text-white transition">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-sm hover:text-white transition">
                  Terms of Service
                </Link>
              </li>
              <li>
                <a 
                  href="https://maps.google.com/?q=123+Galle+Road+Colombo+03+Sri+Lanka"
                  target="_blank"
                  rel="noopener"
                  className="text-sm hover:text-white transition block leading-relaxed"
                >
                  123 Galle Road, Colombo 03, Sri Lanka
                </a>
              </li>
            </ul>
          </nav>

        </div>

        {/* Bottom Row */}
        <div className="mt-12 pt-8 border-t border-white/20 text-center">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-xs">
            <span>© {currentYear} AgroTrack (Pvt) Ltd. All rights reserved.</span>
            <Link to="/status" className="hover:text-white transition">
              Status
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;