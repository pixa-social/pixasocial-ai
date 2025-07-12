
import React, { useMemo } from 'react';
import { APP_TITLE } from '../../constants';
import { AuthViewType } from '../../types';

interface FooterLinkProps {
  children: React.ReactNode;
  onClick?: () => void;
}

const FooterLink: React.FC<FooterLinkProps> = ({ children, onClick }) => (
  <li>
    <button
      onClick={onClick}
      className="text-textSecondary hover:text-white transition-colors duration-150 text-sm text-left"
    >
      {children}
    </button>
  </li>
);

interface NavFooterLinkItem {
  label: string;
  view: AuthViewType;
}

interface AuthFooterProps {
  setAuthView: (view: AuthViewType) => void;
}

export const AuthFooter: React.FC<AuthFooterProps> = ({ setAuthView }) => {
  const currentYear = useMemo(() => new Date().getFullYear(), []);

  const productLinks: NavFooterLinkItem[] = [
    { label: "Features", view: "features" },
    { label: "Pricing", view: "pricing" },
    { label: "Documentation", view: "documentation" },
  ];

  const companyLinks: NavFooterLinkItem[] = [
    { label: "About Us", view: "about" },
    { label: "Contact", view: "contact" },
  ];

  const legalLinks: NavFooterLinkItem[] = [
    { label: "Privacy Policy", view: "privacy" },
    { label: "Terms of Service", view: "terms" },
  ];

  return (
    <footer className="bg-background text-textPrimary border-t border-lightBorder">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <h2 className="text-xl font-semibold text-white mb-2">{APP_TITLE}</h2>
            <p className="text-sm text-textSecondary">
              Advanced AI for Strategic Social Engagement.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase mb-3">Product</h3>
            <ul className="space-y-2">
              {productLinks.map(link => <FooterLink key={link.label} onClick={() => setAuthView(link.view)}>{link.label}</FooterLink>)}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase mb-3">Company</h3>
            <ul className="space-y-2">
              {companyLinks.map(link => <FooterLink key={link.label} onClick={() => setAuthView(link.view)}>{link.label}</FooterLink>)}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase mb-3">Legal</h3>
            <ul className="space-y-2">
               {legalLinks.map(link => <FooterLink key={link.label} onClick={() => setAuthView(link.view)}>{link.label}</FooterLink>)}
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-8 border-t border-lightBorder flex flex-col sm:flex-row justify-between items-center">
          <p className="text-sm text-textSecondary order-2 sm:order-1 mt-4 sm:mt-0">
            &copy; {currentYear} {APP_TITLE}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};
