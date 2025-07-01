import React from 'react';
import { APP_TITLE } from '../../constants';
import { AuthViewType } from '../../types';
import { HomePageView } from './HomePageView';
import { LoginPageView } from './LoginPageView';
import { RegisterPageView } from './RegisterPageView';
import { 
    XIcon, FacebookIcon, InstagramIcon, LinkedInIcon, YouTubeIcon 
} from '../ui/Icons'; // Assuming you might want social icons later

interface AuthLayoutProps {
  authView: AuthViewType;
  setAuthView: (view: AuthViewType) => void;
  onLoginSuccess: (email: string, password: string) => void;
  onRegisterSuccess: (email: string, password: string, name: string) => void;
}

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

export const AuthLayout: React.FC<AuthLayoutProps> = ({ authView, setAuthView, onLoginSuccess, onRegisterSuccess }) => {
  const renderAuthView = () => {
    switch (authView) {
      case 'login':
        return <LoginPageView setAuthView={setAuthView} onLoginSuccess={onLoginSuccess} />;
      case 'register':
        return <RegisterPageView setAuthView={setAuthView} onRegisterSuccess={onRegisterSuccess} />;
      case 'home':
      default:
        return <HomePageView setAuthView={setAuthView} />;
    }
  };

  const currentYear = new Date().getFullYear();

  const productLinks: NavFooterLinkItem[] = [
    { label: "Features", href: "https://app.pixasocial.com/features" },
    { label: "Pricing", href: "https://app.pixasocial.com/pricing" }, 
    { label: "Documentation", href: "https://app.pixasocial.com/documentation" }, 
  ];

  const companyLinks: NavFooterLinkItem[] = [
    { label: "About Us", href: "https://app.pixasocial.com/about" },
    { label: "Methodology", href: "https://app.pixasocial.com/methodology" }, 
    { label: "Contact", href: "https://app.pixasocial.com/contact" },
  ];
  
  const legalLinks: NavFooterLinkItem[] = [
    { label: "Privacy Policy", href: "https://app.pixasocial.com/privacy" },
    { label: "Terms of Service", href: "https://app.pixasocial.com/terms" },
  ];

  // Social links - prepared if you want to add them
  const socialLinks: NavFooterLinkItem[] = [
    { label: "X", href: "#", /* icon: <XIcon className="w-5 h-5" /> */ }, // Icon prop not used by FooterLink
    { label: "Facebook", href: "#", /* icon: <FacebookIcon className="w-5 h-5" /> */ },
    { label: "LinkedIn", href: "#", /* icon: <LinkedInIcon className="w-5 h-5" /> */ },
  ];


  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-900 via-primary to-gray-900 text-white">
      <header className="py-6 px-4 sm:px-6 lg:px-8 shadow-lg bg-gray-900 bg-opacity-30 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 
            className="text-3xl font-bold tracking-tight cursor-pointer transition-opacity hover:opacity-80" 
            onClick={() => setAuthView('home')}
            aria-label={`${APP_TITLE} - Home`}
          >
            {APP_TITLE}
          </h1>
          <nav className="space-x-2 sm:space-x-4">
            {authView !== 'home' && (
                <button
                onClick={() => setAuthView('home')}
                className="px-3 py-2 text-sm font-medium hover:bg-blue-700 rounded-md transition-colors"
              >
                Home
              </button>
            )}
            {authView !== 'login' && (
              <button
                onClick={() => setAuthView('login')}
                className="px-3 py-2 text-sm font-medium hover:bg-blue-700 rounded-md transition-colors"
              >
                Login
              </button>
            )}
            {authView !== 'register' && (
              <button
                onClick={() => setAuthView('register')}
                className="px-3 py-2 text-sm font-medium bg-accent hover:bg-emerald-600 rounded-md transition-colors"
              >
                Sign Up
              </button>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-grow flex items-center justify-center">
        <div className="w-full"> 
          {renderAuthView()}
        </div>
      </main>

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
            {/* Optional: Social Media Icons 
            <div className="flex space-x-5 order-1 sm:order-2">
              {socialLinks.map(social => (
                <a key={social.label} href={social.href} className="text-gray-400 hover:text-gray-300" aria-label={social.label}>
                  {(social as any).icon} // Cast needed if icon is part of NavFooterLinkItem and not directly used by FooterLink
                </a>
              ))}
            </div>
            */}
          </div>
        </div>
      </footer>
    </div>
  );
};
