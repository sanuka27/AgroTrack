import { Link } from "react-router-dom";
import { Leaf } from "lucide-react";

const footerSections = [
  {
    title: "Platform",
    links: [
      { label: "My Plants", href: "/my-plants" },
      { label: "AI Assistant", href: "/plant-analysis" },
      { label: "Community", href: "/community" },
      { label: "Analytics", href: "/analytics" }
    ]
  },
  {
    title: "Resources",
    links: [
      { label: "Plant Care Guide", href: "#guide" },
      { label: "Disease Database", href: "#diseases" },
      { label: "Expert Tips", href: "#tips" },
      { label: "Video Tutorials", href: "#videos" }
    ]
  },
  {
    title: "Support",
    links: [
      { label: "Help Center", href: "#help" },
      { label: "Contact Us", href: "#contact" },
      { label: "Bug Reports", href: "#bugs" },
      { label: "Feature Requests", href: "#features" }
    ]
  },
  {
    title: "Company",
    links: [
      { label: "About Us", href: "#about" },
      { label: "Privacy Policy", href: "#privacy" },
      { label: "Terms of Service", href: "#terms" },
      { label: "Careers", href: "#careers" }
    ]
  }
];

export function Footer() {
  return (
    <footer className="bg-foreground text-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Links Sections */}
            {footerSections.map((section, index) => (
              <div key={index} className="space-y-4">
                <h4 className="font-semibold text-background">{section.title}</h4>
                <ul className="space-y-3">
                  {section.links.map((link, linkIndex) => (
                    <li key={linkIndex}>
                      <a
                        href={link.href}
                        className="text-background/80 hover:text-background transition-colors text-sm cursor-pointer"
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Section */}
        <div className="py-8 border-t border-background/20">
          <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
            <Link to="/" className="flex items-center space-x-2 hover:opacity-90 transition-opacity cursor-pointer">
              <div className="flex items-center justify-center w-8 h-8 bg-gradient-hero rounded-lg">
                <Leaf className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold">AgroTrack</span>
            </Link>
            
            <div className="text-center md:text-right">
              <p className="text-background/80 text-sm">
                © 2025 AgroTrack. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}