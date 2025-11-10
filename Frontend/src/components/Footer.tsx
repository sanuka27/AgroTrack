import { Link } from "react-router-dom";

export function Footer() {
  const currentYear = new Date().getFullYear();

  const handleLinkClick = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer
      role="contentinfo"
      className="bg-green-800 dark:bg-gradient-to-b dark:from-[#082012] dark:via-[#0d2f1d] dark:to-[#0f3521] text-white/80 border-t dark:border-border"
    >
      <div className="container mx-auto px-4 py-12">
        {/* Main Grid */}
        <div className="grid gap-8 grid-cols-2 md:grid-cols-4">
          
          {/* Platform Column */}
          <nav aria-label="Platform">
            <h3 className="text-white font-semibold mb-3">Platform</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/plants" onClick={handleLinkClick} className="text-sm text-white/80 hover:text-white transition">
                  My Plants
                </Link>
              </li>
              <li>
                {/* AI Assistant link removed */}
              </li>
              <li>
                <Link to="/community" onClick={handleLinkClick} className="text-sm text-white/80 hover:text-white transition">
                  Community
                </Link>
              </li>
              {/* Analytics link removed */}
            </ul>
          </nav>

          {/* Resources Column */}
          <nav aria-label="Resources">
            <h3 className="text-white font-semibold mb-3">Resources</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/guides" onClick={handleLinkClick} className="text-sm text-white/80 hover:text-white transition">
                  Plant Care Guide
                </Link>
              </li>
              <li>
                <Link to="/how-it-works" onClick={handleLinkClick} className="text-sm text-white/80 hover:text-white transition">
                  How it Works
                </Link>
              </li>
              <li>
                <Link to="/faq" onClick={handleLinkClick} className="text-sm text-white/80 hover:text-white transition">
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
                <Link to="/help" onClick={handleLinkClick} className="text-sm text-white/80 hover:text-white transition">
                  Help Center
                </Link>
              </li>
              <li>
                <a 
                  href="mailto:support@agrotrack.lk?subject=AgroTrack%20Support%20Request" 
                  className="text-sm text-white/80 hover:text-white transition"
                >
                  Contact Us
                </a>
              </li>
              <li>
                <Link to="/bug-reports" onClick={handleLinkClick} className="text-sm text-white/80 hover:text-white transition">
                  Bug Reports
                </Link>
              </li>
              <li>
                <a 
                  href="tel:+94771234567" 
                  className="text-sm text-white/80 hover:text-white transition"
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
                <Link to="/about" onClick={handleLinkClick} className="text-sm text-white/80 hover:text-white transition">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/privacy" onClick={handleLinkClick} className="text-sm text-white/80 hover:text-white transition">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" onClick={handleLinkClick} className="text-sm text-white/80 hover:text-white transition">
                  Terms of Service
                </Link>
              </li>
              <li>
                <a 
                  href="https://maps.google.com/?q=123+Galle+Road+Colombo+03+Sri+Lanka"
                  target="_blank"
                  rel="noopener"
                  className="text-sm text-white/80 hover:text-white transition block leading-relaxed"
                >
                  123 Galle Road, Colombo 03, Sri Lanka
                </a>
              </li>
            </ul>
          </nav>

        </div>

        {/* Bottom Row */}
  <div className="mt-12 pt-8 border-t border-white/20 dark:border-border/40 text-center">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-xs">
            <span>© {currentYear} AgroTrack (Pvt) Ltd. All rights reserved.</span>
            {/* Status page removed */}
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;