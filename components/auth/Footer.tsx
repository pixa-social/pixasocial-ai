import React from 'react';
import { APP_TITLE } from '../../constants';

const FooterLink: React.FC<{ href: string; children: React.ReactNode; onClick?: () => void }> = ({ href, children, onClick }) => (
  <li>
    <a 
      href={href} 
      onClick={onClick}
      className="text-gray-400 hover:text-gray-200 transition-colors duration-150 text-sm"
      target="_blank" // Open external links in new tab
      rel="noopener noreferrer"
    >
      {children}
    </a>
  </li>
);

interface NavFooterLinkItem {
  label: string;
  href: string;
  onClick?: () => void;
}

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  const productLinks: NavFooterLinkItem[] = [
    { label: "Features", href: "https://app.pixasocial.com/features" },
    { label: "Pricing", href: "https://app.pixasocial.com/pricing" }, 
    { label: "Documentation", href: "https://app.pixasocial.com/documentation" }, 
  ];

  const companyLinks: NavFooterLinkItem[] = [
    { label: "About Us", href: "https://app.pixasocial.com/about" },
    { label: "Contact", href: "https://app.pixasocial.com/contact" },
  ];
  
  const legalLinks: NavFooterLinkItem[] = [
    { label: "Privacy Policy", href: "https://app.pixasocial.com/privacy" },
    { label: "Terms of Service", href: "https://app.pixasocial.com/terms" },
  ];

  return (
    <footer className="bg-gray-900 text-gray-300 border-t border-gray-700">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Column 1: Product Name & Tagline */}
          <div className="col-span-2 md:col-span-1">
            <h2 className="text-xl font-semibold text-white mb-2">{APP_TITLE}</h2>
            <p className="text-sm text-gray-400">
              Advanced AI for Strategic Social Engagement.
            </p>
          </div>

          {/* Column 2: Product Links */}
          <div>
            <h3 className="text-sm font-semibold text-gray-200 tracking-wider uppercase mb-3">Product</h3>
            <ul className="space-y-2">
              {productLinks.map(link => <FooterLink key={link.label} href={link.href} onClick={link.onClick}>{link.label}</FooterLink>)}
            </ul>
          </div>

          {/* Column 3: Company Links */}
          <div>
            <h3 className="text-sm font-semibold text-gray-200 tracking-wider uppercase mb-3">Company</h3>
            <ul className="space-y-2">
              {companyLinks.map(link => <FooterLink key={link.label} href={link.href} onClick={link.onClick}>{link.label}</FooterLink>)}
            </ul>
          </div>
          
          {/* Column 4: Legal Links */}
          <div>
            <h3 className="text-sm font-semibold text-gray-200 tracking-wider uppercase mb-3">Legal</h3>
            <ul className="space-y-2">
               {legalLinks.map(link => <FooterLink key={link.label} href={link.href} onClick={link.onClick}>{link.label}</FooterLink>)}
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-8 border-t border-gray-700 flex flex-col sm:flex-row justify-between items-center">
          <p className="text-sm text-gray-400 order-2 sm:order-1 mt-4 sm:mt-0">
            &copy; {currentYear} {APP_TITLE}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

