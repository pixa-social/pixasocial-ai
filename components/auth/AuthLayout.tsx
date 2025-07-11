import React from 'react';
import { AuthViewType } from '../../types';
import { HomePageView } from './HomePageView';
import { LoginPageView } from './LoginPageView';
import { RegisterPageView } from './RegisterPageView';
import { FeaturesPageView } from './pages/FeaturesPageView';
import { PricingPageView } from './pages/PricingPageView';
import { DocumentationPageView } from './pages/DocumentationPageView';
import { AboutPageView } from './pages/AboutPageView';
import { ContactPageView } from './pages/ContactPageView';
import { PrivacyPolicyPageView } from './pages/PrivacyPolicyPageView';
import { TermsOfServicePageView } from './pages/TermsOfServicePageView';
import { AuthHeader } from './AuthHeader';
import { AuthFooter } from './AuthFooter';

interface AuthLayoutProps {
  authView: AuthViewType;
  setAuthView: (view: AuthViewType) => void;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ authView, setAuthView }) => {
  const renderAuthView = () => {
    switch (authView) {
      case 'login':
        return <LoginPageView setAuthView={setAuthView} />;
      case 'register':
        return <RegisterPageView setAuthView={setAuthView} />;
      case 'features':
        return <FeaturesPageView />;
      case 'pricing':
        return <PricingPageView setAuthView={setAuthView} />;
      case 'documentation':
        return <DocumentationPageView />;
      case 'about':
        return <AboutPageView />;
      case 'contact':
        return <ContactPageView />;
      case 'privacy':
        return <PrivacyPolicyPageView />;
      case 'terms':
        return <TermsOfServicePageView />;
      case 'home':
      default:
        return <HomePageView setAuthView={setAuthView} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-textPrimary">
      <AuthHeader authView={authView} setAuthView={setAuthView} />

      <main className="flex-grow">
        <div className="w-full">
          {renderAuthView()}
        </div>
      </main>

      <AuthFooter setAuthView={setAuthView} />
    </div>
  );
};